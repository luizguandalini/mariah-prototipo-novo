/**
 * Serviço de Autenticação
 * 
 * Responsável por gerenciar login, registro e estado de autenticação
 * do usuário, comunicando-se com o backend.
 */

import { api } from './api';
import type {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  User,
} from '../types/auth';

class AuthService {
  private readonly STORAGE_KEYS = {
    TOKEN: 'auth_token',
    USER: 'auth_user',
  } as const;

  /**
   * Realiza login do usuário
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>(
        '/auth/login',
        credentials,
        false
      );

      // Armazena token e dados do usuário
      this.setAuthData(response);

      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Erro ao fazer login'
      );
    }
  }

  /**
   * Registra novo usuário
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>(
        '/auth/register',
        data,
        false
      );

      // Armazena token e dados do usuário
      this.setAuthData(response);

      return response;
    } catch (error) {
      console.error('Register error:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Erro ao cadastrar usuário'
      );
    }
  }

  /**
   * Realiza logout do usuário
   */
  logout(): void {
    localStorage.removeItem(this.STORAGE_KEYS.TOKEN);
    localStorage.removeItem(this.STORAGE_KEYS.USER);
    api.clearAuthToken();
  }

  /**
   * Obtém usuário autenticado do localStorage
   */
  getCurrentUser(): User | null {
    try {
      const userJson = localStorage.getItem(this.STORAGE_KEYS.USER);
      return userJson ? JSON.parse(userJson) : null;
    } catch {
      return null;
    }
  }

  /**
   * Verifica se o usuário está autenticado
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem(this.STORAGE_KEYS.TOKEN);
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  /**
   * Armazena dados de autenticação
   */
  private setAuthData(response: AuthResponse): void {
    api.setAuthToken(response.access_token);
    localStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(response.user));
  }

  /**
   * Obtém o token de autenticação
   */
  getToken(): string | null {
    return localStorage.getItem(this.STORAGE_KEYS.TOKEN);
  }
}

// Exporta instância única do serviço
export const authService = new AuthService();
