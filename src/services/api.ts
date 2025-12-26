/**
 * Cliente HTTP para comunicação com o backend
 *
 * Este serviço centraliza todas as requisições HTTP ao backend,
 * gerenciando tokens de autenticação e tratamento de erros.
 */

import { API_CONFIG } from "../config/api";

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

class ApiService {
  private baseURL: string;

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
  }

  /**
   * Método genérico para fazer requisições HTTP
   */
  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { requiresAuth = false, headers = {}, ...restOptions } = options;

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
