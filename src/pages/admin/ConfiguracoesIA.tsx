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
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">
            Configurações de IA
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Gerencie a integração com OpenAI e monitore a fila de análise de laudos
          </p>
        </div>

        {/* ALERTA DE FILA PAUSADA */}
        {globalStatus?.paused && (
          <div className="bg-red-500/20 border-2 border-red-500 rounded-xl p-6 animate-pulse">
            <div className="flex items-start gap-4">
              <div className="text-4xl">🚨</div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-red-500 mb-2">
                  FILA DE ANÁLISE PAUSADA
                </h2>
                <p className="text-[var(--text-primary)] mb-2">
                  <strong>Motivo:</strong> {globalStatus.reason}
                </p>
                <p className="text-[var(--text-secondary)] text-sm mb-4">
                  Pausada em: {globalStatus.pausedAt ? new Date(globalStatus.pausedAt).toLocaleString("pt-BR") : "N/A"}
                  {" | "}
                  {globalStatus.pausedItems} itens aguardando
                </p>
                <div className="flex gap-4">
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
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isResuming ? "Retomando..." : "▶️ Retomar Fila"}
                  </Button>
                  <Button variant="secondary" onClick={loadData}>
                    🔄 Atualizar Status
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status da OpenAI */}
        <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] p-6">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
            🤖 OpenAI - Status
          </h2>

          <div className="flex items-center gap-4 mb-6">
            <div className={`w-3 h-3 rounded-full ${openaiStatus?.configured ? "bg-green-500" : "bg-red-500"}`} />
            <span className="text-[var(--text-primary)]">
              {openaiStatus?.configured ? "API Key configurada" : "API Key não configurada"}
            </span>
            {openaiStatus?.connection && (
              <span className={`text-sm ${openaiStatus.connection.success ? "text-green-500" : "text-red-500"}`}>
                ({openaiStatus.connection.message})
              </span>
            )}
          </div>

          {/* Formulário de API Key */}
          <div className="flex gap-4">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="flex-1 px-4 py-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-primary"
            />
            <Button onClick={handleUpdateApiKey} disabled={isUpdatingKey}>
              {isUpdatingKey ? "Atualizando..." : "Atualizar API Key"}
            </Button>
            <Button variant="secondary" onClick={handleTestConnection}>
              Testar Conexão
            </Button>
          </div>
        </div>

        {/* Estatísticas da Fila */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] p-6 text-center">
            <p className="text-3xl font-bold text-primary">{queueStats?.total || 0}</p>
            <p className="text-sm text-[var(--text-secondary)]">Na Fila</p>
          </div>
          <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] p-6 text-center">
            <p className="text-3xl font-bold text-yellow-500">{queueStats?.pending || 0}</p>
            <p className="text-sm text-[var(--text-secondary)]">Aguardando</p>
          </div>
          <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] p-6 text-center">
            <p className="text-3xl font-bold text-blue-500">{queueStats?.processing || 0}</p>
            <p className="text-sm text-[var(--text-secondary)]">Analisando</p>
          </div>
          <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] p-6 text-center">
            <p className="text-3xl font-bold text-green-500">{queueStats?.completedToday || 0}</p>
            <p className="text-sm text-[var(--text-secondary)]">Concluídos Hoje</p>
          </div>
        </div>

        {/* Lista da Fila */}
        <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              📋 Fila de Análise
            </h2>
            <Button variant="outline" size="sm" onClick={loadData}>
              🔄 Atualizar
            </Button>
          </div>

          {isLoadingQueue ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : fullQueue.length === 0 ? (
            <div className="text-center py-8 text-[var(--text-secondary)]">
              Nenhum laudo na fila de análise
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border-color)]">
                    <th className="text-left py-3 px-4 text-[var(--text-secondary)] font-medium">Posição</th>
                    <th className="text-left py-3 px-4 text-[var(--text-secondary)] font-medium">Usuário</th>
                    <th className="text-left py-3 px-4 text-[var(--text-secondary)] font-medium">Endereço</th>
                    <th className="text-left py-3 px-4 text-[var(--text-secondary)] font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-[var(--text-secondary)] font-medium">Progresso</th>
                    <th className="text-left py-3 px-4 text-[var(--text-secondary)] font-medium">Adicionado</th>
                  </tr>
                </thead>
                <tbody>
                  {fullQueue.map((item) => (
                    <tr key={item.id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-primary)]">
                      <td className="py-3 px-4">
                        <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                          {item.position}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-[var(--text-primary)] font-medium">{item.usuarioNome}</p>
                          <p className="text-xs text-[var(--text-secondary)]">{item.usuarioEmail}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[var(--text-primary)] max-w-xs truncate">
                        {item.endereco}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-[var(--bg-primary)] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all duration-300"
                              style={{ width: `${item.progressPercentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-[var(--text-secondary)]">
                            {item.processedImages}/{item.totalImages}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[var(--text-secondary)] text-sm">
                        {new Date(item.createdAt).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
