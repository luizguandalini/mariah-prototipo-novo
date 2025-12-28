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

// Interfaces para os questionários
export interface AnalisesHidraulicas {
  fluxo_agua: string;
  vazamentos: string;
}

export interface AnalisesEletricas {
  funcionamento: string;
  disjuntores: string;
}

export interface SistemaAr {
  ar_condicionado: string;
  aquecimento: string;
}

export interface MecanismosAbertura {
  portas: string;
  macanetas: string;
  janelas: string;
}

export interface Revestimentos {
  tetos: string;
  pisos: string;
  bancadas: string;
}

export interface Mobilias {
  fixa: string;
  nao_fixa: string;
}

export interface Laudo {
  id: string;
  endereco: string;

  // Endereço detalhado
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;

  // Classificação
  tipoVistoria?: string;
  tipoUso?: string;
  tipoImovel?: string;
  tipo: string;
  unidade?: string;

  status: "nao_iniciado" | "processando" | "concluido" | "paralisado";
  tamanho?: string;
  pdfUrl?: string;
  totalAmbientes: number;
  totalFotos: number;

  // Geolocalização
  latitude?: number;
  longitude?: number;
  enderecoCompletoGps?: string;

  // Questionários
  incluirAtestado?: number;
  atestado?: string;
  analisesHidraulicas?: AnalisesHidraulicas;
  analisesEletricas?: AnalisesEletricas;
  sistemaAr?: SistemaAr;
  mecanismosAbertura?: MecanismosAbertura;
  revestimentos?: Revestimentos;
  mobilias?: Mobilias;

  createdAt: string;
  updatedAt: string;
}

class LaudosService {
  /**
   * Obtém apenas os detalhes do laudo (questionários)
   */
  async getLaudoDetalhes(id: string): Promise<Partial<Laudo>> {
    return api.get<Partial<Laudo>>(`/laudos/${id}/detalhes`, true);
  }

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
   * Obtém todos os laudos do sistema (Admin/Dev)
   */
  async getAllLaudos(): Promise<Laudo[]> {
    return api.get<Laudo[]>("/laudos", true);
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
   * Atualiza apenas os detalhes do questionário de um laudo
   */
  async updateLaudoDetalhes(id: string, detalhes: {
    atestado?: string;
    analisesHidraulicas?: Partial<AnalisesHidraulicas>;
    analisesEletricas?: Partial<AnalisesEletricas>;
    sistemaAr?: Partial<SistemaAr>;
    mecanismosAbertura?: Partial<MecanismosAbertura>;
    revestimentos?: Partial<Revestimentos>;
    mobilias?: Partial<Mobilias>;
  }): Promise<Laudo> {
    return api.patch<Laudo>(`/laudos/${id}/detalhes`, detalhes, true);
  }

  /**
   * Deleta um laudo
   */
  async deleteLaudo(id: string): Promise<void> {
    return api.delete<void>(`/laudos/${id}`, true);
  }
}

export const laudosService = new LaudosService();
