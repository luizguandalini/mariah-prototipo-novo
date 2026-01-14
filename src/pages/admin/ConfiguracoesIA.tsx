import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Button from "../../components/ui/Button";
import { queueService, openaiService, QueueItem, QueueStats, OpenAIStatus, GlobalStatus } from "../../services/queue";

export default function ConfiguracoesIA() {
  // Estados para API Key
  const [apiKey, setApiKey] = useState("");
  const [isUpdatingKey, setIsUpdatingKey] = useState(false);
  const [openaiStatus, setOpenaiStatus] = useState<OpenAIStatus | null>(null);

  // Estados para fila
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [fullQueue, setFullQueue] = useState<QueueItem[]>([]);
  const [isLoadingQueue, setIsLoadingQueue] = useState(true);
  const [globalStatus, setGlobalStatus] = useState<GlobalStatus | null>(null);
  const [isResuming, setIsResuming] = useState(false);

  // Carregar dados iniciais
  const loadData = useCallback(async () => {
    try {
      const [status, stats, queue, global] = await Promise.all([
        openaiService.getStatus(),
        queueService.getQueueStats(),
        queueService.getFullQueue(),
        queueService.getGlobalStatus(),
      ]);
      setOpenaiStatus(status);
      setQueueStats(stats);
      setFullQueue(queue);
      setGlobalStatus(global);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setIsLoadingQueue(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Atualização automática removida - use o botão "Atualizar" para ver alterações
  }, [loadData]);

  // Atualizar API Key
  const handleUpdateApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error("Digite uma API Key válida");
      return;
    }

    setIsUpdatingKey(true);
    try {
      const result = await openaiService.updateApiKey(apiKey);
      if (result.success) {
        toast.success("API Key atualizada com sucesso!");
        setApiKey("");
        loadData();
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao atualizar API Key");
    } finally {
      setIsUpdatingKey(false);
    }
  };

  // Testar conexão
  const handleTestConnection = async () => {
    try {
      const result = await openaiService.testConnection();
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao testar conexão");
    }
  };

  // Formatar status da fila
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
      processing: "bg-blue-500/20 text-blue-500 border-blue-500/30",
      completed: "bg-green-500/20 text-green-500 border-green-500/30",
      error: "bg-red-500/20 text-red-500 border-red-500/30",
      cancelled: "bg-gray-500/20 text-gray-500 border-gray-500/30",
    };
    const labels: Record<string, string> = {
      pending: "Aguardando",
      processing: "Analisando",
      completed: "Concluído",
      error: "Erro",
      cancelled: "Cancelado",
    };
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded border ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Título removido por ser redundante com o header */}

        {/* ALERTA DE FILA PAUSADA */}
        {globalStatus?.paused && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-2xl p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="text-3xl sm:text-4xl bg-red-500/20 w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center">
                🚨
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-black text-red-500 mb-1 uppercase tracking-tight">
                  Fila de Análise Pausada
                </h2>
                <p className="text-[var(--text-primary)] text-sm mb-3">
                  <span className="font-bold opacity-60">MOTIVO:</span> {globalStatus.reason}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[var(--text-secondary)] text-[10px] font-bold uppercase mb-4 opacity-70">
                  <span>Pausada em: {globalStatus.pausedAt ? new Date(globalStatus.pausedAt).toLocaleString("pt-BR") : "N/A"}</span>
                  <span className="hidden sm:inline">|</span>
                  <span>{globalStatus.pausedItems} itens aguardando</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={async () => {
                      setIsResuming(true);
                      try {
                        const result = await queueService.resumeQueue();
                        if (result.resumed > 0) {
                          toast.success(result.message);
                          loadData();
                        } else {
                          toast.error(result.message);
                        }
                      } catch (error: any) {
                        toast.error(error.message || "Erro ao retomar fila");
                      } finally {
                        setIsResuming(false);
                      }
                    }}
                    disabled={isResuming}
                    className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                  >
                    {isResuming ? "Retomando..." : "▶️ Retomar Fila"}
                  </Button>
                  <Button variant="outline" onClick={loadData} className="w-full sm:w-auto">
                    🔄 Atualizar Status
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status da OpenAI */}
        <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-5 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1.5 h-6 bg-primary rounded-full" />
            <h2 className="text-xl font-black text-[var(--text-primary)]">
              🤖 OpenAI - Status
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-8 bg-[var(--bg-primary)] p-4 rounded-xl border border-[var(--border-color)]/50">
            <div className={`w-3 h-3 rounded-full shadow-sm ${openaiStatus?.configured ? "bg-green-500 shadow-green-500/50" : "bg-red-500 shadow-red-500/50"}`} />
            <span className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
              {openaiStatus?.configured ? "API Key configurada" : "API Key não configurada"}
            </span>
            {openaiStatus?.connection && (
              <span className={`text-[10px] font-black uppercase px-2 py-1 rounded bg-[var(--bg-secondary)] ${openaiStatus.connection.success ? "text-green-500 border border-green-500/20" : "text-red-500 border border-red-500/20"}`}>
                {openaiStatus.connection.message}
              </span>
            )}
          </div>

          {/* Formulário de API Key */}
          <div className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] ml-1">
                OpenAI API Key
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="flex-1 px-4 py-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-mono text-sm"
                />
                <Button 
                  onClick={handleUpdateApiKey} 
                  disabled={isUpdatingKey}
                  className="w-full sm:w-auto px-8"
                >
                  {isUpdatingKey ? "Atualizando..." : "✨ Atualizar"}
                </Button>
              </div>
            </div>
            <div className="flex justify-end">
              <button 
                onClick={handleTestConnection}
                className="text-xs font-bold text-primary hover:text-primary-dark transition-colors uppercase tracking-widest px-2 py-1"
              >
                Testar Conexão Agora →
              </button>
            </div>
          </div>
        </div>

        {/* Estatísticas da Fila */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-5 text-center shadow-sm group hover:border-primary transition-all">
            <p className="text-4xl font-black text-primary leading-none mb-1">{queueStats?.total || 0}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">Na Fila</p>
          </div>
          <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-5 text-center shadow-sm group hover:border-yellow-500 transition-all">
            <p className="text-4xl font-black text-yellow-500 leading-none mb-1">{queueStats?.pending || 0}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">Aguardando</p>
          </div>
          <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-5 text-center shadow-sm group hover:border-blue-500 transition-all">
            <p className="text-4xl font-black text-blue-500 leading-none mb-1">{queueStats?.processing || 0}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">Analisando</p>
          </div>
          <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-5 text-center shadow-sm group hover:border-green-500 transition-all">
            <p className="text-4xl font-black text-green-500 leading-none mb-1">{queueStats?.completedToday || 0}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">Concluídos Hoje</p>
          </div>
        </div>

        {/* Lista da Fila */}
        <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-sm">
          <div className="flex justify-between items-center p-6 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-primary rounded-full" />
              <h2 className="text-xl font-black text-[var(--text-primary)]">
                📋 Fila de Análise
              </h2>
            </div>
            <button 
              onClick={loadData}
              className="p-2 hover:bg-[var(--bg-primary)] rounded-lg text-[var(--text-secondary)] transition-colors"
            >
              🔄
            </button>
          </div>

          {isLoadingQueue ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">Sincronizando...</p>
            </div>
          ) : fullQueue.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-4xl mb-3 block">✅</span>
              <p className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-tight">Nenhum laudo na fila</p>
            </div>
          ) : (
            <>
              {/* Vista Desktop (Tabela) */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-[var(--bg-primary)]">
                    <tr className="border-b border-[var(--border-color)]">
                      <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">#</th>
                      <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Usuário</th>
                      <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Endereço</th>
                      <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Status</th>
                      <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Progresso</th>
                      <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)]">
                    {fullQueue.map((item) => (
                      <tr key={item.id} className="hover:bg-[var(--bg-primary)] transition-colors group">
                        <td className="py-4 px-6">
                          <span className="w-8 h-8 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-primary flex items-center justify-center font-black text-sm shadow-sm group-hover:border-primary/50 transition-colors">
                            {item.position}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div>
                            <p className="text-sm font-bold text-[var(--text-primary)]">{item.usuarioNome}</p>
                            <p className="text-[10px] font-medium text-[var(--text-secondary)] opacity-60">{item.usuarioEmail}</p>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-xs text-[var(--text-primary)] max-w-[200px] truncate font-medium">
                            {item.endereco}
                          </p>
                        </td>
                        <td className="py-4 px-6">
                          {getStatusBadge(item.status)}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col gap-1.5">
                            <div className="w-32 h-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all duration-300"
                                style={{ width: `${item.progressPercentage}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-black text-primary uppercase">
                              {item.processedImages} / {item.totalImages} imgs
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">
                            {new Date(item.createdAt).toLocaleString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Vista Mobile (Cards) */}
              <div className="lg:hidden divide-y divide-[var(--border-color)]">
                {fullQueue.map((item) => (
                  <div key={item.id} className="p-5 space-y-4 bg-[var(--bg-secondary)] active:bg-[var(--bg-primary)] transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-primary flex items-center justify-center font-black text-lg shadow-sm">
                          {item.position}
                        </span>
                        <div>
                          <p className="text-sm font-bold text-[var(--text-primary)] leading-tight">{item.usuarioNome}</p>
                          <p className="text-[10px] font-medium text-[var(--text-secondary)] opacity-70 truncate max-w-[150px]">{item.usuarioEmail}</p>
                        </div>
                      </div>
                      {getStatusBadge(item.status)}
                    </div>

                    <div className="space-y-1.5 px-1">
                      <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Endereço do Imóvel</p>
                      <p className="text-xs text-[var(--text-primary)] font-medium leading-relaxed">{item.endereco}</p>
                    </div>

                    <div className="pt-2 border-t border-[var(--border-color)]/30">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Progresso da Análise</p>
                        <span className="text-[10px] font-black text-primary uppercase">
                          {item.processedImages} / {item.totalImages} imgs
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300 shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]"
                          style={{ width: `${item.progressPercentage}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end pt-1">
                      <p className="text-[9px] font-bold text-[var(--text-secondary)] uppercase bg-[var(--bg-primary)] px-2 py-1 rounded border border-[var(--border-color)]">
                        {new Date(item.createdAt).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
