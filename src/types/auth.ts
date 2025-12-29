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
  ativo?: boolean;
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
  user: User;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}
