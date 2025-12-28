// Status do laudo
export type LaudoStatus =
  | "nao_iniciado"
  | "processando"
  | "concluido"
  | "paralisado";

// Informações da vistoria
export interface VistoriaInfo {
  uso: string;
  tipo: string;
  unidade?: string;
  tipoVistoria: string;
  endereco: string;
  cep: string;
  tamanho: string;
  realizadaEm: string;
  agua?: string;
  energia?: string;
  pinturaNovaChecklist?: Record<string, boolean>;
  faxinadoChecklist?: Record<string, boolean>;
}

// Ambiente (sala, cozinha, etc)
export interface Ambiente {
  id: string;
  nome: string;
  imagens: ImagemAmbiente[];
  ordem: number;
}

// Imagem de um ambiente
export interface ImagemAmbiente {
  id: string;
  url: string;
  nome: string;
  ordem: number;
}

// Checklist do relatório geral
export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

// Laudo completo
export interface Laudo {
  id: string;
  status: LaudoStatus;
  vistoriaInfo: VistoriaInfo;
  ambientes: Ambiente[];
  checklist: ChecklistItem[];
  criadoEm: string;
  atualizadoEm: string;
  pdfUrl?: string;
  estimativaProcessamento?: string;
}

// Usuário
export interface Usuario {
  id: string;
  nome: string;
  email: string;
  foto?: string;
  plano: "starter" | "professional" | "enterprise" | "creditos";
  creditos: number;
  criadoEm: string;
}

// Pagamento
export interface Pagamento {
  id: string;
  tipo: "assinatura" | "creditos";
  valor: number;
  status: "pendente" | "aprovado" | "recusado";
  data: string;
  descricao: string;
}

// Ticket de suporte
export interface TicketSuporte {
  id: string;
  assunto: string;
  mensagem: string;
  status: "aberto" | "em_andamento" | "resolvido";
  criadoEm: string;
  respostaAdmin?: string;
}

export * from "./laudo-details";
