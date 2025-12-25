/**
 * Serviço para gerenciar usuários
 */

import { api } from "./api";
import { User } from "../types/auth";

export interface UsuariosResponse {
  data: User[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ListarUsuariosParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: "DEV" | "ADMIN" | "USUARIO";
  ativo?: boolean;
}

class UsersService {
  /**
   * Obtém os dados do usuário logado
   */
  async getMe(): Promise<User> {
    return api.get<User>("/users/me", true);
  }

  /**
   * Listar usuários com paginação e filtros (apenas DEV e ADMIN)
   */
  async listarUsuarios(
    params: ListarUsuariosParams = {}
  ): Promise<UsuariosResponse> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.search) queryParams.append("search", params.search);
    if (params.role) queryParams.append("role", params.role);
    if (params.ativo !== undefined)
      queryParams.append("ativo", params.ativo.toString());

    const queryString = queryParams.toString();
    const endpoint = `/users${queryString ? `?${queryString}` : ""}`;

    return api.get<UsuariosResponse>(endpoint, true);
  }

  /**
   * Buscar usuário por ID (apenas DEV e ADMIN)
   */
  async buscarUsuario(id: string): Promise<User> {
    return api.get<User>(`/users/${id}`, true);
  }

  /**
   * Criar novo usuário (via auth/register)
   */
  async criarUsuario(data: {
    nome: string;
    email: string;
    senha: string;
    role?: "ADMIN" | "USUARIO";
  }): Promise<User> {
    return api.post<User>("/auth/register", data, false);
  }

  /**
   * Atualiza dados do usuário
   */
  async updateUser(id: string, data: Partial<User>): Promise<User> {
    return api.put<User>(`/users/${id}`, data, true);
  }

  /**
   * Definir quantidade de imagens (apenas DEV e ADMIN)
   */
  async setQuantidadeImagens(id: string, quantidade: number): Promise<User> {
    return api.put<User>(`/users/${id}/imagens/set/${quantidade}`, {}, true);
  }

  /**
   * Adicionar imagens (apenas DEV e ADMIN)
   */
  async addQuantidadeImagens(id: string, quantidade: number): Promise<User> {
    return api.put<User>(`/users/${id}/imagens/add/${quantidade}`, {}, true);
  }

  /**
   * Deletar usuário (apenas DEV e ADMIN)
   */
  async deletarUsuario(id: string): Promise<void> {
    await api.delete(`/users/${id}`, true);
  }
}

export const usersService = new UsersService();
