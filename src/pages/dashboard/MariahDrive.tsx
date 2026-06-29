import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  ChevronRight,
  Folder,
  MoreVertical,
  Trash2,
  Download,
  X,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Loader2,
  ImageOff,
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "../../components/layout/DashboardLayout";
import ConfirmModal from "../../components/ui/ConfirmModal";
import {
  laudosService,
  type AmbienteWebInfo,
  type ImagemLaudo,
} from "../../services/laudos";
import { downloadService, type DownloadJobResponse } from "../../services/download";
import { useDownloadSocket } from "../../hooks/useDownloadSocket";
import { useAuth } from "../../contexts/AuthContext";

/**
 * Mariah Drive — visualização das fotos de um laudo com UI fiel ao Google
 * Drive. Navegação em dois níveis: ambientes como "pastas" → grade de fotos
 * do ambiente. Somente leitura quanto a legendas/metadados (sem edição, troca
 * de item, reordenação ou upload). É possível excluir uma foto.
 *
 * Reaproveita os endpoints já existentes:
 *  - getAmbientesWeb(id)
 *  - getImagensByAmbiente(id, nome, page, limit)
 *  - deleteImagem(id)
 *
 * As URLs de imagem (`img.url`) já vêm assinadas pelo backend, então não é
 * preciso resolver `signed-urls-batch` aqui.
 */

const LIMIT = 24;

export default function MariahDrive() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  // WebSocket de downloads: resolve a conclusão dos ZIPs (download:ready/error).
  const { waitForJob } = useDownloadSocket(user?.id);

  // Nível 1: pastas (ambientes)
  const [ambientes, setAmbientes] = useState<AmbienteWebInfo[]>([]);
  const [loadingAmbientes, setLoadingAmbientes] = useState(true);
  const [erroAmbientes, setErroAmbientes] = useState<string | null>(null);

  // Nível 2: fotos do ambiente aberto
  const [ambienteAberto, setAmbienteAberto] = useState<AmbienteWebInfo | null>(
    null,
  );
  const [imagens, setImagens] = useState<ImagemLaudo[]>([]);
  const [loadingImagens, setLoadingImagens] = useState(false);
  const [loadingMais, setLoadingMais] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(1);

  // Menu "⋮" aberto em um card de foto
  const [menuAbertoId, setMenuAbertoId] = useState<string | null>(null);
  // Confirmação de exclusão
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    imagem: ImagemLaudo | null;
  }>({ isOpen: false, imagem: null });
  const [excluindo, setExcluindo] = useState(false);

  // Lightbox
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Downloads
  // Fotos sendo baixadas individualmente (ids)
  const [baixandoFotos, setBaixandoFotos] = useState<Set<string>>(new Set());
  // ZIPs em geração, chaveados por alvo: "laudo" ou `ambiente:<nome>`
  const [gerandoZips, setGerandoZips] = useState<Record<string, boolean>>({});

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // ===== Downloads =====
  const handleDownloadFoto = async (img: ImagemLaudo) => {
    if (baixandoFotos.has(img.id)) return;
    setBaixandoFotos((prev) => new Set(prev).add(img.id));
    try {
      await downloadService.downloadImagem(img.id);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Não foi possível baixar a foto.");
    } finally {
      setBaixandoFotos((prev) => {
        const next = new Set(prev);
        next.delete(img.id);
        return next;
      });
    }
  };

  const baixarZip = async (
    chave: string,
    request: () => Promise<DownloadJobResponse>,
    labelGerando: string,
  ) => {
    if (gerandoZips[chave]) return;
    setGerandoZips((prev) => ({ ...prev, [chave]: true }));
    const toastId = toast.loading(labelGerando);
    try {
      // 1) Solicita o job. O backend pode já devolver `ready` (reaproveitamento)
      //    ou um job em andamento, cuja conclusão chega via WebSocket.
      const job = await request();
      if (job.status === "error") {
        throw new Error(job.erro || "Falha ao gerar o download.");
      }
      let url = job.url;
      if (job.status !== "ready" || !url) {
        // 2) Aguarda o evento `download:ready` (ou `download:error`) do socket.
        try {
          url = await waitForJob(job.jobId);
        } catch (socketErr) {
          // Rede de segurança: se o evento se perdeu (ex.: socket reconectando
          // no momento da conclusão), confirma o estado uma vez via status.
          const status = await downloadService.getJobStatus(job.jobId);
          if (status.status === "ready" && status.url) {
            url = status.url;
          } else {
            throw socketErr;
          }
        }
      }
      downloadService.abrirDownload(url);
      toast.success("Download iniciado.", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Não foi possível gerar o download.", {
        id: toastId,
      });
    } finally {
      setGerandoZips((prev) => {
        const next = { ...prev };
        delete next[chave];
        return next;
      });
    }
  };

  const handleDownloadAmbiente = (nomeAmbiente: string) => {
    if (!id) return;
    baixarZip(
      `ambiente:${nomeAmbiente}`,
      () => downloadService.requestAmbienteZip(id, nomeAmbiente),
      `Gerando ZIP de "${nomeAmbiente}"...`,
    );
  };

  const handleDownloadLaudo = () => {
    if (!id) return;
    baixarZip("laudo", () => downloadService.requestLaudoZip(id), "Gerando ZIP do laudo...");
  };

  // Volta para a página de origem (laudos do usuário ou admin) ou fallback.
  const voltarOrigem = () => {
    const from = (location.state as { from?: string } | null)?.from;
    navigate(from || "/dashboard/laudos");
  };

  // ===== Carregar ambientes (pastas) =====
  useEffect(() => {
    if (!id) return;
    let ativo = true;
    (async () => {
      try {
        setLoadingAmbientes(true);
        setErroAmbientes(null);
        const res = await laudosService.getAmbientesWeb(id);
        if (!ativo) return;
        const ordenados = [...(res.ambientes || [])].sort(
          (a, b) => a.ordem - b.ordem,
        );
        setAmbientes(ordenados);
      } catch (err) {
        console.error(err);
        if (ativo) setErroAmbientes("Não foi possível carregar as pastas.");
      } finally {
        if (ativo) setLoadingAmbientes(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, [id]);

  // ===== Carregar imagens do ambiente aberto =====
  const fetchImagens = useCallback(
    async (page: number, append = false) => {
      if (!id || !ambienteAberto) return;
      try {
        if (append) setLoadingMais(true);
        else setLoadingImagens(true);
        const res = await laudosService.getImagensByAmbiente(
          id,
          ambienteAberto.nomeAmbiente,
          page,
          LIMIT,
        );
        setImagens((prev) => {
          if (!append) return res.data;
          const map = new Map(prev.map((i) => [i.id, i]));
          res.data.forEach((i) => map.set(i.id, i));
          return Array.from(map.values()).sort((a, b) => a.ordem - b.ordem);
        });
        setHasMore(res.page < res.lastPage);
        setPaginaAtual(res.page);
      } catch (err) {
        console.error(err);
        toast.error("Não foi possível carregar as imagens.");
      } finally {
        if (append) setLoadingMais(false);
        else setLoadingImagens(false);
      }
    },
    [id, ambienteAberto],
  );

  useEffect(() => {
    if (ambienteAberto) {
      setImagens([]);
      setHasMore(false);
      setPaginaAtual(1);
      fetchImagens(1, false);
    }
  }, [ambienteAberto, fetchImagens]);

  const handleLoadMore = useCallback(() => {
    if (!ambienteAberto || loadingImagens || loadingMais || !hasMore) return;
    fetchImagens(paginaAtual + 1, true);
  }, [
    ambienteAberto,
    loadingImagens,
    loadingMais,
    hasMore,
    paginaAtual,
    fetchImagens,
  ]);

  // Scroll infinito dentro da pasta
  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !ambienteAberto) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) handleLoadMore();
      },
      { rootMargin: "240px 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [ambienteAberto, handleLoadMore]);

  // Fecha menu "⋮" ao clicar fora
  useEffect(() => {
    if (!menuAbertoId) return;
    const close = () => setMenuAbertoId(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [menuAbertoId]);

  // ===== Exclusão de foto =====
  const handleConfirmDelete = async () => {
    const imagem = confirmDelete.imagem;
    if (!imagem) return;
    try {
      setExcluindo(true);
      await laudosService.deleteImagem(imagem.id);
      setImagens((prev) => prev.filter((i) => i.id !== imagem.id));
      setAmbientes((prev) =>
        prev.map((a) =>
          a.nomeAmbiente === imagem.ambiente
            ? { ...a, totalImagens: Math.max(0, a.totalImagens - 1) }
            : a,
        ),
      );
      toast.success("Foto removida.");
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível remover a foto.");
    } finally {
      setExcluindo(false);
      setConfirmDelete({ isOpen: false, imagem: null });
    }
  };

  // ===== Lightbox navegação =====
  const fecharLightbox = () => setLightboxIndex(null);
  const lightboxPrev = () =>
    setLightboxIndex((i) =>
      i === null ? null : (i - 1 + imagens.length) % imagens.length,
    );
  const lightboxNext = () =>
    setLightboxIndex((i) => (i === null ? null : (i + 1) % imagens.length));

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") fecharLightbox();
      else if (e.key === "ArrowLeft") lightboxPrev();
      else if (e.key === "ArrowRight") lightboxNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, imagens.length]);

  const nomeFoto = (img: ImagemLaudo, index: number) =>
    (img.legenda && img.legenda.trim()) || `Foto ${index + 1}`;

  return (
    <DashboardLayout>
      {/* Container estilo Google Drive: fundo claro, cantos arredondados */}
      <div className="min-h-[calc(100vh-7rem)] rounded-2xl bg-white text-[#1f1f1f] shadow-sm border border-[#e0e0e0] overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-[#e0e0e0]">
          <button
            onClick={ambienteAberto ? () => setAmbienteAberto(null) : voltarOrigem}
            className="p-2 rounded-full hover:bg-[#f1f3f4] text-[#5f6368] transition-colors"
            title="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <img src="/google-drive.svg" alt="" className="w-6 h-6" />
          <span className="text-lg font-medium text-[#5f6368] select-none">
            Mariah Drive
          </span>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1 px-6 py-3 text-[#5f6368]">
          <button
            onClick={() => setAmbienteAberto(null)}
            className={`text-xl font-normal hover:underline ${
              ambienteAberto ? "" : "text-[#1f1f1f] font-medium"
            }`}
          >
            Meu Drive
          </button>
          {ambienteAberto && (
            <>
              <ChevronRight className="w-5 h-5 mx-1 opacity-70" />
              <span className="text-xl font-medium text-[#1f1f1f]">
                {ambienteAberto.nomeAmbiente}
              </span>
            </>
          )}
        </div>

        <div className="px-6 pb-10">
          {/* ===== NÍVEL 1: PASTAS (AMBIENTES) ===== */}
          {!ambienteAberto && (
            <>
              {loadingAmbientes ? (
                <div className="flex items-center justify-center py-24 text-[#5f6368]">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  Carregando...
                </div>
              ) : erroAmbientes ? (
                <div className="py-24 text-center text-red-500">
                  {erroAmbientes}
                </div>
              ) : ambientes.length === 0 ? (
                <EmptyState
                  titulo="Nenhuma pasta por aqui"
                  descricao="Este laudo ainda não possui ambientes com fotos."
                />
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-[#5f6368]">Pastas</p>
                    <button
                      onClick={handleDownloadLaudo}
                      disabled={gerandoZips["laudo"]}
                      className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#dadce0] text-sm font-medium text-[#1f1f1f] hover:bg-[#f1f3f4] transition-colors disabled:opacity-60"
                      title="Baixar todas as fotos do laudo (.zip)"
                    >
                      {gerandoZips["laudo"] ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      {gerandoZips["laudo"] ? "Gerando..." : "Baixar tudo"}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {ambientes.map((amb) => {
                      const baixandoAmb = !!gerandoZips[`ambiente:${amb.nomeAmbiente}`];
                      return (
                        <div
                          key={amb.nomeAmbiente}
                          className="relative flex items-center gap-3 px-4 py-3 rounded-lg bg-[#f0f4f9] hover:bg-[#e3e8ef] transition-colors group"
                        >
                          <button
                            onClick={() => setAmbienteAberto(amb)}
                            className="flex items-center gap-3 flex-1 min-w-0 text-left"
                          >
                            <Folder
                              className="w-6 h-6 text-[#5f6368] shrink-0"
                              fill="#5f6368"
                              strokeWidth={0}
                            />
                            <span className="flex-1 min-w-0">
                              <span className="block truncate text-sm font-medium text-[#1f1f1f]">
                                {amb.nomeAmbiente}
                              </span>
                              <span className="block text-xs text-[#5f6368]">
                                {amb.totalImagens}{" "}
                                {amb.totalImagens === 1 ? "item" : "itens"}
                              </span>
                            </span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadAmbiente(amb.nomeAmbiente);
                            }}
                            disabled={baixandoAmb}
                            className="shrink-0 p-1.5 rounded-full text-[#5f6368] hover:bg-white/80 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity disabled:opacity-100"
                            title={`Baixar "${amb.nomeAmbiente}" (.zip)`}
                          >
                            {baixandoAmb ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}

          {/* ===== NÍVEL 2: GRADE DE FOTOS ===== */}
          {ambienteAberto && (
            <>
              {loadingImagens ? (
                <div className="flex items-center justify-center py-24 text-[#5f6368]">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  Carregando...
                </div>
              ) : imagens.length === 0 ? (
                <EmptyState
                  titulo="Pasta vazia"
                  descricao="Não há fotos neste ambiente."
                />
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-[#5f6368]">Arquivos</p>
                    <button
                      onClick={() => handleDownloadAmbiente(ambienteAberto.nomeAmbiente)}
                      disabled={!!gerandoZips[`ambiente:${ambienteAberto.nomeAmbiente}`]}
                      className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#dadce0] text-sm font-medium text-[#1f1f1f] hover:bg-[#f1f3f4] transition-colors disabled:opacity-60"
                      title={`Baixar "${ambienteAberto.nomeAmbiente}" (.zip)`}
                    >
                      {gerandoZips[`ambiente:${ambienteAberto.nomeAmbiente}`] ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      {gerandoZips[`ambiente:${ambienteAberto.nomeAmbiente}`]
                        ? "Gerando..."
                        : "Baixar pasta"}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {imagens.map((img, index) => (
                      <div
                        key={img.id}
                        className="group relative rounded-xl border border-[#dadce0] bg-white overflow-hidden hover:shadow-md transition-shadow"
                      >
                        {/* Thumbnail */}
                        <button
                          onClick={() => setLightboxIndex(index)}
                          className="block w-full aspect-square bg-[#f1f3f4]"
                          title={nomeFoto(img, index)}
                        >
                          <img
                            src={img.url}
                            alt={nomeFoto(img, index)}
                            loading="lazy"
                            className="w-full h-full object-cover"
                          />
                        </button>

                        {/* Rodapé: ícone + nome (estilo arquivo do Drive) */}
                        <div className="flex items-center gap-2 px-3 py-2 border-t border-[#e8eaed]">
                          <img
                            src="/google-drive.svg"
                            alt=""
                            className="w-4 h-4 shrink-0"
                          />
                          <span className="flex-1 truncate text-sm text-[#1f1f1f]">
                            {nomeFoto(img, index)}
                          </span>
                        </div>

                        {/* Botão de menu "⋮" (aparece no hover) */}
                        <div className="absolute top-2 right-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuAbertoId(
                                menuAbertoId === img.id ? null : img.id,
                              );
                            }}
                            className="p-1.5 rounded-full bg-white/90 text-[#5f6368] shadow-sm opacity-0 group-hover:opacity-100 hover:bg-white transition-opacity"
                            title="Mais ações"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {menuAbertoId === img.id && (
                            <div
                              className="absolute right-0 mt-1 w-40 rounded-lg bg-white shadow-lg border border-[#e0e0e0] py-1 z-20"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => {
                                  setMenuAbertoId(null);
                                  handleDownloadFoto(img);
                                }}
                                disabled={baixandoFotos.has(img.id)}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#1f1f1f] hover:bg-[#f1f3f4] transition-colors disabled:opacity-60"
                              >
                                {baixandoFotos.has(img.id) ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Download className="w-4 h-4" />
                                )}
                                Baixar
                              </button>
                              <button
                                onClick={() => {
                                  setMenuAbertoId(null);
                                  setConfirmDelete({
                                    isOpen: true,
                                    imagem: img,
                                  });
                                }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                                Remover
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Sentinela do scroll infinito + "carregar mais" */}
                  {hasMore && (
                    <div
                      ref={loadMoreRef}
                      className="flex justify-center py-8"
                    >
                      <button
                        onClick={handleLoadMore}
                        disabled={loadingMais}
                        className="px-5 py-2 rounded-full border border-[#dadce0] text-sm font-medium text-[#1f1f1f] hover:bg-[#f1f3f4] transition-colors disabled:opacity-60"
                      >
                        {loadingMais ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Carregando...
                          </span>
                        ) : (
                          "Carregar mais"
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* ===== LIGHTBOX ===== */}
      {lightboxIndex !== null && imagens[lightboxIndex] && (
        <div
          className="fixed inset-0 z-[120] bg-black/90 flex items-center justify-center"
          onClick={fecharLightbox}
        >
          <button
            onClick={fecharLightbox}
            className="absolute top-4 right-4 p-2 rounded-full text-white/90 hover:bg-white/10 transition-colors"
            title="Fechar"
          >
            <X className="w-7 h-7" />
          </button>

          {imagens.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                lightboxPrev();
              }}
              className="absolute left-4 p-2 rounded-full text-white/90 hover:bg-white/10 transition-colors"
              title="Anterior"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}

          <figure
            className="max-w-[90vw] max-h-[88vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={imagens[lightboxIndex].url}
              alt={nomeFoto(imagens[lightboxIndex], lightboxIndex)}
              className="max-w-[90vw] max-h-[80vh] object-contain rounded-lg"
            />
            <figcaption className="mt-3 text-sm text-white/80">
              {nomeFoto(imagens[lightboxIndex], lightboxIndex)}
            </figcaption>
          </figure>

          {imagens.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                lightboxNext();
              }}
              className="absolute right-4 p-2 rounded-full text-white/90 hover:bg-white/10 transition-colors"
              title="Próxima"
            >
              <ChevronRightIcon className="w-8 h-8" />
            </button>
          )}
        </div>
      )}

      {/* ===== CONFIRMAÇÃO DE EXCLUSÃO ===== */}
      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={() =>
          !excluindo && setConfirmDelete({ isOpen: false, imagem: null })
        }
        onConfirm={handleConfirmDelete}
        title="Remover foto"
        message="Tem certeza que deseja remover esta foto? Esta ação não pode ser desfeita."
        confirmLabel="Remover"
        variant="danger"
        isLoading={excluindo}
        loadingLabel="Removendo..."
        closeOnConfirm={false}
      />
    </DashboardLayout>
  );
}

function EmptyState({
  titulo,
  descricao,
}: {
  titulo: string;
  descricao: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <ImageOff className="w-12 h-12 text-[#bdc1c6] mb-4" />
      <p className="text-base font-medium text-[#3c4043]">{titulo}</p>
      <p className="text-sm text-[#5f6368] mt-1">{descricao}</p>
    </div>
  );
}
