import { api } from "./api";
import {
  LaudoSection,
  LaudoQuestion,
  LaudoOption,
  CreateLaudoSectionDto,
  UpdateLaudoSectionDto,
  CreateLaudoQuestionDto,
  UpdateLaudoQuestionDto,
  CreateLaudoOptionDto,
  UpdateLaudoOptionDto,
} from "../types/laudo-details";

export const laudoDetailsService = {
  // ========== SECTIONS ==========

  /**
   * Criar uma nova seção
   */
  async createSection(dto: CreateLaudoSectionDto): Promise<LaudoSection> {
    return await api.post("/laudo-details/sections", dto, true);
  },

  /**
   * Listar todas as seções com paginação
   */
  async getAllSections(
    page: number = 1,
    limit: number = 10,
    includeDetails: boolean = false
  ): Promise<{
    data: LaudoSection[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }> {
    return await api.get(
      `/laudo-details/sections?page=${page}&limit=${limit}&includeDetails=${includeDetails}`,
      true
    );
  },

  /**
   * Obter seção por ID
   */
  async getSectionById(id: string): Promise<LaudoSection> {
    return await api.get(`/laudo-details/sections/${id}`, true);
  },

  /**
   * Obter detalhes completos de uma seção (perguntas e opções)
   */
  async getSectionDetails(id: string): Promise<LaudoSection> {
    return await api.get(`/laudo-details/sections/${id}/details`, true);
  },

  /**
   * Atualizar seção
   */
  async updateSection(
    id: string,
    dto: UpdateLaudoSectionDto
  ): Promise<LaudoSection> {
    return await api.put(`/laudo-details/sections/${id}`, dto, true);
  },

  /**
   * Deletar seção
   */
  async deleteSection(id: string): Promise<void> {
    return await api.delete(`/laudo-details/sections/${id}`, true);
  },

  // ========== QUESTIONS ==========

  /**
   * Criar uma nova pergunta
   */
  async createQuestion(dto: CreateLaudoQuestionDto): Promise<LaudoQuestion> {
    return await api.post("/laudo-details/questions", dto, true);
  },

  /**
   * Listar todas as perguntas com paginação
   */
  async getAllQuestions(
    page: number = 1,
    limit: number = 10
  ): Promise<{
    data: LaudoQuestion[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }> {
    return await api.get(
      `/laudo-details/questions?page=${page}&limit=${limit}`,
      true
    );
  },

  /**
   * Obter pergunta por ID
   */
  async getQuestionById(id: string): Promise<LaudoQuestion> {
    return await api.get(`/laudo-details/questions/${id}`, true);
  },

  /**
   * Atualizar pergunta
   */
  async updateQuestion(
    id: string,
    dto: UpdateLaudoQuestionDto
  ): Promise<LaudoQuestion> {
    return await api.put(`/laudo-details/questions/${id}`, dto, true);
  },

  /**
   * Deletar pergunta
   */
  async deleteQuestion(id: string): Promise<void> {
    return await api.delete(`/laudo-details/questions/${id}`, true);
  },

  // ========== OPTIONS ==========

  /**
   * Criar uma nova opção
   */
  async createOption(dto: CreateLaudoOptionDto): Promise<LaudoOption> {
    return await api.post("/laudo-details/options", dto, true);
  },

  /**
   * Listar todas as opções com paginação
   */
  async getAllOptions(
    page: number = 1,
    limit: number = 10
  ): Promise<{
    data: LaudoOption[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }> {
    return await api.get(
      `/laudo-details/options?page=${page}&limit=${limit}`,
      true
    );
  },

  /**
   * Obter opção por ID
   */
  async getOptionById(id: string): Promise<LaudoOption> {
    return await api.get(`/laudo-details/options/${id}`, true);
  },

  /**
   * Atualizar opção
   */
  async updateOption(
    id: string,
    dto: UpdateLaudoOptionDto
  ): Promise<LaudoOption> {
    return await api.put(`/laudo-details/options/${id}`, dto, true);
  },

  /**
   * Deletar opção
   */
  async deleteOption(id: string): Promise<void> {
    return await api.delete(`/laudo-details/options/${id}`, true);
  },
};
