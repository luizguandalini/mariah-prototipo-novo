/**
 * Serviço para gerenciar laudos
 */

import { api } from "./api";

export interface DashboardStats {
  totalLaudos: number;
  emProcessamento: number;
  concluidos: number;
  imagensRestantes: number;
}

export interface Laudo {
  id: string;
  endereco: string;
  tipo: string;
  unidade?: string;
  status: "nao_iniciado" | "processando" | "concluido" | "paralisado";
  tamanho?: string;
  pdfUrl?: string;
  totalAmbientes: number;
  totalFotos: number;
  createdAt: string;
  updatedAt: string;
}

class LaudosService {
  /**
   * Obtém as estatísticas do dashboard do usuário logado
   */
  async getDashboardStats(): Promise<DashboardStats> {
    return api.get<DashboardStats>("/laudos/dashboard/stats", true);
  }

  /**
   * Obtém os laudos recentes do usuário logado
   */
  async getRecentLaudos(limit: number = 5): Promise<Laudo[]> {
    return api.get<Laudo[]>(`/laudos/dashboard/recent?limit=${limit}`, true);
  }

  /**
   * Obtém todos os laudos do usuário logado
   */
  async getMyLaudos(): Promise<Laudo[]> {
    return api.get<Laudo[]>("/laudos/me", true);
  }

  /**
   * Obtém um laudo específico por ID
   */
  async getLaudo(id: string): Promise<Laudo> {
    return api.get<Laudo>(`/laudos/${id}`, true);
  }

  /**
   * Cria um novo laudo
   */
  async createLaudo(data: Partial<Laudo>): Promise<Laudo> {
    return api.post<Laudo>("/laudos", data, true);
  }

  /**
   * Atualiza um laudo existente
   */
  async updateLaudo(id: string, data: Partial<Laudo>): Promise<Laudo> {
    return api.put<Laudo>(`/laudos/${id}`, data, true);
  }

  /**
   * Deleta um laudo
   */
  async deleteLaudo(id: string): Promise<void> {
    return api.delete<void>(`/laudos/${id}`, true);
  }
}

export const laudosService = new LaudosService();
