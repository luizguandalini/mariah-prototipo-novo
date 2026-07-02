/**
 * Serviço para gerenciar usuários
 */

import { api } from "./api";
import { User } from "../types/auth";

export type EditableRole = "ADMIN" | "USUARIO";
export type AnyRole = "DEV" | "ADMIN" | "USUARIO";

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
   * Alterar o role (nível de acesso) de um usuário.
   * Apenas ADMIN/DEV podem chamar; apenas transições USUARIO ↔ ADMIN
   * são aceitas. O contador de imagens é preservado pelo backend.
   */
  async changeRole(id: string, role: EditableRole): Promise<User> {
    return api.patch<User>(`/users/${id}/role`, { role }, true);
  }

  /**
   * Deletar usuário (apenas DEV e ADMIN)
   */
  async deletarUsuario(id: string): Promise<void> {
    await api.delete(`/users/${id}`, true);
  }

  /**
   * Faz upload da foto de perfil / logo:
   * 1. pede uma URL pré-assinada ao backend
   * 2. envia o arquivo direto ao S3
   * 3. confirma o upload e recebe a URL assinada para exibição
   */
  async uploadFotoPerfil(file: File): Promise<{ fotoPerfilUrl: string }> {
    const { uploadUrl, s3Key } = await api.post<{ uploadUrl: string; s3Key: string }>(
      "/users/me/foto-perfil/presigned-url",
      {
        filename: file.name,
        contentType: file.type,
        fileSize: file.size,
      },
      true
    );

    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error("Falha ao enviar a imagem para o armazenamento.");
    }

    return api.post<{ fotoPerfilUrl: string }>(
      "/users/me/foto-perfil/confirm",
      { s3Key },
      true
    );
  }

  /**
   * Remove a foto de perfil / logo do usuário
   */
  async removerFotoPerfil(): Promise<void> {
    await api.delete("/users/me/foto-perfil", true);
  }
}

export const usersService = new UsersService();
