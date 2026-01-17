import { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import LaudoDetalhes from "../../components/LaudoDetalhes";
import EditarEnderecoLaudo from "../../components/EditarEnderecoLaudo";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { laudosService, type Laudo } from "../../services/laudos";
import { toast } from "sonner";
import { queueService } from "../../services/queue";
import { useQueueSocket } from "../../hooks/useQueueSocket";
import { Bot, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";

export default function TodosLaudos() {
  const location = useLocation();
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
  const [analisandoLaudoId, setAnalisandoLaudoId] = useState<string | null>(null);

  // WebSocket Hook
  const { progressMap, statusMap, joinLaudo, leaveLaudo } = useQueueSocket();

  // Entrar nas salas dos laudos ao carregar e quando a lista mudar
  useEffect(() => {
    laudos.forEach(laudo => {
       joinLaudo(laudo.id);
    });
    
    return () => {
        laudos.forEach(laudo => leaveLaudo(laudo.id));
    };
  }, [laudos, joinLaudo, leaveLaudo]);

  // Atualizar status localmente quando receber via WS
  useEffect(() => {
     if (Object.keys(statusMap).length > 0) {
         setLaudos(prev => prev.map(l => {
             if (statusMap[l.id]) {
                 const wsStatus = statusMap[l.id].toUpperCase();
                 
                 if (wsStatus === 'COMPLETED') return { ...l, status: 'CONCLUIDO' as any };
                 if (wsStatus === 'PROCESSING') return { ...l, status: 'EM_ANDAMENTO' as any };
                 if (wsStatus === 'ERROR') return { ...l, status: 'ERROR' as any };
                 
                 return { ...l, status: wsStatus as any };
             }
             return l;
         }));
     }
  }, [statusMap]);

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

  const handleIniciarAnalise = async (laudoId: string, force: boolean = false) => {
    try {
      setAnalisandoLaudoId(laudoId);
      await queueService.addToQueue(laudoId, force);
      
      if (force) {
          toast.success("Reanálise iniciada com sucesso!");
      } else {
          toast.success("Laudo adicionado à fila de análise!");
      }
      
      // Atualizar status do laudo na lista
      setLaudos((prevLaudos) =>
        prevLaudos.map((l) =>
          l.id === laudoId ? { ...l, status: "EM_ANDAMENTO" as any } : l
        )
      );
    } catch (err: any) {
      if (err.message && err.message.includes("já possui todas as imagens analisadas") && !force) {
        toast.success("Este laudo já foi totalmente analisado!");
        setLaudos((prevLaudos) =>
          prevLaudos.map((l) =>
            l.id === laudoId ? { ...l, status: "CONCLUIDO" as any } : l
          )
        );
      } else {
        toast.error(err.message || "Erro ao iniciar análise");
      }
    } finally {
      setAnalisandoLaudoId(null);
    }
  };

  const mapStatus = (status: string) => {
    const mapping: Record<string, string> = {
      NAO_INICIADO: "nao_iniciado",
      EM_ANDAMENTO: "processando",
      PROCESSING: "processando",
      CONCLUIDO: "concluido",
      COMPLETED: "concluido",
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
                  className="bg-[var(--bg-secondary)] rounded-xl shadow-sm border border-[var(--border-color)] p-4 sm:p-6 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        {getStatusBadge(mapStatus(laudo.status))}
                        <span className="text-xs text-[var(--text-secondary)] opacity-50 font-mono">
                          ID: {laudo.id.substring(0, 8)}
                        </span>
                        
                        {/* Progress Bar for Processing Status */}
                        {(mapStatus(laudo.status) === "processando" || progressMap[laudo.id]) && mapStatus(laudo.status) !== "concluido" && (
                          <div className="flex-1 min-w-[200px] max-w-xs sm:ml-4">
                              <div className="flex justify-between text-xs mb-1 text-[var(--text-secondary)]">
                                  <span>Analisando... ({progressMap[laudo.id]?.processedImages || 0}/{progressMap[laudo.id]?.totalImages || '?'})</span>
                                  <span>{progressMap[laudo.id]?.percentage || 0}%</span>
                              </div>
                              <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                  <motion.div 
                                      className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                                      initial={{ width: 0 }}
                                      animate={{ width: `${progressMap[laudo.id]?.percentage || 0}%` }}
                                      transition={{ duration: 0.5 }}
                                  />
                              </div>
                          </div>
                        )}
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
                    <div className="flex flex-col gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                      {mapStatus(laudo.status) === "concluido" &&
                        laudo.pdfUrl && (
                          <Link
                            to={`/dashboard/laudos/${laudo.id}/pdf`}
                            state={{ from: location.pathname }}
                            className="w-full sm:w-auto px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark text-sm font-medium text-center whitespace-nowrap transition-colors shadow-sm"
                          >
                            📄 Ver PDF
                          </Link>
                        )}
                      <button
                        onClick={() => setLaudoEditando(laudo)}
                        className="w-full sm:w-auto px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-secondary)] text-sm font-medium whitespace-nowrap transition-all shadow-sm"
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
                        className="w-full sm:w-auto px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white text-sm font-medium whitespace-nowrap transition-all shadow-sm"
                      >
                        🗑️ Deletar
                      </button>
                      
                       {/* Iniciar Análise / Reanalisar */}
                       {(mapStatus(laudo.status) === "nao_iniciado" || 
                         mapStatus(laudo.status) === "concluido" || 
                         mapStatus(laudo.status) === "paralisado" ||
                         mapStatus(laudo.status) === "error") && (
                        <button
                          onClick={() => handleIniciarAnalise(laudo.id, mapStatus(laudo.status) !== "nao_iniciado")}
                          disabled={analisandoLaudoId === laudo.id}
                          className={`w-full sm:w-auto px-4 py-2 text-white rounded-lg text-sm font-medium whitespace-nowrap transition-all shadow-sm flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed
                            ${mapStatus(laudo.status) === "nao_iniciado" 
                              ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                              : "bg-blue-600 hover:bg-blue-700"}
                          `}
                        >
                          {analisandoLaudoId === laudo.id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              {mapStatus(laudo.status) === "nao_iniciado" ? "Iniciando..." : "Reiniciando..."}
                            </>
                          ) : (
                            <>
                              {mapStatus(laudo.status) === "nao_iniciado" ? (
                                <>
                                  <Bot className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                  Iniciar IA
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4 group-hover:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                  Reanalisar
                                </>
                              )}
                            </>
                          )}
                        </button>
                      )}
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
