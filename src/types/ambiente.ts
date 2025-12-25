export enum TipoUso {
  RESIDENCIAL = "Residencial",
  COMERCIAL = "Comercial",
  INDUSTRIAL = "Industrial",
}

export enum TipoImovel {
  CASA = "Casa",
  APARTAMENTO = "Apartamento",
  ESTUDIO = "Estudio",
}

export interface Ambiente {
  id: string;
  nome: string;
  descricao?: string;
  ordem: number;
  ativo: boolean;
  tiposUso: TipoUso[];
  tiposImovel: TipoImovel[];
  createdAt: string;
  updatedAt: string;
  itens?: ItemAmbiente[];
}

export interface ItemAmbiente {
  id: string;
  ambienteId: string;
  parentId?: string;
  nome: string;
  prompt: string;
  ordem: number;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  filhos?: ItemAmbiente[];
}

export interface CreateAmbienteDto {
  nome: string;
  descricao?: string;
  tiposUso?: TipoUso[];
  tiposImovel?: TipoImovel[];
  ativo?: boolean;
}

export interface UpdateAmbienteDto {
  nome?: string;
  descricao?: string;
  tiposUso?: TipoUso[];
  tiposImovel?: TipoImovel[];
  ativo?: boolean;
}

export interface CreateItemAmbienteDto {
  nome: string;
  prompt: string;
  parentId?: string;
  ativo?: boolean;
}

export interface UpdateItemAmbienteDto {
  nome?: string;
  prompt?: string;
  parentId?: string;
  ativo?: boolean;
}
