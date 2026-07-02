/**
 * Tipos para autenticação e usuários
 */

export enum UserRole {
  DEV = 'DEV',
  ADMIN = 'ADMIN',
  USUARIO = 'USUARIO',
}

export interface User {
  id: string;
  email: string;
  nome: string;
  role: UserRole;
  quantidadeImagens: number;
  quantidadeClassificacoesWeb: number;
  ativo?: boolean;
  /** URL assinada (temporária) da foto de perfil / logo, gerada pelo backend */
  fotoPerfilUrl?: string | null;
  /**
   * `true` apenas na linha que representa o próprio usuário logado.
   * Calculado pelo backend em `users.service.computeAccessFlags`.
   * Use para esconder o toggle de nível de acesso na própria linha (o
   * backend rejeita auto-edição de role com 400).
   */
  isSelf?: boolean;
  /**
   * `true` quando o usuário logado tem permissão para deletar esta linha
   * (ADMIN/DEV pode deletar ADMIN/USUARIO comuns, nunca DEV, nunca a si
   * mesmo). Use para mostrar/esconder o botão de deletar.
   */
  canDelete?: boolean;
}

export interface LoginCredentials {
  email: string;
  senha: string;
}

export interface RegisterData {
  email: string;
  senha: string;
  nome: string;
  cpf?: string;
  telefone?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  user: User;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
  refreshUser: () => Promise<void>;
}
