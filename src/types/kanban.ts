export enum KanbanStatus {
  TODO = "TODO",
  DOING = "DOING",
  REVIEW = "REVIEW",
  DONE = "DONE",
}

export enum KanbanPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export interface KanbanSubtask {
  id: string;
  cardId: string;
  title: string;
  done: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface KanbanAttachment {
  id: string;
  cardId: string;
  commentId?: string | null;
  uploadedById?: string;
  uploadedByName: string;
  filename: string;
  mimeType?: string;
  size: number;
  s3Key: string;
  createdAt: string;
  url?: string | null;
}

export interface KanbanComment {
  id: string;
  cardId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  attachments?: KanbanAttachment[];
}

export interface KanbanHistoryItem {
  id: string;
  cardId: string;
  actorName: string;
  action: string;
  summary: string;
  details?: Record<string, unknown> | null;
  createdAt: string;
}

export interface KanbanCard {
  id: string;
  title: string;
  description?: string | null;
  status: KanbanStatus;
  priority: KanbanPriority;
  position: number;
  createdById: string;
  updatedById: string;
  lastInteractionSummary?: string | null;
  lastInteractionAt?: string | null;
  subtasks?: KanbanSubtask[];
  attachments?: KanbanAttachment[];
  commentCount?: number;
  attachmentCount?: number;
  completedSubtasks?: number;
  totalSubtasks?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}
