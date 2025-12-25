import { api } from "./api";
import {
  Ambiente,
  ItemAmbiente,
  CreateAmbienteDto,
  UpdateAmbienteDto,
  CreateItemAmbienteDto,
  UpdateItemAmbienteDto,
} from "../types/ambiente";

export const ambientesService = {
  // ========== AMBIENTES ==========

  /**
   * Listar todos os ambientes ativos
   */
  async listarAmbientes(): Promise<Ambiente[]> {
    return await api.get("/ambientes", true);
  },

  /**
   * Listar todos os ambientes com árvore completa de itens e sub-itens
   */
  async listarAmbientesComArvore(): Promise<Ambiente[]> {
    return await api.get("/ambientes/arvore-completa", true);
  },

  /**
   * Buscar ambiente específico por ID
   */
  async buscarAmbiente(id: string): Promise<Ambiente> {
    return await api.get(`/ambientes/${id}`, true);
  },

  /**
   * Criar novo ambiente (apenas DEV e ADMIN)
   */
  async criarAmbiente(data: CreateAmbienteDto): Promise<Ambiente> {
    return await api.post("/ambientes", data, true);
  },

  /**
   * Atualizar ambiente (apenas DEV e ADMIN)
   */
  async atualizarAmbiente(
    id: string,
    data: UpdateAmbienteDto
  ): Promise<Ambiente> {
    return await api.put(`/ambientes/${id}`, data, true);
  },

  /**
   * Atualizar apenas tipos do ambiente (otimizado - retorna apenas id e tipos)
   */
  async atualizarTiposAmbiente(
    id: string,
    data: { tiposUso?: string[]; tiposImovel?: string[] }
  ): Promise<{ id: string; tiposUso?: string[]; tiposImovel?: string[] }> {
    return await api.patch(`/ambientes/${id}/tipos`, data, true);
  },

  /**
   * Deletar ambiente (apenas DEV e ADMIN)
   */
  async deletarAmbiente(id: string): Promise<void> {
    await api.delete(`/ambientes/${id}`, true);
  },

  // ========== ITENS DE AMBIENTE ==========

  /**
   * Listar todos os itens de um ambiente em estrutura hierárquica
   */
  async listarItensAmbiente(ambienteId: string): Promise<ItemAmbiente[]> {
    return await api.get(`/ambientes/${ambienteId}/itens`, true);
  },

  /**
   * Buscar item específico por ID
   */
  async buscarItem(ambienteId: string, itemId: string): Promise<ItemAmbiente> {
    return await api.get(`/ambientes/${ambienteId}/itens/${itemId}`, true);
  },

  /**
   * Criar novo item em um ambiente (apenas DEV e ADMIN)
   */
  async criarItem(
    ambienteId: string,
    data: CreateItemAmbienteDto
  ): Promise<ItemAmbiente> {
    return await api.post(`/ambientes/${ambienteId}/itens`, data, true);
  },

  /**
   * Atualizar item (apenas DEV e ADMIN)
   */
  async atualizarItem(
    ambienteId: string,
    itemId: string,
    data: UpdateItemAmbienteDto
  ): Promise<ItemAmbiente> {
    return await api.put(
      `/ambientes/${ambienteId}/itens/${itemId}`,
      data,
      true
    );
  },

  /**
   * Deletar item (apenas DEV e ADMIN)
   */
  async deletarItem(ambienteId: string, itemId: string): Promise<void> {
    await api.delete(`/ambientes/${ambienteId}/itens/${itemId}`, true);
  },
};
