import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Button from "../../components/ui/Button";
import LaudoDetalhes from "../../components/LaudoDetalhes";
import EditarEnderecoLaudo from "../../components/EditarEnderecoLaudo";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { laudosService, type Laudo } from "../../services/laudos";
import { queueService } from "../../services/queue";
import { useAuth } from "../../contexts/AuthContext";
import { UserRole } from "../../types/auth";
import { toast } from "sonner";
import { FileText, Camera, Bot, Pencil, Trash2, Loader2 } from "lucide-react";
import { useQueueSocket } from "../../hooks/useQueueSocket";

export default function MeusLaudos() {
  const { user, refreshUser } = useAuth();
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [laudos, setLaudos] = useState<Laudo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 10;
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
       // Join logic: join all to listen for starts, or just active ones?
       // Joining all lets us know when any laudo starts processing.
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
                 // Map WS status (processing, completed, error) to Frontend status
                 // WS sends lowercase: processing, completed
                 const wsStatus = statusMap[l.id].toUpperCase();
                 
                 // Se completou, vamos garantir que o status seja CONCLUIDO para liberar o botão PDF
                 if (wsStatus === 'COMPLETED') return { ...l, status: 'CONCLUIDO' as any };
                 if (wsStatus === 'PROCESSING') return { ...l, status: 'EM_ANDAMENTO' as any };
                 if (wsStatus === 'ERROR') return { ...l, status: 'ERROR' as any }; // ou lidar com erro
                 
                 return { ...l, status: wsStatus as any };
             }
             return l;
         }));
     }
  }, [statusMap]);

  useEffect(() => {
    fetchLaudos();
  }, []);

  const fetchLaudos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await laudosService.getMyLaudos();
      setLaudos(data);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar laudos");
      console.error("Erro ao buscar laudos:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLaudo = async (id: string) => {
    try {
      await laudosService.deleteLaudo(id);
      
      // Atualizar créditos do usuário (novo fluxo)
      if (refreshUser) {
        await refreshUser();
      }

      // Atualiza a lista removendo o laudo deletado
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

  const handleIniciarAnalise = async (laudoId: string) => {
    try {
      setAnalisandoLaudoId(laudoId);
      await queueService.addToQueue(laudoId);
      toast.success("Laudo adicionado à fila de análise!");
      // Atualizar status do laudo na lista
      setLaudos((prevLaudos) =>
        prevLaudos.map((l) =>
          l.id === laudoId ? { ...l, status: "EM_ANDAMENTO" as any } : l
        )
      );
    } catch (err: any) {
      if (err.message && err.message.includes("já possui todas as imagens analisadas")) {
        toast.success("Este laudo já foi totalmente analisado!");
        // Atualizar status do laudo localmente para refletir a realidade
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

  const mapStatus = (
    status: string
  ): "nao_iniciado" | "processando" | "concluido" | "paralisado" => {
    const statusMap: Record<
      string,
      "nao_iniciado" | "processando" | "concluido" | "paralisado"
    > = {
      NAO_INICIADO: "nao_iniciado",
      EM_ANDAMENTO: "processando",
      PROCESSING: "processando", // Added mapping for new WS status
      CONCLUIDO: "concluido",
      COMPLETED: "concluido", // Added mapping
      PARALISADO: "paralisado",
    };

    return statusMap[status.toUpperCase()] || "nao_iniciado";
  };

  const getStatusBadge = (status: string) => {
    const config = {
      concluido: {
        bg: "bg-green-500/10",
        text: "text-green-500 border border-green-500/20",
        label: "✅ Concluído",
        icon: "✅",
      },
      processando: {
        bg: "bg-yellow-500/10",
        text: "text-yellow-500 border border-yellow-500/20",
        label: "⏳ Processando",
        icon: "⏳",
      },
      nao_iniciado: {
        bg: "bg-[var(--bg-primary)]",
        text: "text-[var(--text-secondary)] border border-[var(--border-color)]",
        label: "📝 Não Iniciado",
        icon: "📝",
      },
      paralisado: {
        bg: "bg-red-500/10",
        text: "text-red-500 border border-red-500/20",
        label: "⏸️ Paralisado",
        icon: "⏸️",
      },
    };
    const statusConfig =
      config[status as keyof typeof config] || config.nao_iniciado;
    const { bg, text, label } = statusConfig;
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${bg} ${text}`}
      >
        {label}
      </span>
    );
  };

  const laudosFiltrados =
    filtroStatus === "todos"
      ? laudos
      : laudos.filter((l) => mapStatus(l.status) === filtroStatus);

  // Paginação
  const totalPaginas = Math.ceil(laudosFiltrados.length / itensPorPagina);
  const indexInicio = (paginaAtual - 1) * itensPorPagina;
  const indexFim = indexInicio + itensPorPagina;
  const laudosPaginados = laudosFiltrados.slice(indexInicio, indexFim);

  // Reset página ao mudar filtro
  useEffect(() => {
    setPaginaAtual(1);
  }, [filtroStatus]);

  const statusCounts = {
    todos: laudos.length,
    concluido: laudos.filter((l) => mapStatus(l.status) === "concluido").length,
    processando: laudos.filter((l) => mapStatus(l.status) === "processando")
      .length,
    nao_iniciado: laudos.filter((l) => mapStatus(l.status) === "nao_iniciado")
      .length,
    paralisado: laudos.filter((l) => mapStatus(l.status) === "paralisado")
      .length,
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2 transition-colors">
              Meus Laudos
            </h2>
            <p className="text-[var(--text-secondary)]">
              Gerencie todos os seus laudos imobiliários
            </p>
          </div>

        </motion.div>

        {/* Filtros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[var(--bg-secondary)] rounded-xl shadow-sm border border-[var(--border-color)] p-4 transition-all"
        >
          <div className="flex flex-wrap gap-2">
            {[
              { key: "todos", label: `Todos (${statusCounts.todos})` },
              {
                key: "concluido",
                label: `Concluídos (${statusCounts.concluido})`,
              },
              {
                key: "processando",
                label: `Processando (${statusCounts.processando})`,
              },
              {
                key: "nao_iniciado",
                label: `Não Iniciados (${statusCounts.nao_iniciado})`,
              },
              {
                key: "paralisado",
                label: `Paralisados (${statusCounts.paralisado})`,
              },
            ].map((filtro) => (
              <button
                key={filtro.key}
                onClick={() => setFiltroStatus(filtro.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filtroStatus === filtro.key
                    ? "bg-primary text-white"
                    : "bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] border border-[var(--border-color)]"
                }`}
              >
                {filtro.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Lista de Laudos */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-[var(--text-secondary)]">Carregando laudos...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchLaudos} variant="outline">
              Tentar Novamente
            </Button>
          </div>
        ) : laudosFiltrados.length === 0 ? (
          <div className="bg-[var(--bg-secondary)] rounded-xl p-12 text-center border border-[var(--border-color)] transition-all">
            <p className="text-[var(--text-secondary)] mb-4">
              {filtroStatus === "todos"
                ? "Nenhum laudo encontrado. Comece criando seu primeiro laudo!"
                : "Nenhum laudo encontrado com este status."}
            </p>

          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4">
              {laudosPaginados.map((laudo, index) => {
                const status = mapStatus(laudo.status);
                return (
                  <motion.div
                    key={laudo.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-[var(--bg-secondary)] rounded-xl shadow-sm border border-[var(--border-color)] p-6 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          {getStatusBadge(status)}
                          
                          {/* Progress Bar for Processing Status */}
                          {(status === "processando" || progressMap[laudo.id]) && status !== "concluido" && (
                            <div className="mt-2 w-full max-w-xs">
                                <div className="flex justify-between text-xs mb-1 text-[var(--text-secondary)]">
                                    <span>Analisando imagens...</span>
                                    <span>
                                        {progressMap[laudo.id]?.percentage || 0}% 
                                        ({progressMap[laudo.id]?.processedImages || 0}/{progressMap[laudo.id]?.totalImages || '?'})
                                    </span>
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
                            {laudo.complemento && (
                              <div>{laudo.complemento}</div>
                            )}
                            {laudo.bairro && (
                              <div>
                                <span className="opacity-70">Bairro:</span>{" "}
                                {laudo.bairro}
                              </div>
                            )}
                            <div className="flex gap-4">
                              {laudo.cidade && (
                                <span>
                                  <span className="opacity-70">Cidade:</span>{" "}
                                  {laudo.cidade}
                                </span>
                              )}
                              {laudo.estado && (
                                <span>
                                  <span className="opacity-70">Estado:</span>{" "}
                                  {laudo.estado}
                                </span>
                              )}
                              {laudo.cep && (
                                <span>
                                  <span className="opacity-70">CEP:</span>{" "}
                                  {laudo.cep}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-[var(--text-secondary)]">
                          <div>
                            <span className="opacity-70">Ambientes:</span>{" "}
                            <span className="font-medium text-[var(--text-primary)]">
                              {laudo.totalAmbientes}
                            </span>
                          </div>
                          <div>
                            <span className="opacity-70">Fotos:</span>{" "}
                            <span className="font-medium text-[var(--text-primary)]">
                              {laudo.totalFotos}
                            </span>
                          </div>
                          {laudo.tamanho && (
                            <div>
                              <span className="opacity-70">Tamanho:</span>{" "}
                              <span className="font-medium text-[var(--text-primary)]">
                                {laudo.tamanho}
                              </span>
                            </div>
                          )}
                          <div>
                            <span className="opacity-70">Data:</span>{" "}
                            <span className="font-medium text-[var(--text-primary)]">
                              {formatDate(laudo.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-3 w-full sm:w-48">
                        {/* Ver Fotos - Always Visible */}
                        <Link to={`/dashboard/laudos/${laudo.id}/galeria`}>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="w-full justify-center bg-slate-800 hover:bg-slate-700 text-white border-0 shadow-lg shadow-black/20 transition-all duration-300 group"
                          >
                            <Camera className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                            Ver Fotos
                          </Button>
                        </Link>

                        {/* Ver PDF - Always Visible (Smart Link) */}
                        {laudo.pdfUrl && status === 'concluido' ? (
                           <a
                              href={laudo.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                           >
                            <Button
                              variant="secondary"
                              size="sm"
                              className="w-full justify-center bg-slate-800 hover:bg-slate-700 text-white border-0 shadow-lg shadow-black/20 transition-all duration-300 group"
                            >
                              <FileText className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                              Ver PDF
                            </Button>
                           </a>
                        ) : (
                           <Link to={`/dashboard/laudos/${laudo.id}/pdf`}>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="w-full justify-center bg-slate-800 hover:bg-slate-700 text-white border-0 shadow-lg shadow-black/20 transition-all duration-300 group"
                            >
                              <FileText className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                              Ver PDF
                            </Button>
                           </Link>
                        )}

                        {/* Iniciar Análise - Conditional */}
                        {status === "nao_iniciado" && (
                          <Button
                            variant="primary"
                            size="sm"
                            className="w-full justify-center bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/30 border-0 transition-all duration-300 group"
                            onClick={() => handleIniciarAnalise(laudo.id)}
                            disabled={analisandoLaudoId === laudo.id}
                          >
                            {analisandoLaudoId === laudo.id ? (
                              <>
                                <span className="animate-spin mr-2">⏳</span>
                                Iniciando...
                              </>
                            ) : (
                              <>
                                <Bot className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                                Iniciar Análise IA
                              </>
                            )}
                          </Button>
                        )}

                        {/* Editar Endereço - Always Visible */}
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full justify-center bg-slate-800 hover:bg-slate-700 text-white border-0 shadow-lg shadow-black/20 transition-all duration-300 group"
                          onClick={() => setLaudoEditando(laudo)}
                        >
                          <Pencil className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                          Editar Endereço
                        </Button>

                        {/* Deletar - Always Visible */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-center border-red-500/30 text-red-500 hover:bg-red-500/10 hover:border-red-500/50 transition-all duration-300 group"
                          onClick={() =>
                            setConfirmDelete({
                              isOpen: true,
                              id: laudo.id,
                              endereco: laudo.rua || laudo.endereco,
                            })
                          }
                        >
                          <Trash2 className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                          Deletar
                        </Button>
                      </div>
                    </div>
                    {/* Detalhes do Laudo (Expansível) */}
                    <LaudoDetalhes laudo={laudo} />{" "}
                  </motion.div>
                );
              })}
            </div>

            {/* Paginação */}
            {totalPaginas > 1 && (
              <div className="flex items-center justify-between bg-[var(--bg-secondary)] rounded-xl shadow-sm border border-[var(--border-color)] p-4 mt-6 transition-all">
                <div className="text-sm text-[var(--text-secondary)]">
                  Mostrando {indexInicio + 1} a{" "}
                  {Math.min(indexFim, laudosFiltrados.length)} de{" "}
                  {laudosFiltrados.length} laudos
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                    disabled={paginaAtual === 1}
                    className="px-4 py-2 rounded-lg border border-[var(--border-color)] text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--bg-primary)] transition-colors"
                  >
                    ← Anterior
                  </button>
                  <div className="flex gap-1">
                    {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(
                      (pagina) => (
                        <button
                          key={pagina}
                          onClick={() => setPaginaAtual(pagina)}
                          className={`px-3 py-2 rounded-lg transition-colors ${
                            paginaAtual === pagina
                              ? "bg-primary text-white"
                              : "border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-primary)]"
                          }`}
                        >
                          {pagina}
                        </button>
                      )
                    )}
                  </div>
                  <button
                    onClick={() =>
                      setPaginaAtual((p) => Math.min(totalPaginas, p + 1))
                    }
                    disabled={paginaAtual === totalPaginas}
                    className="px-4 py-2 rounded-lg border border-[var(--border-color)] text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--bg-primary)] transition-colors"
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
