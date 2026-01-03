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
    REFRESH_TOKEN: 'auth_refresh_token',
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

      // Armazena tokens e dados do usuário
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

      // Armazena tokens e dados do usuário
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
   * Renova os tokens usando o refresh token
   */
  async refreshTokens(): Promise<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('Sem refresh token disponível');
    }

    try {
      const response = await api.post<AuthResponse>(
        '/auth/refresh',
        { refresh_token: refreshToken },
        false
      );

      // Atualiza tokens no storage
      this.setAuthData(response);

      return response;
    } catch (error) {
      console.error('Refresh token error:', error);
      // Se falhou ao renovar, força logout
      this.logout();
      throw new Error('Sessão expirada. Por favor, faça login novamente.');
    }
  }

  /**
   * Realiza logout do usuário
   */
  logout(): void {
    // Tenta revogar o refresh token no backend (fire and forget)
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      api.post('/auth/revoke', { refresh_token: refreshToken }, false)
        .catch(() => {
          // Ignora erros na revogação, o importante é limpar localmente
          console.log('Falha ao revogar refresh token no backend');
        });
    }

    localStorage.removeItem(this.STORAGE_KEYS.TOKEN);
    localStorage.removeItem(this.STORAGE_KEYS.REFRESH_TOKEN);
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
    localStorage.setItem(this.STORAGE_KEYS.TOKEN, response.access_token);
    localStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(response.user));
    
    // Armazena refresh token se presente
    if ('refresh_token' in response && response.refresh_token) {
      localStorage.setItem(this.STORAGE_KEYS.REFRESH_TOKEN, response.refresh_token as string);
    }
  }

  /**
   * Atualiza dados do usuário no localStorage
   */
  updateStoredUser(user: User): void {
    localStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(user));
  }

  /**
   * Obtém o token de autenticação
   */
  getToken(): string | null {
    return localStorage.getItem(this.STORAGE_KEYS.TOKEN);
  }

  /**
   * Obtém o refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.STORAGE_KEYS.REFRESH_TOKEN);
  }
}

// Exporta instância única do serviço
export const authService = new AuthService();
