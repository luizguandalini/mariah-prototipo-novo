/**
 * Tipos para planos de créditos
 */

export interface Plano {
  id: string;
  nome: string;
  subtitulo?: string;
  preco?: number;
  quantidadeImagens: number;
  ativo: boolean;
  ordem: number;
  beneficios?: PlanoBeneficio[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PlanoBeneficio {
  id: string;
  descricao: string;
  ordem: number;
}

export interface CreatePlanoDto {
  nome: string;
  subtitulo?: string;
  preco?: number;
  quantidadeImagens: number;
  ativo?: boolean;
}

export interface UpdatePlanoDto {
  nome?: string;
  subtitulo?: string;
  preco?: number;
  quantidadeImagens?: number;
  ativo?: boolean;
  ordem?: number;
}
