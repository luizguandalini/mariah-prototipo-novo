/**
 * Serviço para gerenciar planos de créditos
 */

import { api } from './api';
import type { Plano, CreatePlanoDto, UpdatePlanoDto } from '../types/planos';

export const planosService = {
  /**
   * Lista todos os planos ativos
   */
  async getPlanos(): Promise<Plano[]> {
    return await api.get<Plano[]>('/planos');
  },

  /**
   * Busca um plano específico por ID
   */
  async getPlano(id: string): Promise<Plano> {
    return await api.get<Plano>(`/planos/${id}`);
  },

  /**
   * Cria um novo plano (apenas admin/dev)
   */
  async createPlano(data: CreatePlanoDto): Promise<Plano> {
    return await api.post<Plano>('/planos', data, true);
  },

  /**
   * Atualiza um plano existente (apenas admin/dev)
   */
  async updatePlano(id: string, data: UpdatePlanoDto): Promise<Plano> {
    return await api.put<Plano>(`/planos/${id}`, data, true);
  },

  /**
   * Deleta um plano (apenas admin/dev)
   */
  async deletePlano(id: string): Promise<void> {
    await api.delete(`/planos/${id}`, true);
  },
};
