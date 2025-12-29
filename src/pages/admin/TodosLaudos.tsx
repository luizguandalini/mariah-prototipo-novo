import { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import LaudoDetalhes from "../../components/LaudoDetalhes";
import EditarEnderecoLaudo from "../../components/EditarEnderecoLaudo";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { laudosService, type Laudo } from "../../services/laudos";
import { toast } from "sonner";

export default function TodosLaudos() {
  const [laudos, setLaudos] = useState<Laudo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 15;
  const [laudoEditando, setLaudoEditando] = useState<Laudo | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    id: string;
    endereco: string;
  }>({ isOpen: false, id: "", endereco: "" });

  useEffect(() => {
    fetchAllLaudos();
  }, []);

  const fetchAllLaudos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await laudosService.getAllLaudos();
      setLaudos(data);
    } catch (err) {
      setError("Erro ao carregar laudos");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLaudo = async (id: string) => {
    try {
      await laudosService.deleteLaudo(id);
      setLaudos((prevLaudos) => prevLaudos.filter((l) => l.id !== id));
      toast.success("Laudo deletado com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao deletar laudo");
      console.error("Erro ao deletar laudo:", err);
    }
  };

  const handleEnderecoAtualizado = (laudoAtualizado: Laudo) => {
    // Atualizar o laudo na lista
    setLaudos((prevLaudos) =>
      prevLaudos.map((l) => (l.id === laudoAtualizado.id ? laudoAtualizado : l))
    );
  };

  const mapStatus = (status: string) => {
    const mapping: Record<string, string> = {
      NAO_INICIADO: "nao_iniciado",
      EM_ANDAMENTO: "processando",
      CONCLUIDO: "concluido",
      PARALISADO: "paralisado",
    };
    return mapping[status] || status.toLowerCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const getStatusBadge = (status: string) => {
    const config = {
      concluido: {
        bg: "bg-green-100 dark:bg-green-900/30",
        text: "text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800",
        label: "Concluído",
      },
      processando: {
        bg: "bg-yellow-100 dark:bg-yellow-900/30",
        text: "text-yellow-800 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800",
        label: "Processando",
      },
      nao_iniciado: {
        bg: "bg-gray-100 dark:bg-gray-800",
        text: "text-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700",
        label: "Não Iniciado",
      },
      paralisado: {
        bg: "bg-red-100 dark:bg-red-900/30",
        text: "text-red-800 dark:text-red-400 border border-red-200 dark:border-red-800",
        label: "Paralisado",
      },
    };
    const statusConfig =
      config[status as keyof typeof config] || config.nao_iniciado;
    const { bg, text, label } = statusConfig;
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm flex items-center gap-1.5 ${bg} ${text}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${status === 'processando' ? 'animate-pulse bg-yellow-400' : ''} ${status === 'concluido' ? 'bg-green-400' : ''} ${status === 'paralisado' ? 'bg-red-400' : ''} ${status === 'nao_iniciado' ? 'bg-gray-400' : ''}`}></span>
        {label}
      </span>
    );
  };

  // Paginação
  const totalPaginas = Math.ceil(laudos.length / itensPorPagina);
  const indexInicio = (paginaAtual - 1) * itensPorPagina;
  const indexFim = indexInicio + itensPorPagina;
  const laudosPaginados = laudos.slice(indexInicio, indexFim);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-[var(--text-primary)] transition-colors">Todos os Laudos</h2>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-800 mb-4">{error}</p>
            <button
              onClick={fetchAllLaudos}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Tentar Novamente
            </button>
          </div>
        ) : laudos.length === 0 ? (
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-12 text-center transition-colors">
            <p className="text-[var(--text-secondary)] text-lg">Nenhum laudo encontrado</p>
          </div>
        ) : (
          <>
            {/* Grid de Cards */}
            <div className="grid grid-cols-1 gap-4">
                {laudosPaginados.map((laudo) => (
                <div
                  key={laudo.id}
                  className="bg-[var(--bg-secondary)] rounded-xl shadow-sm border border-[var(--border-color)] p-6 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {getStatusBadge(mapStatus(laudo.status))}
                        <span className="text-xs text-[var(--text-secondary)] opacity-50 font-mono">
                          ID: {laudo.id.substring(0, 8)}
                        </span>
                      </div>

                      <div className="mb-3">
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
                          {laudo.rua || laudo.endereco}
                          {laudo.numero && `, ${laudo.numero}`}
                        </h3>
                        <div className="text-sm text-[var(--text-secondary)] space-y-0.5">
                          {laudo.complemento && <div>{laudo.complemento}</div>}
                          {laudo.bairro && (
                            <div>
                              <span className="text-[var(--text-secondary)] opacity-60">Bairro:</span>{" "}
                              {laudo.bairro}
                            </div>
                          )}
                          <div className="flex flex-wrap gap-4">
                            {laudo.cidade && (
                              <span>
                                <span className="text-[var(--text-secondary)] opacity-60">Cidade:</span>{" "}
                                {laudo.cidade}
                              </span>
                            )}
                            {laudo.estado && (
                              <span>
                                <span className="text-[var(--text-secondary)] opacity-60">Estado:</span>{" "}
                                {laudo.estado}
                              </span>
                            )}
                            {laudo.cep && (
                              <span>
                                <span className="text-[var(--text-secondary)] opacity-60">CEP:</span>{" "}
                                {laudo.cep}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-[var(--text-secondary)]">
                        <div>
                          <span className="text-[var(--text-secondary)] opacity-60">Ambientes:</span>{" "}
                          <span className="font-medium text-[var(--text-primary)]">
                            {laudo.totalAmbientes}
                          </span>
                        </div>
                        <div>
                          <span className="text-[var(--text-secondary)] opacity-60">Fotos:</span>{" "}
                          <span className="font-medium text-[var(--text-primary)]">
                            {laudo.totalFotos}
                          </span>
                        </div>
                        {laudo.tamanho && (
                          <div>
                            <span className="text-[var(--text-secondary)] opacity-60">Tamanho:</span>{" "}
                            <span className="font-medium text-[var(--text-primary)]">
                              {laudo.tamanho}
                            </span>
                          </div>
                        )}
                        <div>
                          <span className="text-[var(--text-secondary)] opacity-60">Data:</span>{" "}
                          <span className="font-medium text-[var(--text-primary)]">
                            {formatDate(laudo.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      {mapStatus(laudo.status) === "concluido" &&
                        laudo.pdfUrl && (
                          <a
                            href={laudo.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark text-sm font-medium text-center whitespace-nowrap transition-colors shadow-sm"
                          >
                            📄 Ver PDF
                          </a>
                        )}
                      <button
                        onClick={() => setLaudoEditando(laudo)}
                        className="px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-secondary)] text-sm font-medium whitespace-nowrap transition-all shadow-sm"
                      >
                        ✏️ Editar Endereço
                      </button>
                      <button
                        onClick={() =>
                          setConfirmDelete({
                            isOpen: true,
                            id: laudo.id,
                            endereco: laudo.rua || laudo.endereco,
                          })
                        }
                        className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white text-sm font-medium whitespace-nowrap transition-all shadow-sm"
                      >
                        🗑️ Deletar
                      </button>
                    </div>
                  </div>

                  {/* Detalhes do Laudo (Expansível) */}
                  <LaudoDetalhes laudo={laudo} />
                </div>
              ))}
            </div>

            {/* Paginação */}
            {totalPaginas > 1 && (
              <div className="flex items-center justify-between bg-[var(--bg-secondary)] rounded-xl shadow-sm border border-[var(--border-color)] p-4 mt-6 transition-colors">
                <div className="text-sm text-[var(--text-secondary)]">
                  Mostrando {indexInicio + 1} a{" "}
                  {Math.min(indexFim, laudos.length)} de {laudos.length} laudos
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                    disabled={paginaAtual === 1}
                    className="px-4 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--bg-secondary)] transition-all"
                  >
                    ← Anterior
                  </button>
                  <div className="flex gap-1">
                    {Array.from(
                      { length: Math.min(totalPaginas, 10) },
                      (_, i) => {
                        let pagina: number;
                        if (totalPaginas <= 10) {
                          pagina = i + 1;
                        } else if (paginaAtual <= 5) {
                          pagina = i + 1;
                        } else if (paginaAtual >= totalPaginas - 4) {
                          pagina = totalPaginas - 9 + i;
                        } else {
                          pagina = paginaAtual - 4 + i;
                        }
                        return (
                          <button
                            key={pagina}
                            onClick={() => setPaginaAtual(pagina)}
                            className={`px-3 py-2 rounded-lg transition-all ${
                              paginaAtual === pagina
                                ? "bg-primary text-white shadow-md"
                                : "border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                            }`}
                          >
                            {pagina}
                          </button>
                        );
                      }
                    )}
                  </div>
                  <button
                    onClick={() =>
                      setPaginaAtual((p) => Math.min(totalPaginas, p + 1))
                    }
                    disabled={paginaAtual === totalPaginas}
                    className="px-4 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--bg-secondary)] transition-all"
                  >
                    Próxima →
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Modal de Edição de Endereço */}
        {laudoEditando && (
          <EditarEnderecoLaudo
            laudo={laudoEditando}
            onClose={() => setLaudoEditando(null)}
            onSuccess={handleEnderecoAtualizado}
          />
        )}

        <ConfirmModal
          isOpen={confirmDelete.isOpen}
          onClose={() =>
            setConfirmDelete({ ...confirmDelete, isOpen: false })
          }
          onConfirm={() => handleDeleteLaudo(confirmDelete.id)}
          title="Deletar Laudo"
          message={`Tem certeza que deseja deletar o laudo de "${confirmDelete.endereco}"? Esta ação não pode ser desfeita.`}
          confirmLabel="Deletar"
          variant="danger"
        />
      </div>
    </DashboardLayout>
  );
}
