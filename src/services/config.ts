import { api } from "./api";

export const configService = {
  /**
   * Obtém o prompt padrão para análise de imagens
   */
  async getDefaultPrompt(): Promise<{ value: string }> {
    return await api.get("/config/default-prompt", true);
  },

  /**
   * Atualiza o prompt padrão para análise de imagens
   * @param value Novo valor do prompt (máx 1000 caracteres)
   */
  async setDefaultPrompt(
    value: string,
  ): Promise<{ success: boolean; message: string }> {
    return await api.put("/config/default-prompt", { value }, true);
  },

  async getAvariaPrompt(): Promise<{ value: string }> {
    return await api.get("/config/avaria-prompt", true);
  },

  async setAvariaPrompt(
    value: string,
  ): Promise<{ success: boolean; message: string }> {
    return await api.put("/config/avaria-prompt", { value }, true);
  },
};
