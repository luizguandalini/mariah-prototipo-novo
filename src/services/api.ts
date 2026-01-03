/**
 * Cliente HTTP para comunicação com o backend
 *
 * Este serviço centraliza todas as requisições HTTP ao backend,
 * gerenciando tokens de autenticação, tratamento de erros e
 * renovação automática de tokens expirados.
 */

import { API_CONFIG } from "../config/api";

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
  _retry?: boolean; // Flag para evitar loop infinito de refresh
}

class ApiService {
  private baseURL: string;
  private isRefreshing = false;
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    this.baseURL = API_CONFIG.baseURL;
  }

  /**
   * Obtém o token de autenticação armazenado
   */
  private getAuthToken(): string | null {
    return localStorage.getItem("auth_token");
  }

  /**
   * Obtém o refresh token armazenado
   */
  private getRefreshToken(): string | null {
    return localStorage.getItem("auth_refresh_token");
  }

  /**
   * Define o token de autenticação
   */
  setAuthToken(token: string): void {
    localStorage.setItem("auth_token", token);
  }

  /**
   * Remove o token de autenticação
   */
  clearAuthToken(): void {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_refresh_token");
  }

  /**
   * Renova os tokens usando o refresh token
   */
  private async refreshTokens(): Promise<string> {
    // Se já está renovando, aguarda a promise existente
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error("Sem refresh token disponível");
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${this.baseURL}/auth/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (!response.ok) {
          throw new Error("Falha ao renovar token");
        }

        const data = await response.json();
        
        // Atualiza tokens no storage
        localStorage.setItem("auth_token", data.access_token);
        if (data.refresh_token) {
          localStorage.setItem("auth_refresh_token", data.refresh_token);
        }
        if (data.user) {
          localStorage.setItem("auth_user", JSON.stringify(data.user));
        }

        console.log("Tokens renovados com sucesso");
        return data.access_token;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Limpa dados de autenticação e redireciona para login
   */
  private handleAuthFailure(): void {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_refresh_token");
    localStorage.removeItem("auth_user");
    
    // Redireciona para página de login se não estiver nela
    if (!window.location.pathname.includes("/login")) {
      window.location.href = "/login";
    }
  }

  /**
   * Método genérico para fazer requisições HTTP
   */
  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { requiresAuth = false, _retry = false, headers = {}, ...restOptions } = options;

    const config: RequestInit = {
      ...restOptions,
      headers: {
        ...API_CONFIG.headers,
        ...headers,
      },
    };

    // Adiciona token de autenticação se necessário
    if (requiresAuth) {
      const token = this.getAuthToken();
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);

      // Se receber 401 e não é uma retry, tenta renovar o token
      if (response.status === 401 && !_retry && requiresAuth) {
        const refreshToken = this.getRefreshToken();
        
        if (refreshToken) {
          try {
            console.log("Token expirado, tentando renovar...");
            const newToken = await this.refreshTokens();
            
            // Refaz a requisição original com o novo token
            const retryOptions: RequestOptions = {
              ...options,
              _retry: true,
              headers: {
                ...headers,
                Authorization: `Bearer ${newToken}`,
              },
            };
            
            return this.request<T>(endpoint, retryOptions);
          } catch (refreshError) {
            console.error("Falha ao renovar token:", refreshError);
            this.handleAuthFailure();
            throw new Error("Sessão expirada. Por favor, faça login novamente.");
          }
        } else {
          this.handleAuthFailure();
          throw new Error("Sessão expirada. Por favor, faça login novamente.");
        }
      }

      // Trata erros HTTP
      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: "Erro ao processar requisição",
        }));
        throw new Error(error.message || `HTTP Error: ${response.status}`);
      }

      // Se a resposta não tem conteúdo (204 No Content ou DELETE bem-sucedido)
      if (
        response.status === 204 ||
        response.headers.get("content-length") === "0"
      ) {
        return {} as T;
      }

      // Verifica se há conteúdo para parsear
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const text = await response.text();
        return text ? JSON.parse(text) : ({} as T);
      }

      // Retorna objeto vazio se não for JSON
      return {} as T;
    } catch (error) {
      console.error("API Request Error:", error);
      throw error;
    }
  }

  /**
   * Requisição GET
   */
  async get<T>(endpoint: string, requiresAuth = false): Promise<T> {
    return this.request<T>(endpoint, {
      method: "GET",
      requiresAuth,
    });
  }

  /**
   * Requisição POST
   */
  async post<T>(
    endpoint: string,
    data?: unknown,
    requiresAuth = false
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
      requiresAuth,
    });
  }

  /**
   * Requisição PUT
   */
  async put<T>(
    endpoint: string,
    data?: unknown,
    requiresAuth = false
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
      requiresAuth,
    });
  }

  /**
   * Requisição PATCH
   */
  async patch<T>(
    endpoint: string,
    data?: unknown,
    requiresAuth = false
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
      requiresAuth,
    });
  }

  /**
   * Requisição DELETE
   */
  async delete<T>(endpoint: string, requiresAuth = false): Promise<T> {
    return this.request<T>(endpoint, {
      method: "DELETE",
      requiresAuth,
    });
  }
}

// Exporta instância única do serviço
export const api = new ApiService();
