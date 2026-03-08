import {
  ClipboardEvent,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  DndContext,
  DragCancelEvent,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import {
  CheckCircle2,
  CircleDot,
  ClipboardList,
  PlayCircle,
  SearchCheck,
} from "lucide-react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Button from "../../components/ui/Button";
import { useAuth } from "../../contexts/AuthContext";
import { kanbanService } from "../../services/kanbanService";
import {
  KanbanAttachment,
  KanbanCard,
  KanbanComment,
  KanbanHistoryItem,
  KanbanPriority,
  KanbanStatus,
  KanbanSubtask,
} from "../../types/kanban";

const STATUS_ORDER = [
  KanbanStatus.TODO,
  KanbanStatus.DOING,
  KanbanStatus.REVIEW,
  KanbanStatus.DONE,
];

const STATUS_LABEL: Record<KanbanStatus, string> = {
  [KanbanStatus.TODO]: "A Fazer",
  [KanbanStatus.DOING]: "Em Progresso",
  [KanbanStatus.REVIEW]: "Em Revisão",
  [KanbanStatus.DONE]: "Concluído",
};

const STATUS_META: Record<
  KanbanStatus,
  {
    icon: typeof ClipboardList;
    chipClass: string;
    containerClass: string;
  }
> = {
  [KanbanStatus.TODO]: {
    icon: ClipboardList,
    chipClass: "bg-slate-500/15 text-slate-300 border-slate-400/30",
    containerClass: "border-slate-500/25",
  },
  [KanbanStatus.DOING]: {
    icon: PlayCircle,
    chipClass: "bg-blue-500/15 text-blue-300 border-blue-400/30",
    containerClass: "border-blue-500/25",
  },
  [KanbanStatus.REVIEW]: {
    icon: SearchCheck,
    chipClass: "bg-amber-500/15 text-amber-300 border-amber-400/30",
    containerClass: "border-amber-500/25",
  },
  [KanbanStatus.DONE]: {
    icon: CheckCircle2,
    chipClass: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
    containerClass: "border-emerald-500/25",
  },
};

const PRIORITY_LABEL: Record<KanbanPriority, string> = {
  [KanbanPriority.LOW]: "Baixa",
  [KanbanPriority.MEDIUM]: "Média",
  [KanbanPriority.HIGH]: "Alta",
  [KanbanPriority.CRITICAL]: "Crítica",
};

const PRIORITY_BADGE: Record<KanbanPriority, string> = {
  [KanbanPriority.LOW]: "bg-slate-500/15 text-slate-400",
  [KanbanPriority.MEDIUM]: "bg-blue-500/15 text-blue-400",
  [KanbanPriority.HIGH]: "bg-amber-500/15 text-amber-400",
  [KanbanPriority.CRITICAL]: "bg-red-500/15 text-red-400",
};

function KanbanCardContent({
  card,
  headerActions,
}: {
  card: KanbanCard;
  headerActions?: ReactNode;
}) {
  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-[var(--text-primary)] text-sm">
          {card.title}
        </p>
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] px-2 py-1 rounded-full ${
              PRIORITY_BADGE[card.priority]
            }`}
          >
            {PRIORITY_LABEL[card.priority]}
          </span>
          {headerActions}
        </div>
      </div>
      {card.description && (
        <p className="text-xs text-[var(--text-secondary)] mt-2 line-clamp-2">
          {card.description}
        </p>
      )}
      <div className="mt-3 flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
        <span>
          {card.completedSubtasks || 0}/{card.totalSubtasks || 0} subtasks
        </span>
        <span>💬 {card.commentCount || 0}</span>
        <span>📎 {card.attachmentCount || 0}</span>
      </div>
      {card.lastInteractionSummary && (
        <p className="mt-2 text-[11px] text-[var(--text-secondary)] truncate">
          {card.lastInteractionSummary}
        </p>
      )}
    </>
  );
}

function SortableCard({
  card,
  onOpen,
  onToggleSelection,
  isOpening,
  isMoving,
  isMoveLocked,
  isSelectionMode,
  isMultiSelected,
  isSelected,
  isDisabled,
}: {
  card: KanbanCard;
  onOpen: (cardId: string) => void;
  onToggleSelection: (cardId: string) => void;
  isOpening: boolean;
  isMoving: boolean;
  isMoveLocked: boolean;
  isSelectionMode: boolean;
  isMultiSelected: boolean;
  isSelected: boolean;
  isDisabled: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    disabled: isMoveLocked || isSelectionMode,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <div
        role="button"
        tabIndex={0}
        aria-busy={isOpening}
        onClick={() => {
          if (!isDisabled && !isMoveLocked) {
            if (isSelectionMode) {
              onToggleSelection(card.id);
              return;
            }
            onOpen(card.id);
          }
        }}
        onKeyDown={(event) => {
          if (isDisabled || isMoveLocked) {
            return;
          }
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (isSelectionMode) {
              onToggleSelection(card.id);
              return;
            }
            onOpen(card.id);
          }
        }}
        className={`w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] p-3 text-left shadow-sm transition ${
          isSelected
            ? "ring-2 ring-primary/60"
            : isMultiSelected
            ? "ring-2 ring-rose-500/70"
            : "hover:shadow-md"
        } ${isOpening ? "animate-pulse" : ""} ${
          isDragging ? "opacity-70" : "opacity-100"
        } ${
          isDisabled
            ? "cursor-wait pointer-events-none"
            : isMoveLocked
            ? "cursor-not-allowed"
            : "cursor-pointer"
        }`}
      >
        <KanbanCardContent
          card={card}
          headerActions={
            <div className="flex items-center gap-2">
              {isSelectionMode && (
                <input
                  type="checkbox"
                  checked={isMultiSelected}
                  disabled={isDisabled}
                  onChange={() => onToggleSelection(card.id)}
                  onClick={(event) => event.stopPropagation()}
                  className="h-4 w-4 cursor-pointer accent-primary disabled:cursor-not-allowed"
                />
              )}
              <button
                ref={setActivatorNodeRef}
                type="button"
                disabled={isDisabled || isMoveLocked || isSelectionMode}
                className="h-6 w-6 rounded-md border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-grab active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-60"
                onClick={(event) => {
                  event.stopPropagation();
                }}
                {...attributes}
                {...listeners}
              >
                ⋮⋮
              </button>
            </div>
          }
        />
        {isOpening && (
          <p className="mt-2 text-[11px] text-primary font-medium">
            Carregando card...
          </p>
        )}
        {isMoving && (
          <p className="mt-2 text-[11px] text-amber-400 font-medium">
            Movendo card...
          </p>
        )}
      </div>
    </div>
  );
}

function KanbanColumn({
  status,
  cards,
  onOpen,
  onToggleSelection,
  openingCardId,
  movingCardId,
  isDeletingCards,
  isSelectionMode,
  selectedCardIds,
  selectedCardId,
}: {
  status: KanbanStatus;
  cards: KanbanCard[];
  onOpen: (cardId: string) => void;
  onToggleSelection: (cardId: string) => void;
  openingCardId: string | null;
  movingCardId: string | null;
  isDeletingCards: boolean;
  isSelectionMode: boolean;
  selectedCardIds: string[];
  selectedCardId: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${status}`,
  });
  const statusMeta = STATUS_META[status];
  const StatusIcon = statusMeta.icon;

  return (
    <div
      className={`rounded-xl border bg-[var(--bg-secondary)] p-3 min-h-[280px] ${statusMeta.containerClass}`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3
          className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-sm font-bold ${statusMeta.chipClass}`}
        >
          <StatusIcon size={15} />
          {STATUS_LABEL[status]}
        </h3>
        <span className="text-xs px-2 py-1 rounded-full bg-[var(--bg-primary)] text-[var(--text-secondary)]">
          {cards.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`space-y-2 rounded-lg p-1 transition ${
          isOver ? "bg-primary/10" : "bg-transparent"
        }`}
      >
        <SortableContext
          items={cards.map((card) => card.id)}
          strategy={rectSortingStrategy}
        >
          {cards.map((card) => (
            <SortableCard
              key={card.id}
              card={card}
              onOpen={onOpen}
              onToggleSelection={onToggleSelection}
              isOpening={openingCardId === card.id}
              isMoving={movingCardId === card.id}
              isMoveLocked={Boolean(movingCardId)}
              isSelectionMode={isSelectionMode}
              isMultiSelected={selectedCardIds.includes(card.id)}
              isSelected={selectedCardId === card.id}
              isDisabled={Boolean(openingCardId) || isDeletingCards}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

export default function Kanban() {
  const { user } = useAuth();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [loadingBoard, setLoadingBoard] = useState(true);
  const [loadingMoreCards, setLoadingMoreCards] = useState(false);
  const [isSavingCard, setIsSavingCard] = useState(false);
  const [isUpdatingCard, setIsUpdatingCard] = useState(false);
  const [isDeletingCards, setIsDeletingCards] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [cardsPage, setCardsPage] = useState(1);
  const [cardsTotal, setCardsTotal] = useState(0);
  const [hasMoreCards, setHasMoreCards] = useState(false);
  const [openingCardId, setOpeningCardId] = useState<string | null>(null);
  const [movingCardId, setMovingCardId] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<KanbanCard | null>(null);
  const [subtasks, setSubtasks] = useState<KanbanSubtask[]>([]);
  const [attachments, setAttachments] = useState<KanbanAttachment[]>([]);
  const [comments, setComments] = useState<KanbanComment[]>([]);
  const [history, setHistory] = useState<KanbanHistoryItem[]>([]);
  const [subtasksPage, setSubtasksPage] = useState(1);
  const [attachmentsPage, setAttachmentsPage] = useState(1);
  const [commentsPage, setCommentsPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [hasMoreSubtasks, setHasMoreSubtasks] = useState(false);
  const [hasMoreAttachments, setHasMoreAttachments] = useState(false);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [loadingSubtasks, setLoadingSubtasks] = useState(false);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const commentsRequestRef = useRef(0);
  const [isCreatingComment, setIsCreatingComment] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [commentFiles, setCommentFiles] = useState<File[]>([]);
  const [removingAttachmentIds, setRemovingAttachmentIds] = useState<string[]>(
    []
  );
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState("");
  const [commentsTab, setCommentsTab] = useState<
    "withAttachments" | "withoutAttachments"
  >("withAttachments");
  const [isCreateCardModalOpen, setIsCreateCardModalOpen] = useState(false);
  const [newSubtask, setNewSubtask] = useState("");
  const [newCardTitle, setNewCardTitle] = useState("");
  const [newCardDescription, setNewCardDescription] = useState("");
  const [newCardPriority, setNewCardPriority] = useState<KanbanPriority>(
    KanbanPriority.MEDIUM
  );
  const cardsRef = useRef<KanbanCard[]>([]);
  const cardsTotalRef = useRef(0);

  const cardsByStatus = useMemo(
    () =>
      STATUS_ORDER.reduce((acc, status) => {
        acc[status] = cards
          .filter((card) => card.status === status)
          .sort((a, b) => a.position - b.position);
        return acc;
      }, {} as Record<KanbanStatus, KanbanCard[]>),
    [cards]
  );

  const filteredComments = comments;
  const canRemoveAttachment = useCallback(
    (attachment: { commentId?: string | null; uploadedById?: string }) => {
      if (!user?.id) {
        return false;
      }
      if (attachment.commentId) {
        const linkedComment = comments.find(
          (comment) => comment.id === attachment.commentId
        );
        if (linkedComment) {
          return linkedComment.authorId === user.id;
        }
      }
      if (attachment.uploadedById) {
        return attachment.uploadedById === user.id;
      }
      return false;
    },
    [comments, user]
  );

  const loadBoard = useCallback(async (page = 1, append = false) => {
    if (append) {
      setLoadingMoreCards(true);
    } else {
      setLoadingBoard(true);
    }
    try {
      const response = await kanbanService.listCards(page, 20);
      setCards((prev) =>
        append ? [...prev, ...response.items] : response.items
      );
      setCardsPage(response.page);
      setCardsTotal(response.total);
      setHasMoreCards(response.hasMore);
    } catch (error) {
      toast.error("Erro ao carregar board do Kanban");
    } finally {
      if (append) {
        setLoadingMoreCards(false);
      } else {
        setLoadingBoard(false);
      }
    }
  }, []);

  const loadSelectedCard = useCallback(async (cardId: string) => {
    try {
      const details = await kanbanService.getCard(cardId);
      setSelectedCard(details);
    } catch (error) {
      toast.error("Erro ao carregar card");
    }
  }, []);

  const loadComments = useCallback(
    async (
      cardId: string,
      page: number,
      tab: "withAttachments" | "withoutAttachments" = commentsTab
    ) => {
      const requestId = commentsRequestRef.current + 1;
      commentsRequestRef.current = requestId;
      setLoadingComments(true);
      try {
        const response = await kanbanService.listComments(
          cardId,
          page,
          20,
          tab === "withAttachments"
        );
        if (requestId !== commentsRequestRef.current) {
          return;
        }
        setComments(response.items);
        setCommentsPage(response.page);
        setHasMoreComments(response.hasMore);
      } catch (error) {
        if (requestId !== commentsRequestRef.current) {
          return;
        }
        toast.error("Erro ao carregar comentários");
      } finally {
        if (requestId === commentsRequestRef.current) {
          setLoadingComments(false);
        }
      }
    },
    [commentsTab]
  );

  const loadSubtasks = useCallback(
    async (cardId: string, page: number) => {
      if (loadingSubtasks) {
        return;
      }
      setLoadingSubtasks(true);
      try {
        const response = await kanbanService.listSubtasks(cardId, page, 20);
        setSubtasks(response.items);
        setSubtasksPage(response.page);
        setHasMoreSubtasks(response.hasMore);
      } catch (error) {
        toast.error("Erro ao carregar subtasks");
      } finally {
        setLoadingSubtasks(false);
      }
    },
    [loadingSubtasks]
  );

  const loadAttachments = useCallback(
    async (cardId: string, page: number) => {
      if (loadingAttachments) {
        return;
      }
      setLoadingAttachments(true);
      try {
        const response = await kanbanService.listAttachments(cardId, page, 20);
        setAttachments(response.items);
        setAttachmentsPage(response.page);
        setHasMoreAttachments(response.hasMore);
      } catch (error) {
        toast.error("Erro ao carregar anexos");
      } finally {
        setLoadingAttachments(false);
      }
    },
    [loadingAttachments]
  );

  const loadHistory = useCallback(
    async (cardId: string, page: number, append = false) => {
      if (loadingHistory) {
        return;
      }
      setLoadingHistory(true);
      try {
        const response = await kanbanService.listHistory(cardId, page, 20);
        setHistory((prev) =>
          append ? [...prev, ...response.items] : response.items
        );
        setHistoryPage(response.page);
        setHasMoreHistory(response.hasMore);
      } catch (error) {
        toast.error("Erro ao carregar histórico");
      } finally {
        setLoadingHistory(false);
      }
    },
    [loadingHistory]
  );

  const openCard = useCallback(
    async (cardId: string) => {
      if (isDeletingCards) {
        return;
      }
      if (openingCardId) {
        return;
      }
      setOpeningCardId(cardId);
      setSelectedCardId(cardId);
      setSelectedCard(null);
      setCommentFiles([]);
      setEditingCommentId(null);
      setEditingCommentContent("");
      setCommentsTab("withAttachments");
      try {
        await Promise.all([
          loadSelectedCard(cardId),
          loadSubtasks(cardId, 1),
          loadAttachments(cardId, 1),
          loadComments(cardId, 1, "withAttachments"),
          loadHistory(cardId, 1),
        ]);
      } finally {
        setOpeningCardId(null);
      }
    },
    [
      loadAttachments,
      loadComments,
      loadHistory,
      loadSelectedCard,
      loadSubtasks,
      isDeletingCards,
      openingCardId,
    ]
  );

  const handleChangeCommentsTab = useCallback(
    async (tab: "withAttachments" | "withoutAttachments") => {
      setCommentsTab(tab);
      setComments([]);
      setCommentsPage(1);
      setHasMoreComments(false);
      if (!selectedCardId) {
        return;
      }
      await loadComments(selectedCardId, 1, tab);
    },
    [loadComments, selectedCardId]
  );

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  useEffect(() => {
    cardsRef.current = cards;
  }, [cards]);

  useEffect(() => {
    cardsTotalRef.current = cardsTotal;
  }, [cardsTotal]);

  const handleLoadMoreCards = async () => {
    if (!hasMoreCards || loadingMoreCards || isDeletingCards) {
      return;
    }
    await loadBoard(cardsPage + 1, true);
  };

  const toggleCardSelection = useCallback((cardId: string) => {
    setSelectedCardIds((prev) =>
      prev.includes(cardId)
        ? prev.filter((id) => id !== cardId)
        : [...prev, cardId]
    );
  }, []);

  const removeCardsFromBoard = useCallback(
    (cardIds: string[], totalDeletedCount = cardIds.length) => {
      if (cardIds.length === 0) {
        return;
      }
      const idsSet = new Set(cardIds);
      const currentCards = cardsRef.current;
      const currentTotal = cardsTotalRef.current;
      const nextCards = currentCards.filter((card) => !idsSet.has(card.id));
      const removedVisibleCount = currentCards.length - nextCards.length;
      const nextTotal = Math.max(0, currentTotal - totalDeletedCount);
      setCards(nextCards);
      setCardsTotal(nextTotal);
      setHasMoreCards(nextCards.length < nextTotal);
      setSelectedCardIds((prev) =>
        prev.filter((cardId) => !idsSet.has(cardId))
      );
      if (selectedCardId && idsSet.has(selectedCardId)) {
        setSelectedCardId(null);
        setSelectedCard(null);
        setSubtasks([]);
        setAttachments([]);
        setComments([]);
        setHistory([]);
      }

      if (
        removedVisibleCount !== cardIds.length ||
        nextCards.length > nextTotal
      ) {
        void loadBoard(1);
      }
    },
    [loadBoard, selectedCardId]
  );

  const handleToggleSelectionMode = () => {
    if (isDeletingCards) {
      return;
    }
    if (isSelectionMode) {
      setIsSelectionMode(false);
      setSelectedCardIds([]);
      return;
    }
    setIsSelectionMode(true);
  };

  const handleDeleteSelectedCards = async () => {
    if (selectedCardIds.length === 0 || isDeletingCards) {
      return;
    }
    setIsDeletingCards(true);
    const targetIds = [...selectedCardIds];
    try {
      const response = await kanbanService.deleteCardsBulk(targetIds);
      removeCardsFromBoard(targetIds, response.deletedCount);
      setSelectedCardIds([]);
      setIsSelectionMode(false);
      toast.success(
        response.deletedCount === 1
          ? "1 card removido"
          : `${response.deletedCount} cards removidos`
      );
    } catch (error) {
      toast.error("Erro ao remover cards selecionados");
    } finally {
      setIsDeletingCards(false);
    }
  };

  const handleCreateCard = async () => {
    if (isDeletingCards) {
      return;
    }
    if (!newCardTitle.trim()) {
      toast.error("Informe o título do card");
      return;
    }
    setIsSavingCard(true);
    try {
      const createdCard = await kanbanService.createCard({
        title: newCardTitle.trim(),
        description: newCardDescription.trim(),
        priority: newCardPriority,
        status: KanbanStatus.TODO,
      });
      const visibleCardsLimit = cardsPage * 20;
      const canAppendToLoadedCards = cards.length < visibleCardsLimit;
      if (canAppendToLoadedCards) {
        setCards((prev) => [
          ...prev,
          {
            ...createdCard,
            commentCount: 0,
            attachmentCount: 0,
            totalSubtasks: 0,
            completedSubtasks: 0,
          },
        ]);
      } else {
        setHasMoreCards(true);
      }
      setCardsTotal((prev) => prev + 1);
      setNewCardTitle("");
      setNewCardDescription("");
      setNewCardPriority(KanbanPriority.MEDIUM);
      setIsCreateCardModalOpen(false);
      toast.success("Card criado");
    } catch (error) {
      toast.error("Erro ao criar card");
    } finally {
      setIsSavingCard(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    if (isDeletingCards) {
      return;
    }
    if (movingCardId) {
      return;
    }
    const { active, over } = event;
    setActiveCardId(null);
    if (!over || active.id === over.id) {
      return;
    }

    const activeCard = cards.find((card) => card.id === active.id);
    if (!activeCard) {
      return;
    }

    let targetStatus = activeCard.status;
    let targetPosition = 0;

    const overId = String(over.id);
    if (overId.startsWith("column-")) {
      targetStatus = overId.replace("column-", "") as KanbanStatus;
      targetPosition = cardsByStatus[targetStatus].length;
    } else {
      const overCard = cards.find((card) => card.id === over.id);
      if (!overCard) {
        return;
      }
      targetStatus = overCard.status;
      targetPosition = cardsByStatus[targetStatus].findIndex(
        (card) => card.id === overCard.id
      );
      if (targetPosition < 0) {
        targetPosition = cardsByStatus[targetStatus].length;
      }
    }

    const previousCards = cards;

    try {
      const sameStatusCards = cardsByStatus[activeCard.status];
      const oldIndex = sameStatusCards.findIndex(
        (card) => card.id === activeCard.id
      );
      if (activeCard.status === targetStatus && oldIndex === targetPosition) {
        return;
      }
      setMovingCardId(activeCard.id);

      const nextCards = [...cards];
      const sourceIndex = nextCards.findIndex(
        (card) => card.id === activeCard.id
      );
      if (sourceIndex === -1) {
        return;
      }

      if (activeCard.status === targetStatus) {
        const scoped = nextCards
          .filter((card) => card.status === targetStatus)
          .sort((a, b) => a.position - b.position);
        const scopedFrom = scoped.findIndex(
          (card) => card.id === activeCard.id
        );
        const scopedTo = Math.max(
          0,
          Math.min(targetPosition, scoped.length - 1)
        );
        const moved = arrayMove(scoped, scopedFrom, scopedTo).map(
          (card, index) => ({
            ...card,
            position: index,
          })
        );
        const out = nextCards
          .filter((card) => card.status !== targetStatus)
          .concat(moved)
          .sort((a, b) => {
            if (a.status !== b.status) {
              return (
                STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)
              );
            }
            return a.position - b.position;
          });
        setCards(out);
      } else {
        const updated = nextCards.map((card) =>
          card.id === activeCard.id ? { ...card, status: targetStatus } : card
        );
        const source = updated
          .filter(
            (card) =>
              card.status === activeCard.status && card.id !== activeCard.id
          )
          .sort((a, b) => a.position - b.position)
          .map((card, index) => ({ ...card, position: index }));
        const target = updated
          .filter(
            (card) => card.status === targetStatus && card.id !== activeCard.id
          )
          .sort((a, b) => a.position - b.position);
        const movedCard = updated.find((card) => card.id === activeCard.id);
        if (!movedCard) {
          return;
        }
        const insertAt = Math.max(0, Math.min(targetPosition, target.length));
        target.splice(insertAt, 0, movedCard);
        const targetReindexed = target.map((card, index) => ({
          ...card,
          position: index,
        }));
        const untouched = updated.filter(
          (card) =>
            card.status !== activeCard.status && card.status !== targetStatus
        );
        setCards(
          [...untouched, ...source, ...targetReindexed].sort((a, b) => {
            if (a.status !== b.status) {
              return (
                STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)
              );
            }
            return a.position - b.position;
          })
        );
      }

      await kanbanService.moveCard(activeCard.id, {
        status: targetStatus,
        position: targetPosition,
      });

      const refreshedCard = await kanbanService.getCard(activeCard.id);
      setCards((prev) =>
        prev.map((card) =>
          card.id === activeCard.id
            ? {
                ...card,
                ...refreshedCard,
                status: card.status,
                position: card.position,
              }
            : card
        )
      );

      if (selectedCardId === activeCard.id) {
        setSelectedCard(refreshedCard);
        const refreshedHistory = await kanbanService.listHistory(
          activeCard.id,
          1,
          20
        );
        setHistory(refreshedHistory.items);
        setHistoryPage(refreshedHistory.page);
        setHasMoreHistory(refreshedHistory.hasMore);
      }
    } catch (error) {
      toast.error("Erro ao mover card");
      setCards(previousCards);
    } finally {
      setMovingCardId(null);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    if (isDeletingCards) {
      toast.error("Aguarde a exclusão terminar");
      return;
    }
    if (isSelectionMode) {
      toast.error("Desative a seleção múltipla para mover cards");
      return;
    }
    if (movingCardId) {
      toast.error("Aguarde a movimentação atual terminar");
      return;
    }
    setActiveCardId(String(event.active.id));
  };

  const handleDragCancel = (_event: DragCancelEvent) => {
    setActiveCardId(null);
  };

  const activeCard = useMemo(
    () =>
      activeCardId
        ? cards.find((card) => card.id === activeCardId) || null
        : null,
    [activeCardId, cards]
  );

  const handleUpdateCard = async () => {
    if (!selectedCardId || !selectedCard) {
      return;
    }
    if (isUpdatingCard) {
      return;
    }
    setIsUpdatingCard(true);
    try {
      await kanbanService.updateCard(selectedCardId, {
        title: selectedCard.title,
        description: selectedCard.description || "",
        priority: selectedCard.priority,
      });
      await Promise.all([loadBoard(), loadSelectedCard(selectedCardId)]);
      toast.success("Card atualizado");
    } catch (error) {
      toast.error("Erro ao atualizar card");
    } finally {
      setIsUpdatingCard(false);
    }
  };

  const handleDeleteCard = async () => {
    if (!selectedCardId || isDeletingCards) {
      return;
    }
    setIsDeletingCards(true);
    try {
      await kanbanService.deleteCard(selectedCardId);
      removeCardsFromBoard([selectedCardId]);
      toast.success("Card removido");
    } catch (error) {
      toast.error("Erro ao remover card");
    } finally {
      setIsDeletingCards(false);
    }
  };

  const handleCreateSubtask = async () => {
    if (!selectedCardId || !newSubtask.trim()) {
      return;
    }
    try {
      await kanbanService.createSubtask(selectedCardId, newSubtask.trim());
      setNewSubtask("");
      await Promise.all([
        loadSubtasks(selectedCardId, subtasksPage),
        loadSelectedCard(selectedCardId),
        loadBoard(),
      ]);
    } catch (error) {
      toast.error("Erro ao criar subtask");
    }
  };

  const handleToggleSubtask = async (subtask: KanbanSubtask) => {
    if (!selectedCardId) {
      return;
    }
    const nextDone = !subtask.done;
    const previousSubtasks = subtasks;
    const previousSelectedCard = selectedCard;
    setSubtasks((prev) =>
      prev.map((item) =>
        item.id === subtask.id ? { ...item, done: nextDone } : item
      )
    );
    setSelectedCard((prev) =>
      prev
        ? {
            ...prev,
            subtasks: (prev.subtasks || []).map((item) =>
              item.id === subtask.id ? { ...item, done: nextDone } : item
            ),
          }
        : prev
    );
    try {
      await kanbanService.updateSubtask(selectedCardId, subtask.id, {
        done: nextDone,
      });
      await Promise.all([loadSelectedCard(selectedCardId), loadBoard()]);
    } catch (error) {
      setSubtasks(previousSubtasks);
      setSelectedCard(previousSelectedCard);
      toast.error("Erro ao atualizar subtask");
    }
  };

  const handleEditSubtask = async (subtask: KanbanSubtask) => {
    if (!selectedCardId) {
      return;
    }
    const nextTitle = window.prompt("Novo título da subtask", subtask.title);
    if (!nextTitle || nextTitle.trim() === subtask.title) {
      return;
    }
    try {
      await kanbanService.updateSubtask(selectedCardId, subtask.id, {
        title: nextTitle.trim(),
      });
      await Promise.all([
        loadSubtasks(selectedCardId, subtasksPage),
        loadSelectedCard(selectedCardId),
        loadBoard(),
      ]);
    } catch (error) {
      toast.error("Erro ao editar subtask");
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    if (!selectedCardId) {
      return;
    }
    try {
      await kanbanService.deleteSubtask(selectedCardId, subtaskId);
      await Promise.all([
        loadSubtasks(selectedCardId, 1),
        loadSelectedCard(selectedCardId),
        loadBoard(),
      ]);
    } catch (error) {
      toast.error("Erro ao remover subtask");
    }
  };

  const handleCreateComment = async () => {
    if (!selectedCardId) {
      return;
    }
    if (isCreatingComment) {
      return;
    }
    const content = newComment.trim();
    if (!content) {
      toast.error("Escreva um comentário");
      return;
    }
    if (content.length > 10000) {
      toast.error("Comentário excede 10.000 caracteres");
      return;
    }
    const existingCount = attachments.length;
    if (existingCount + commentFiles.length > 50) {
      toast.error("Limite de 50 arquivos por card");
      return;
    }
    setIsCreatingComment(true);
    try {
      const comment = await kanbanService.createComment(
        selectedCardId,
        content
      );
      for (const file of commentFiles) {
        if (file.size > 104857600) {
          toast.error(`Arquivo ${file.name} excede 100MB`);
          continue;
        }
        const presigned = await kanbanService.createAttachmentUploadUrl(
          selectedCardId,
          file,
          comment.id
        );
        await kanbanService.uploadFileToPresignedUrl(presigned.uploadUrl, file);
        await kanbanService.confirmAttachment(
          selectedCardId,
          file,
          presigned.s3Key,
          comment.id
        );
      }
      setNewComment("");
      setCommentFiles([]);
      await Promise.all([
        loadSubtasks(selectedCardId, subtasksPage),
        loadAttachments(selectedCardId, 1),
        loadComments(selectedCardId, 1, commentsTab),
        loadHistory(selectedCardId, 1),
        loadSelectedCard(selectedCardId),
        loadBoard(),
      ]);
    } catch (error) {
      toast.error("Erro ao comentar");
    } finally {
      setIsCreatingComment(false);
    }
  };

  const handleStartEditComment = (comment: KanbanComment) => {
    setEditingCommentId(comment.id);
    setEditingCommentContent(comment.content);
  };

  const handleUpdateComment = async () => {
    if (!selectedCardId) {
      return;
    }
    if (!editingCommentId) {
      return;
    }
    const content = editingCommentContent.trim();
    if (!content) {
      toast.error("Comentário não pode ser vazio");
      return;
    }
    if (content.length > 10000) {
      toast.error("Comentário excede 10.000 caracteres");
      return;
    }
    try {
      await kanbanService.updateComment(
        selectedCardId,
        editingCommentId,
        content
      );
      setEditingCommentId(null);
      setEditingCommentContent("");
      await Promise.all([
        loadComments(selectedCardId, 1, commentsTab),
        loadAttachments(selectedCardId, attachmentsPage),
        loadHistory(selectedCardId, 1),
      ]);
      toast.success("Comentário atualizado");
    } catch (error) {
      toast.error("Erro ao atualizar comentário");
    }
  };

  const appendCommentFiles = useCallback(
    (incomingFiles: File[]) => {
      if (incomingFiles.length === 0) {
        return;
      }
      setCommentFiles((previousFiles) => {
        const existingCount = attachments.length;
        const availableSlots = Math.max(
          0,
          50 - existingCount - previousFiles.length
        );
        const existingKeys = new Set(
          previousFiles.map(
            (file) => `${file.name}-${file.size}-${file.lastModified}`
          )
        );
        const uniqueIncoming = incomingFiles.filter(
          (file) =>
            !existingKeys.has(`${file.name}-${file.size}-${file.lastModified}`)
        );
        const filesToAdd = uniqueIncoming.slice(0, availableSlots);
        if (uniqueIncoming.length > filesToAdd.length) {
          toast.error("Limite de 50 arquivos por card");
        }
        return [...previousFiles, ...filesToAdd];
      });
    },
    [attachments.length]
  );

  const handleSelectCommentFiles = (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }
    appendCommentFiles(Array.from(files));
  };

  const handlePasteCommentFiles = (
    event: ClipboardEvent<HTMLTextAreaElement>
  ) => {
    const clipboardFiles = Array.from(event.clipboardData.items)
      .filter((item) => item.kind === "file")
      .map((item) => item.getAsFile())
      .filter((file): file is File => Boolean(file))
      .map(
        (file) =>
          new File([file], file.name || `imagem-colada-${Date.now()}.png`, {
            type: file.type || "image/png",
          })
      );
    if (clipboardFiles.length === 0) {
      return;
    }
    event.preventDefault();
    appendCommentFiles(clipboardFiles);
    toast.success(
      clipboardFiles.length === 1
        ? "Imagem colada como anexo"
        : `${clipboardFiles.length} anexos colados`
    );
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!selectedCardId) {
      return;
    }
    try {
      await kanbanService.deleteComment(selectedCardId, commentId);
      if (editingCommentId === commentId) {
        setEditingCommentId(null);
        setEditingCommentContent("");
      }
      await Promise.all([
        loadComments(selectedCardId, 1, commentsTab),
        loadHistory(selectedCardId, 1),
        loadSelectedCard(selectedCardId),
        loadBoard(),
      ]);
      toast.success("Comentário removido");
    } catch (error) {
      toast.error("Erro ao remover comentário");
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!selectedCardId) {
      return;
    }
    if (removingAttachmentIds.includes(attachmentId)) {
      return;
    }
    const previousComments = comments;
    const previousSelectedCard = selectedCard;
    const previousAttachments = attachments;
    setRemovingAttachmentIds((prev) => [...prev, attachmentId]);
    setComments((prev) =>
      prev.map((comment) => ({
        ...comment,
        attachments: (comment.attachments || []).filter(
          (attachment) => attachment.id !== attachmentId
        ),
      }))
    );
    setSelectedCard((prev) =>
      prev
        ? {
            ...prev,
            attachments: (prev.attachments || []).filter(
              (attachment) => attachment.id !== attachmentId
            ),
          }
        : prev
    );
    setAttachments((prev) =>
      prev.filter((attachment) => attachment.id !== attachmentId)
    );
    try {
      await kanbanService.deleteAttachment(selectedCardId, attachmentId);
      await Promise.all([
        loadComments(selectedCardId, commentsPage, commentsTab),
        loadAttachments(selectedCardId, attachmentsPage),
        loadSelectedCard(selectedCardId),
        loadHistory(selectedCardId, 1),
        loadBoard(),
      ]);
      toast.success("Anexo removido");
    } catch (error) {
      setComments(previousComments);
      setSelectedCard(previousSelectedCard);
      setAttachments(previousAttachments);
      toast.error("Erro ao remover anexo");
    } finally {
      setRemovingAttachmentIds((prev) =>
        prev.filter((currentId) => currentId !== attachmentId)
      );
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                onClick={() => setIsCreateCardModalOpen(true)}
                disabled={isDeletingCards}
              >
                Novo Card
              </Button>
              <Button
                size="sm"
                variant={isSelectionMode ? "secondary" : "outline"}
                onClick={handleToggleSelectionMode}
                disabled={isDeletingCards}
              >
                {isSelectionMode ? "Cancelar seleção" : "Selecionar cards"}
              </Button>
              {isSelectionMode && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDeleteSelectedCards}
                  disabled={selectedCardIds.length === 0}
                  isLoading={isDeletingCards}
                  className="ring-2 ring-red-500/35"
                >
                  Excluir selecionados ({selectedCardIds.length})
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-secondary)]">
                Mostrando {cards.length} de {cardsTotal} cards
              </span>
              {hasMoreCards && (
                <Button
                  size="sm"
                  onClick={handleLoadMoreCards}
                  isLoading={loadingMoreCards}
                  disabled={isDeletingCards}
                  className="ring-2 ring-primary/40"
                >
                  Carregar mais cards
                </Button>
              )}
            </div>
          </div>
          {openingCardId && (
            <p className="mt-3 text-xs text-primary font-medium">
              Abrindo card selecionado...
            </p>
          )}
          {movingCardId && (
            <p className="mt-2 text-xs text-amber-400 font-medium">
              Movendo card... aguarde para mover o próximo.
            </p>
          )}
          {isDeletingCards && (
            <p className="mt-2 text-xs text-rose-400 font-medium">
              Excluindo cards... aguarde a finalização para continuar.
            </p>
          )}
        </div>

        {loadingBoard ? (
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 text-center text-[var(--text-secondary)]">
            Carregando board...
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {STATUS_ORDER.map((status) => (
                <KanbanColumn
                  key={status}
                  status={status}
                  cards={cardsByStatus[status]}
                  onOpen={openCard}
                  onToggleSelection={toggleCardSelection}
                  openingCardId={openingCardId}
                  movingCardId={movingCardId}
                  isDeletingCards={isDeletingCards}
                  isSelectionMode={isSelectionMode}
                  selectedCardIds={selectedCardIds}
                  selectedCardId={selectedCardId}
                />
              ))}
            </div>
            <DragOverlay>
              {activeCard ? (
                <div className="w-full max-w-[360px] rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] p-3 text-left shadow-xl opacity-95">
                  <KanbanCardContent card={activeCard} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {isCreateCardModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 p-4 overflow-auto">
          <div className="max-w-xl mx-auto rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-color)]">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                Novo Card
              </h2>
              <button
                type="button"
                className="cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                onClick={() => setIsCreateCardModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-3">
              <input
                value={newCardTitle}
                onChange={(event) => setNewCardTitle(event.target.value)}
                placeholder="Título do card"
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)]"
              />
              <textarea
                value={newCardDescription}
                onChange={(event) => setNewCardDescription(event.target.value)}
                placeholder="Descrição do card"
                rows={6}
                maxLength={10000}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] resize-y"
              />
              <div className="flex justify-end">
                <span className="text-xs text-[var(--text-secondary)]">
                  {newCardDescription.length}/10000
                </span>
              </div>
              <select
                value={newCardPriority}
                onChange={(event) =>
                  setNewCardPriority(event.target.value as KanbanPriority)
                }
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)]"
              >
                {Object.values(KanbanPriority).map((priority) => (
                  <option key={priority} value={priority}>
                    {PRIORITY_LABEL[priority]}
                  </option>
                ))}
              </select>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="px-3 py-2 rounded-lg border border-[var(--border-color)] text-sm text-[var(--text-secondary)]"
                  onClick={() => setIsCreateCardModalOpen(false)}
                >
                  Cancelar
                </button>
                <Button
                  size="sm"
                  onClick={handleCreateCard}
                  isLoading={isSavingCard}
                >
                  Criar Card
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedCardId && selectedCard && (
        <div className="fixed inset-0 bg-black/50 z-50 p-4 overflow-auto">
          <div className="max-w-6xl mx-auto rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-color)]">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                Detalhes do Card
              </h2>
              <button
                type="button"
                className="cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                onClick={() => {
                  setSelectedCardId(null);
                  setSelectedCard(null);
                  setComments([]);
                  setHistory([]);
                  setSubtasks([]);
                  setAttachments([]);
                  setCommentFiles([]);
                  setEditingCommentId(null);
                  setEditingCommentContent("");
                  setSubtasksPage(1);
                  setAttachmentsPage(1);
                  setCommentsPage(1);
                  setHistoryPage(1);
                  setHasMoreSubtasks(false);
                  setHasMoreAttachments(false);
                  setHasMoreComments(false);
                  setHasMoreHistory(false);
                }}
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 p-5">
              <div className="xl:col-span-2 space-y-4">
                <div className="rounded-lg border border-[var(--border-color)] p-4 space-y-3">
                  <input
                    value={selectedCard.title}
                    disabled={isUpdatingCard}
                    onChange={(event) =>
                      setSelectedCard((prev) =>
                        prev ? { ...prev, title: event.target.value } : prev
                      )
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  <textarea
                    value={selectedCard.description || ""}
                    disabled={isUpdatingCard}
                    onChange={(event) =>
                      setSelectedCard((prev) =>
                        prev
                          ? { ...prev, description: event.target.value }
                          : prev
                      )
                    }
                    rows={4}
                    placeholder="Descrição do card"
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={selectedCard.priority}
                      disabled={isUpdatingCard}
                      onChange={(event) =>
                        setSelectedCard((prev) =>
                          prev
                            ? {
                                ...prev,
                                priority: event.target.value as KanbanPriority,
                              }
                            : prev
                        )
                      }
                      className="px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {Object.values(KanbanPriority).map((priority) => (
                        <option key={priority} value={priority}>
                          {PRIORITY_LABEL[priority]}
                        </option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      onClick={handleUpdateCard}
                      isLoading={isUpdatingCard}
                    >
                      {isUpdatingCard ? "Salvando..." : "Salvar"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isUpdatingCard || isDeletingCards}
                      isLoading={isDeletingCards}
                      onClick={handleDeleteCard}
                    >
                      Excluir Card
                    </Button>
                  </div>
                  {isUpdatingCard && (
                    <p className="text-xs text-[var(--text-secondary)]">
                      Salvando alterações...
                    </p>
                  )}
                  {selectedCard.lastInteractionSummary && (
                    <p className="text-xs text-[var(--text-secondary)]">
                      Última interação: {selectedCard.lastInteractionSummary}
                    </p>
                  )}
                </div>

                <div className="rounded-lg border border-[var(--border-color)] p-4">
                  <h3 className="font-semibold text-[var(--text-primary)] mb-3">
                    Subtasks
                  </h3>
                  <div className="flex gap-2 mb-3">
                    <input
                      value={newSubtask}
                      onChange={(event) => setNewSubtask(event.target.value)}
                      placeholder="Nova subtask"
                      className="flex-1 px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)]"
                    />
                    <Button size="sm" onClick={handleCreateSubtask}>
                      Adicionar
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {subtasks.map((subtask) => (
                      <div
                        key={subtask.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border-color)] p-2"
                      >
                        <label className="flex items-center gap-2 flex-1">
                          <input
                            type="checkbox"
                            checked={subtask.done}
                            onChange={() => handleToggleSubtask(subtask)}
                          />
                          <span
                            className={`text-sm ${
                              subtask.done
                                ? "line-through text-[var(--text-secondary)]"
                                : "text-[var(--text-primary)]"
                            }`}
                          >
                            {subtask.title}
                          </span>
                        </label>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleEditSubtask(subtask)}
                            className="px-2 py-1 text-xs rounded border border-[var(--border-color)] text-[var(--text-secondary)]"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSubtask(subtask.id)}
                            className="px-2 py-1 text-xs rounded border border-red-500/30 text-red-400"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    ))}
                    {!loadingSubtasks && subtasks.length === 0 && (
                      <p className="text-xs text-[var(--text-secondary)] text-center">
                        Nenhuma subtask nesta página
                      </p>
                    )}
                    {loadingSubtasks && (
                      <p className="text-xs text-[var(--text-secondary)] text-center">
                        Carregando...
                      </p>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <button
                      type="button"
                      className="px-2 py-1 text-xs rounded border border-[var(--border-color)] text-[var(--text-secondary)] disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={loadingSubtasks || subtasksPage <= 1}
                      onClick={() => {
                        if (!selectedCardId || subtasksPage <= 1) {
                          return;
                        }
                        loadSubtasks(selectedCardId, subtasksPage - 1);
                      }}
                    >
                      Página anterior
                    </button>
                    <span className="text-[11px] text-[var(--text-secondary)]">
                      Página {subtasksPage}
                    </span>
                    <button
                      type="button"
                      className="px-2 py-1 text-xs rounded border border-[var(--border-color)] text-[var(--text-secondary)] disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={loadingSubtasks || !hasMoreSubtasks}
                      onClick={() => {
                        if (!selectedCardId || !hasMoreSubtasks) {
                          return;
                        }
                        loadSubtasks(selectedCardId, subtasksPage + 1);
                      }}
                    >
                      Próxima página
                    </button>
                  </div>
                </div>

                <div className="rounded-lg border border-[var(--border-color)] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-[var(--text-primary)]">
                      Anexos
                    </h3>
                    <span className="text-xs text-[var(--text-secondary)]">
                      Para anexar algo faça um comentário com o anexo
                    </span>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-auto">
                    {attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border-color)] p-2"
                      >
                        <a
                          href={attachment.url || "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-primary truncate"
                        >
                          {attachment.filename}
                        </a>
                        {attachment.commentId && (
                          <span className="text-[10px] text-[var(--text-secondary)]">
                            Para anexar algo faça um comentário com o anexo
                          </span>
                        )}
                        {canRemoveAttachment(attachment) && (
                          <button
                            type="button"
                            disabled={removingAttachmentIds.includes(
                              attachment.id
                            )}
                            onClick={() =>
                              handleDeleteAttachment(attachment.id)
                            }
                            className="px-2 py-1 text-xs rounded border border-red-500/30 text-red-400 disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {removingAttachmentIds.includes(attachment.id)
                              ? "Removendo..."
                              : "Remover"}
                          </button>
                        )}
                      </div>
                    ))}
                    {!loadingAttachments && attachments.length === 0 && (
                      <p className="text-xs text-[var(--text-secondary)] text-center">
                        Nenhum anexo nesta página
                      </p>
                    )}
                    {loadingAttachments && (
                      <p className="text-xs text-[var(--text-secondary)] text-center">
                        Carregando...
                      </p>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <button
                      type="button"
                      className="px-2 py-1 text-xs rounded border border-[var(--border-color)] text-[var(--text-secondary)] disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={loadingAttachments || attachmentsPage <= 1}
                      onClick={() => {
                        if (!selectedCardId || attachmentsPage <= 1) {
                          return;
                        }
                        loadAttachments(selectedCardId, attachmentsPage - 1);
                      }}
                    >
                      Página anterior
                    </button>
                    <span className="text-[11px] text-[var(--text-secondary)]">
                      Página {attachmentsPage}
                    </span>
                    <button
                      type="button"
                      className="px-2 py-1 text-xs rounded border border-[var(--border-color)] text-[var(--text-secondary)] disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={loadingAttachments || !hasMoreAttachments}
                      onClick={() => {
                        if (!selectedCardId || !hasMoreAttachments) {
                          return;
                        }
                        loadAttachments(selectedCardId, attachmentsPage + 1);
                      }}
                    >
                      Próxima página
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-lg border border-[var(--border-color)] p-4">
                  <h3 className="font-semibold text-[var(--text-primary)] mb-3">
                    Comentários
                  </h3>
                  <textarea
                    value={newComment}
                    onChange={(event) => setNewComment(event.target.value)}
                    onPaste={handlePasteCommentFiles}
                    disabled={isCreatingComment}
                    rows={3}
                    maxLength={10000}
                    placeholder="Escreva até 10.000 caracteres"
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  <label
                    className={`mt-2 inline-flex items-center gap-2 rounded-lg border border-[var(--border-color)] px-3 py-2 text-xs text-[var(--text-secondary)] ${
                      isCreatingComment
                        ? "cursor-not-allowed opacity-60"
                        : "cursor-pointer"
                    }`}
                  >
                    <CircleDot size={14} />
                    Adicionar anexos ao comentário
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      disabled={isCreatingComment}
                      onChange={(event) => {
                        handleSelectCommentFiles(event.target.files);
                        event.target.value = "";
                      }}
                    />
                  </label>
                  {commentFiles.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {commentFiles.map((file) => (
                        <span
                          key={`${file.name}-${file.size}-${file.lastModified}`}
                          className="rounded-full border border-[var(--border-color)] px-2 py-1 text-[11px] text-[var(--text-secondary)]"
                        >
                          {file.name}
                        </span>
                      ))}
                      <button
                        type="button"
                        className="rounded-full border border-[var(--border-color)] px-2 py-1 text-[11px] text-[var(--text-secondary)]"
                        onClick={() => setCommentFiles([])}
                      >
                        Limpar
                      </button>
                    </div>
                  )}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-[var(--text-secondary)]">
                      {newComment.length}/10000 • {commentFiles.length}{" "}
                      arquivo(s)
                    </span>
                    <Button
                      size="sm"
                      onClick={handleCreateComment}
                      isLoading={isCreatingComment}
                    >
                      {isCreatingComment ? "Comentando..." : "Comentar"}
                    </Button>
                  </div>
                  {isCreatingComment && (
                    <p className="mt-2 text-[11px] text-[var(--text-secondary)]">
                      Enviando comentário...
                    </p>
                  )}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleChangeCommentsTab("withAttachments")}
                      className={`rounded-lg border px-2 py-1 text-xs ${
                        commentsTab === "withAttachments"
                          ? "border-primary text-primary bg-primary/10"
                          : "border-[var(--border-color)] text-[var(--text-secondary)]"
                      }`}
                    >
                      Com anexos
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleChangeCommentsTab("withoutAttachments")
                      }
                      className={`rounded-lg border px-2 py-1 text-xs ${
                        commentsTab === "withoutAttachments"
                          ? "border-primary text-primary bg-primary/10"
                          : "border-[var(--border-color)] text-[var(--text-secondary)]"
                      }`}
                    >
                      Sem anexos
                    </button>
                  </div>
                  {removingAttachmentIds.length > 0 && (
                    <p className="mt-2 text-[11px] text-[var(--text-secondary)]">
                      Removendo anexo...
                    </p>
                  )}
                  <div className="mt-3 space-y-2 max-h-60 overflow-auto">
                    {filteredComments.map((comment) => (
                      <div
                        key={comment.id}
                        className="rounded-lg border border-[var(--border-color)] p-2"
                      >
                        <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                          <span>{comment.authorName}</span>
                          <span>
                            {new Date(comment.createdAt).toLocaleString(
                              "pt-BR"
                            )}
                          </span>
                        </div>
                        <p className="text-sm text-[var(--text-primary)] mt-1 whitespace-pre-wrap break-words">
                          {comment.content}
                        </p>
                        {comment.updatedAt &&
                          comment.updatedAt !== comment.createdAt && (
                            <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
                              Editado em{" "}
                              {new Date(comment.updatedAt).toLocaleString(
                                "pt-BR"
                              )}
                            </p>
                          )}
                        {(comment.attachments || []).length > 0 && (
                          <div className="mt-2 space-y-2">
                            {(comment.attachments || []).map((attachment) => {
                              const isImage = (
                                attachment.mimeType || ""
                              ).startsWith("image/");
                              return (
                                <div
                                  key={attachment.id}
                                  className="rounded-lg border border-[var(--border-color)] p-2"
                                >
                                  {isImage && attachment.url ? (
                                    <a
                                      href={attachment.url}
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      <img
                                        src={attachment.url}
                                        alt={attachment.filename}
                                        className="mb-2 max-h-48 w-full rounded object-cover"
                                      />
                                    </a>
                                  ) : null}
                                  <div className="flex items-center justify-between gap-2">
                                    <a
                                      href={attachment.url || "#"}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-xs text-primary truncate"
                                    >
                                      {attachment.filename}
                                    </a>
                                    {canRemoveAttachment(attachment) && (
                                      <button
                                        type="button"
                                        disabled={removingAttachmentIds.includes(
                                          attachment.id
                                        )}
                                        onClick={() =>
                                          handleDeleteAttachment(attachment.id)
                                        }
                                        className="px-2 py-1 text-[11px] rounded border border-red-500/30 text-red-400 disabled:opacity-60 disabled:cursor-not-allowed"
                                      >
                                        {removingAttachmentIds.includes(
                                          attachment.id
                                        )
                                          ? "Removendo..."
                                          : "Remover"}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {comment.authorId === user?.id && (
                          <div className="mt-2 flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleStartEditComment(comment)}
                              className="px-2 py-1 text-xs rounded border border-[var(--border-color)] text-[var(--text-secondary)]"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteComment(comment.id)}
                              className="px-2 py-1 text-xs rounded border border-red-500/30 text-red-400"
                            >
                              Remover
                            </button>
                          </div>
                        )}
                        {editingCommentId === comment.id && (
                          <div className="mt-2 space-y-2 rounded-lg border border-[var(--border-color)] p-2">
                            <textarea
                              value={editingCommentContent}
                              onChange={(event) =>
                                setEditingCommentContent(event.target.value)
                              }
                              rows={3}
                              maxLength={10000}
                              className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)]"
                            />
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCommentId(null);
                                  setEditingCommentContent("");
                                }}
                                className="px-2 py-1 text-xs rounded border border-[var(--border-color)] text-[var(--text-secondary)]"
                              >
                                Cancelar
                              </button>
                              <Button size="sm" onClick={handleUpdateComment}>
                                Salvar edição
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {!loadingComments && filteredComments.length === 0 && (
                      <p className="text-xs text-[var(--text-secondary)] text-center">
                        Nenhum comentário nesta aba
                      </p>
                    )}
                    {loadingComments && (
                      <p className="text-xs text-[var(--text-secondary)] text-center">
                        Carregando...
                      </p>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <button
                      type="button"
                      className="px-2 py-1 text-xs rounded border border-[var(--border-color)] text-[var(--text-secondary)] disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={loadingComments || commentsPage <= 1}
                      onClick={() => {
                        if (!selectedCardId || commentsPage <= 1) {
                          return;
                        }
                        loadComments(
                          selectedCardId,
                          commentsPage - 1,
                          commentsTab
                        );
                      }}
                    >
                      Página anterior
                    </button>
                    <span className="text-[11px] text-[var(--text-secondary)]">
                      Página {commentsPage}
                    </span>
                    <button
                      type="button"
                      className="px-2 py-1 text-xs rounded border border-[var(--border-color)] text-[var(--text-secondary)] disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={loadingComments || !hasMoreComments}
                      onClick={() => {
                        if (!selectedCardId || !hasMoreComments) {
                          return;
                        }
                        loadComments(
                          selectedCardId,
                          commentsPage + 1,
                          commentsTab
                        );
                      }}
                    >
                      Próxima página
                    </button>
                  </div>
                </div>

                <div className="rounded-lg border border-[var(--border-color)] p-4">
                  <h3 className="font-semibold text-[var(--text-primary)] mb-3">
                    Histórico
                  </h3>
                  <div
                    className="space-y-2 max-h-72 overflow-auto"
                    onScroll={(event) => {
                      if (
                        !selectedCardId ||
                        !hasMoreHistory ||
                        loadingHistory
                      ) {
                        return;
                      }
                      const target = event.currentTarget;
                      if (
                        target.scrollTop + target.clientHeight >=
                        target.scrollHeight - 60
                      ) {
                        loadHistory(selectedCardId, historyPage + 1, true);
                      }
                    }}
                  >
                    {history.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg border border-[var(--border-color)] p-2"
                      >
                        <p className="text-sm text-[var(--text-primary)]">
                          {item.summary}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)] mt-1">
                          {item.actorName} •{" "}
                          {new Date(item.createdAt).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    ))}
                    {loadingHistory && (
                      <p className="text-xs text-[var(--text-secondary)] text-center">
                        Carregando...
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
