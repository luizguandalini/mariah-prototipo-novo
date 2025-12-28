export interface LaudoSection {
  id: string;
  name: string;
  questions?: LaudoQuestion[];
  createdAt: string;
  updatedAt: string;
}

export interface LaudoQuestion {
  id: string;
  sectionId: string;
  section?: LaudoSection;
  questionText?: string;
  options?: LaudoOption[];
  createdAt: string;
  updatedAt: string;
}

export interface LaudoOption {
  id: string;
  questionId: string;
  question?: LaudoQuestion;
  optionText: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLaudoSectionDto {
  name: string;
}

export interface UpdateLaudoSectionDto {
  name?: string;
}

export interface CreateLaudoQuestionDto {
  sectionId: string;
  questionText?: string;
}

export interface UpdateLaudoQuestionDto {
  questionText?: string;
}

export interface CreateLaudoOptionDto {
  questionId: string;
  optionText: string;
}

export interface UpdateLaudoOptionDto {
  optionText?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
