/**
 * Serviço para gerenciar usuários
 */

import { api } from "./api";
import { User } from "../types/auth";

class UsersService {
  /**
   * Obtém os dados do usuário logado
   */
  async getMe(): Promise<User> {
    return api.get<User>("/users/me", true);
  }

  /**
   * Atualiza dados do usuário
   */
  async updateUser(id: string, data: Partial<User>): Promise<User> {
    return api.put<User>(`/users/${id}`, data, true);
  }
}

export const usersService = new UsersService();
