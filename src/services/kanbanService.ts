import { api } from "./api";
import {
  KanbanAttachment,
  KanbanCard,
  KanbanComment,
  KanbanHistoryItem,
  KanbanPriority,
  KanbanStatus,
  KanbanSubtask,
  PaginatedResponse,
} from "../types/kanban";

export interface CreateCardPayload {
  title: string;
  description?: string;
  status?: KanbanStatus;
  priority?: KanbanPriority;
}

export interface UpdateCardPayload {
  title?: string;
  description?: string;
  priority?: KanbanPriority;
}

export interface MoveCardPayload {
  status: KanbanStatus;
  position: number;
}

export interface PresignedAttachmentResponse {
  uploadUrl: string;
  s3Key: string;
  expiresIn: number;
  maxFileSizeBytes: number;
  maxFilesPerCard: number;
}

export interface BulkDeleteCardsResponse {
  success: boolean;
  deletedCount: number;
  deletedIds: string[];
}

class KanbanService {
  async listCards(
    page = 1,
    limit = 20
  ): Promise<PaginatedResponse<KanbanCard>> {
    return api.get<PaginatedResponse<KanbanCard>>(
      `/kanban/cards?page=${page}&limit=${limit}`,
      true
    );
  }

  async getCard(cardId: string): Promise<KanbanCard> {
    return api.get<KanbanCard>(`/kanban/cards/${cardId}`, true);
  }

  async createCard(payload: CreateCardPayload): Promise<KanbanCard> {
    return api.post<KanbanCard>("/kanban/cards", payload, true);
  }

  async updateCard(
    cardId: string,
    payload: UpdateCardPayload
  ): Promise<KanbanCard> {
    return api.patch<KanbanCard>(`/kanban/cards/${cardId}`, payload, true);
  }

  async moveCard(
    cardId: string,
    payload: MoveCardPayload
  ): Promise<{ success: boolean }> {
    return api.patch<{ success: boolean }>(
      `/kanban/cards/${cardId}/move`,
      payload,
      true
    );
  }

  async deleteCard(cardId: string): Promise<{ success: boolean }> {
    return api.delete<{ success: boolean }>(`/kanban/cards/${cardId}`, true);
  }

  async deleteCardsBulk(cardIds: string[]): Promise<BulkDeleteCardsResponse> {
    return api.post<BulkDeleteCardsResponse>(
      "/kanban/cards/bulk-delete",
      { cardIds },
      true
    );
  }

  async createSubtask(cardId: string, title: string): Promise<KanbanSubtask> {
    return api.post<KanbanSubtask>(
      `/kanban/cards/${cardId}/subtasks`,
      {
        title,
      },
      true
    );
  }

  async updateSubtask(
    cardId: string,
    subtaskId: string,
    payload: { title?: string; done?: boolean }
  ): Promise<KanbanSubtask> {
    return api.patch<KanbanSubtask>(
      `/kanban/cards/${cardId}/subtasks/${subtaskId}`,
      payload,
      true
    );
  }

  async deleteSubtask(
    cardId: string,
    subtaskId: string
  ): Promise<{ success: boolean }> {
    return api.delete<{ success: boolean }>(
      `/kanban/cards/${cardId}/subtasks/${subtaskId}`,
      true
    );
  }

  async listSubtasks(
    cardId: string,
    page = 1,
    limit = 20
  ): Promise<PaginatedResponse<KanbanSubtask>> {
    return api.get<PaginatedResponse<KanbanSubtask>>(
      `/kanban/cards/${cardId}/subtasks?page=${page}&limit=${limit}`,
      true
    );
  }

  async listComments(
    cardId: string,
    page = 1,
    limit = 20,
    hasAttachments?: boolean
  ): Promise<PaginatedResponse<KanbanComment>> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (typeof hasAttachments === "boolean") {
      params.set("hasAttachments", String(hasAttachments));
    }
    return api.get<PaginatedResponse<KanbanComment>>(
      `/kanban/cards/${cardId}/comments?${params.toString()}`,
      true
    );
  }

  async createComment(cardId: string, content: string): Promise<KanbanComment> {
    return api.post<KanbanComment>(
      `/kanban/cards/${cardId}/comments`,
      {
        content,
      },
      true
    );
  }

  async updateComment(
    cardId: string,
    commentId: string,
    content: string
  ): Promise<KanbanComment> {
    return api.patch<KanbanComment>(
      `/kanban/cards/${cardId}/comments/${commentId}`,
      {
        content,
      },
      true
    );
  }

  async deleteComment(
    cardId: string,
    commentId: string
  ): Promise<{ success: boolean }> {
    return api.delete<{ success: boolean }>(
      `/kanban/cards/${cardId}/comments/${commentId}`,
      true
    );
  }

  async listHistory(
    cardId: string,
    page = 1,
    limit = 20
  ): Promise<PaginatedResponse<KanbanHistoryItem>> {
    return api.get<PaginatedResponse<KanbanHistoryItem>>(
      `/kanban/cards/${cardId}/history?page=${page}&limit=${limit}`,
      true
    );
  }

  async createAttachmentUploadUrl(
    cardId: string,
    file: File,
    commentId?: string
  ): Promise<PresignedAttachmentResponse> {
    return api.post<PresignedAttachmentResponse>(
      `/kanban/cards/${cardId}/attachments/presigned-url`,
      {
        filename: file.name,
        mimeType: file.type || "application/octet-stream",
        fileSize: file.size,
        commentId,
      },
      true
    );
  }

  async confirmAttachment(
    cardId: string,
    file: File,
    s3Key: string,
    commentId?: string
  ): Promise<KanbanAttachment> {
    return api.post<KanbanAttachment>(
      `/kanban/cards/${cardId}/attachments/confirm`,
      {
        filename: file.name,
        mimeType: file.type || "application/octet-stream",
        fileSize: file.size,
        s3Key,
        commentId,
      },
      true
    );
  }

  async listAttachments(
    cardId: string,
    page = 1,
    limit = 20
  ): Promise<PaginatedResponse<KanbanAttachment>> {
    return api.get<PaginatedResponse<KanbanAttachment>>(
      `/kanban/cards/${cardId}/attachments?page=${page}&limit=${limit}`,
      true
    );
  }

  async deleteAttachment(
    cardId: string,
    attachmentId: string
  ): Promise<{ success: boolean }> {
    return api.delete<{ success: boolean }>(
      `/kanban/cards/${cardId}/attachments/${attachmentId}`,
      true
    );
  }

  async uploadFileToPresignedUrl(uploadUrl: string, file: File): Promise<void> {
    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
      body: file,
    });

    if (!response.ok) {
      throw new Error("Falha no upload do arquivo");
    }
  }
}

export const kanbanService = new KanbanService();
