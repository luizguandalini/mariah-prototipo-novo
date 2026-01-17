import { api } from './api';

// Tipos para fila de análise
export interface QueueItem {
  id: string;
  laudoId: string;
  endereco: string;
  usuarioNome: string;
  usuarioEmail: string;
  status: 'pending' | 'processing' | 'completed' | 'error' | 'cancelled' | 'paused';
  position: number;
  totalImages: number;
  processedImages: number;
  progressPercentage: number;
  createdAt: string;
  startedAt?: string;
}

export interface QueueStatus {
  inQueue: boolean;
  position?: number;
  status?: string;
  totalImages?: number;
  processedImages?: number;
  progressPercentage?: number;
  estimatedMinutes?: number;
}

export interface QueueStats {
  pending: number;
  processing: number;
  paused: number;
  completedToday: number;
  total: number;
}

export interface GlobalStatus {
  paused: boolean;
  reason?: string;
  pausedAt?: string;
  pausedItems: number;
}

export interface OpenAIStatus {
  configured: boolean;
  connection: {
    success: boolean;
    message: string;
  } | null;
}

// Serviço de gerenciamento de fila e IA
export const queueService = {
  /**
   * Adiciona laudo à fila de análise
   */
  async addToQueue(laudoId: string, force: boolean = false): Promise<{ success: boolean; position: number; totalImages: number }> {
    return api.post(`/queue/analisar-laudo/${laudoId}`, { force }, true);
  },

  /**
   * Cancela análise de um laudo
   */
  async cancelAnalysis(laudoId: string): Promise<{ success: boolean; message: string }> {
    return api.delete(`/queue/cancelar/${laudoId}`, true);
  },

  /**
   * Obtém status da fila para um laudo específico
   */
  async getQueueStatus(laudoId: string): Promise<QueueStatus> {
    return api.get(`/queue/status/${laudoId}`, true);
  },

  /**
   * Obtém estatísticas gerais da fila
   */
  async getQueueStats(): Promise<QueueStats> {
    return api.get('/queue/stats', true);
  },

  /**
   * Obtém a fila completa (admin only)
   */
  async getFullQueue(): Promise<QueueItem[]> {
    return api.get('/queue/admin/full', true);
  },

  /**
   * Obtém status global da fila (pausada/motivo) - admin only
   */
  async getGlobalStatus(): Promise<GlobalStatus> {
    return api.get('/queue/admin/global-status', true);
  },

  /**
   * Retoma a fila após correção do problema - admin only
   */
  async resumeQueue(): Promise<{ resumed: number; message: string }> {
    return api.post('/queue/admin/resume', {}, true);
  },
};

// Serviço de configuração OpenAI
export const openaiService = {
  /**
   * Obtém status da configuração OpenAI
   */
  async getStatus(): Promise<OpenAIStatus> {
    return api.get('/config/openai-status', true);
  },

  /**
   * Atualiza a API Key da OpenAI
   */
  async updateApiKey(apiKey: string): Promise<{ success: boolean; message: string }> {
    return api.put('/config/openai-key', { apiKey }, true);
  },

  /**
   * Testa a conexão com a OpenAI
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    return api.get('/config/openai-test', true);
  },

  /**
   * Recarrega configurações do servidor
   */
  async reloadConfig(): Promise<{ success: boolean; message: string }> {
    return api.put('/config/openai-reload', {}, true);
  },
};

