import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeft,
  Trash2,
  Calendar,
  Tag,
  FolderOpen,
  ChevronRight,
  Image as ImageIcon,
  CheckCircle,
  Plus,
  Search,
  Loader2,
  Upload,
  ChevronDown,
  Bot,
  AlertCircle,
  Sparkles,
  Wallet,
  GripVertical,
  Pencil,
} from "lucide-react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Button from "../../components/ui/Button";
import ConfirmModal from "../../components/ui/ConfirmModal";
import {
  laudosService,
  type ImagemLaudo,
  type AmbienteWebInfo,
} from "../../services/laudos";
import { ambientesService } from "../../services/ambientes";
import { queueService } from "../../services/queue";
import { useAuth } from "../../contexts/AuthContext";
import { UserRole } from "../../types/auth";
import { toast } from "sonner";

const MAX_FILE_SIZE_MB = 15;
const MAX_UPLOAD_ATTEMPTS = 2;
const CONCURRENT_UPLOADS = 3;
const BATCH_DELAY_MS = 200;
const MAX_AMBIENTE_NOME_LENGTH = 100;

type UploadPreviewStatus = "pending" | "uploading" | "done" | "error";

interface UploadPreviewItem {
  id: string;
  file: File;
  preview: string;
  status: UploadPreviewStatus;
  progress: number;
  s3Key?: string;
  errorMessage?: string;
}

const decodeMojibake = (value?: string | null) => {
  const original = value || "";
  if (!original) return "";
  if (!/[ÃÂâð�]/.test(original)) return original;
  try {
    return decodeURIComponent(escape(original));
  } catch {
    return original;
  }
};

const normalizeText = (value?: string | null) =>
  decodeMojibake(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const isTipoNaoIdentificado = (value?: string | null) => {
  const normalized = normalizeText(value);
  const compact = normalized.replace(/\s+/g, "");
  return !compact || compact === "naoidentificado";
};

const formatTipoLabel = (value?: string | null) =>
  isTipoNaoIdentificado(value)
    ? "Não identificado"
    : decodeMojibake(value) || "Não identificado";

const normalizeTipoValue = (value?: string | null) =>
  isTipoNaoIdentificado(value)
    ? "Não identificado"
    : decodeMojibake(value) || "";

interface SortableAmbienteCardProps {
  amb: AmbienteWebInfo;
  index: number;
  onSelect: (amb: AmbienteWebInfo) => void;
  onDelete: (amb: AmbienteWebInfo) => void;
  onRename: (amb: AmbienteWebInfo) => void;
  getAmbienteNome: (nomeAmbiente: string) => string;
}

function SortableAmbienteCard({
  amb,
  index,
  onSelect,
  onDelete,
  onRename,
  getAmbienteNome,
}: SortableAmbienteCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: amb.nomeAmbiente });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? "transform 180ms cubic-bezier(0.2, 0, 0, 1)",
    opacity: isDragging ? 0.45 : 1,
    zIndex: isDragging ? 30 : undefined,
    boxShadow: isDragging
      ? "0 18px 40px rgba(0, 0, 0, 0.35)"
      : "0 2px 8px rgba(0, 0, 0, 0.08)",
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group relative"
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelect(amb)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect(amb);
          }
        }}
        className="w-full p-6 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] hover:border-primary/50 hover:shadow-lg transition-all text-left"
      >
        <div className="flex items-start justify-between mb-4 gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              className="p-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-primary transition-colors cursor-grab active:cursor-grabbing"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="w-4 h-4" />
            </button>
            <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <FolderOpen className="w-6 h-6 text-primary" />
            </div>
          </div>
          <span className="text-xs text-[var(--text-secondary)] bg-[var(--bg-primary)] px-2 py-1 rounded-full">
            {amb.ordem + 1}
          </span>
        </div>
        <h3 className="font-semibold text-[var(--text-primary)] mb-1 truncate">
          {getAmbienteNome(amb.nomeAmbiente)}
        </h3>
        <div className="text-xs text-[var(--text-secondary)] mb-2 truncate opacity-70">
          {amb.tipoAmbiente}
        </div>
        <div className="flex items-center gap-1 text-sm text-[var(--text-secondary)]">
          <ImageIcon className="w-4 h-4" />
          <span>
            {amb.totalImagens} {amb.totalImagens === 1 ? "imagem" : "imagens"}
          </span>
        </div>
        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRename(amb);
          }}
          className="p-1.5 bg-primary/80 hover:bg-primary text-white rounded-lg transition-all"
          title="Renomear ambiente"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(amb);
          }}
          className="p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-lg transition-all"
          title="Remover ambiente"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

interface SortableImagemCardProps {
  img: ImagemLaudo;
  index: number;
  tipoAmbiente?: string;
  opcoesItens: string[];
  loadingItemChange: string | null;
  onUpdateItem: (imgId: string, novoItem: string) => void;
  onDelete: (imgId: string) => void;
  formatDate: (dateString: string) => string;
  isDropTarget: boolean;
}

function SortableImagemCard({
  img,
  index,
  tipoAmbiente,
  opcoesItens,
  loadingItemChange,
  onUpdateItem,
  onDelete,
  formatDate,
  isDropTarget,
}: SortableImagemCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: img.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? "transform 180ms cubic-bezier(0.2, 0, 0, 1)",
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className={`group relative aspect-square bg-gray-100 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all ${
        img.categoria === "AVARIA"
          ? "border-[3px] border-red-500"
          : "border border-[var(--border-color)]"
      } ${isDragging ? "ring-2 ring-primary/80" : ""} ${isDropTarget ? "ring-2 ring-cyan-400 scale-[1.02]" : ""}`}
    >
      <img
        src={img.url}
        alt={img.tipo || "Imagem do laudo"}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />

      {img.imagemJaFoiAnalisadaPelaIa === "sim" && (
        <div className="absolute top-10 right-2 bg-green-500 rounded-full p-1.5 shadow-lg z-20">
          <CheckCircle className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
      )}

      <div className="absolute top-0 left-0 right-0 bg-black/60 p-2 z-10 flex items-center justify-between pointer-events-auto shadow-sm">
        {loadingItemChange === img.id ? (
          <div className="flex items-center gap-2 text-white text-xs w-full justify-center">
            <div className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />{" "}
            Atualizando...
          </div>
        ) : (
          <div className="flex items-center gap-2 w-full">
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              className="p-1 rounded bg-white/10 hover:bg-white/20 border border-white/20 text-white cursor-grab active:cursor-grabbing flex-shrink-0"
              {...attributes}
              {...listeners}
              title="Arraste para reordenar"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </button>
            <div className="relative flex-1">
              <select
                className="w-full bg-transparent text-white text-xs font-semibold outline-none appearance-none cursor-pointer truncate pr-4 text-center"
                value={formatTipoLabel(img.tipo)}
                onChange={(e) => onUpdateItem(img.id, e.target.value)}
                onClick={(e) => e.stopPropagation()}
              >
                <option value="Não identificado" className="text-black">
                  Não identificado
                </option>
                {tipoAmbiente &&
                  opcoesItens.map((opt) => (
                    <option
                      key={opt}
                      value={normalizeTipoValue(opt)}
                      className="text-black"
                    >
                      {formatTipoLabel(opt)}
                    </option>
                  ))}
                {img.tipo &&
                  !isTipoNaoIdentificado(img.tipo) &&
                  !opcoesItens.includes(img.tipo) && (
                    <option value={img.tipo} className="text-black">
                      {formatTipoLabel(img.tipo)}
                    </option>
                  )}
              </select>
              <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-white/70 text-[10px]">
                ▼
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-4 pt-12 flex flex-col justify-center content-center gap-3 text-white text-xs">
        <div className="flex flex-col items-center gap-1 text-center w-full">
          <Calendar className="w-5 h-5 text-gray-300" />
          <span className="text-sm font-medium">
            {formatDate(img.dataCaptura)}
          </span>
        </div>

        <button
          onClick={() => onDelete(img.id)}
          className="w-full mt-2 py-2 bg-red-500/20 hover:bg-red-500/40 text-red-200 border border-red-500/50 rounded flex items-center justify-center gap-2 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span>Excluir</span>
        </button>
      </div>
      {isDropTarget && (
        <div className="pointer-events-none absolute inset-0 z-30 rounded-lg border-2 border-dashed border-cyan-300/90 bg-cyan-400/15 animate-pulse" />
      )}
    </motion.div>
  );
}

export default function GaleriaImagens() {
  const { id } = useParams<{ id: string }>();
  const { refreshUser, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Determina para onde voltar quando sai da galeria
  const backDestination =
    (location.state as any)?.from ||
    ([UserRole.ADMIN, UserRole.DEV].includes(user?.role as UserRole)
      ? "/admin/laudos"
      : "/dashboard/laudos");

  // === Estado para ambientes web ===
  const [ambientes, setAmbientes] = useState<AmbienteWebInfo[]>([]);
  const [ambienteSelecionado, setAmbienteSelecionado] =
    useState<AmbienteWebInfo | null>(null);
  const [loadingAmbientes, setLoadingAmbientes] = useState(true);
  const [laudoInfo, setLaudoInfo] = useState<{
    tipoUso?: string;
    tipoImovel?: string;
  }>({});

  // === Estado para criação de ambientes ===
  const [showSelector, setShowSelector] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [tiposDisponiveis, setTiposDisponiveis] = useState<{ nome: string }[]>(
    [],
  );
  const [loadingTipos, setLoadingTipos] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [totalTipos, setTotalTipos] = useState(0);
  const LIMIT = 20;
  const [selectedTipo, setSelectedTipo] = useState("");
  const [numeroAmbiente, setNumeroAmbiente] = useState("");
  const [estrategiaConflito, setEstrategiaConflito] = useState<
    "erro" | "deslocar"
  >("erro");
  const [showNomeInput, setShowNomeInput] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [creatingAmbiente, setCreatingAmbiente] = useState(false);
  const [reorderingAmbientes, setReorderingAmbientes] = useState(false);

  // === Estado para imagens (do ambiente selecionado) ===
  const [imagens, setImagens] = useState<ImagemLaudo[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [hasMoreImagens, setHasMoreImagens] = useState(false);
  const [loadingMaisImagens, setLoadingMaisImagens] = useState(false);
  const [reorderingImagens, setReorderingImagens] = useState(false);
  const [activeImagemId, setActiveImagemId] = useState<string | null>(null);
  const [overImagemId, setOverImagemId] = useState<string | null>(null);
  const imagensLoadMoreRef = useRef<HTMLDivElement | null>(null);
  const limit = 20;
  const [loadingImagens, setLoadingImagens] = useState(false);

  // === Estado para upload ===
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    current: 0,
    total: 0,
  });
  const [uploadPreviewItems, setUploadPreviewItems] = useState<
    UploadPreviewItem[]
  >([]);
  const uploadPreviewItemsRef = useRef<UploadPreviewItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // === Estado para delete ===
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    imagemId: string;
  }>({ isOpen: false, imagemId: "" });
  const [confirmDeleteAmbiente, setConfirmDeleteAmbiente] = useState<{
    isOpen: boolean;
    nomeAmbiente: string;
  }>({ isOpen: false, nomeAmbiente: "" });
  const [renameAmbienteModal, setRenameAmbienteModal] = useState<{
    isOpen: boolean;
    nomeAtual: string;
    novoNome: string;
  }>({ isOpen: false, nomeAtual: "", novoNome: "" });
  const [renamingAmbiente, setRenamingAmbiente] = useState(false);

  // === Estado para edição de item ===
  const [opcoesItensCache, setOpcoesItensCache] = useState<
    Record<string, string[]>
  >({});
  const [loadingItemChange, setLoadingItemChange] = useState<string | null>(
    null,
  );

  // === Estado para análise IA ===
  const [analisandoLaudo, setAnalisandoLaudo] = useState(false);

  // === Saldo de classificações ===
  const classificacoesRestantes = user?.quantidadeClassificacoesWeb ?? 0;
  const isAdminOrDev = [UserRole.ADMIN, UserRole.DEV].includes(
    user?.role as UserRole,
  );

  // === Contar imagens não identificadas ===
  const totalImagensSemItem = imagens.filter((img) =>
    isTipoNaoIdentificado(img.tipo),
  ).length;

  // ========== CARREGAR AMBIENTES ==========
  const fetchAmbientes = useCallback(async () => {
    if (!id) return;
    try {
      setLoadingAmbientes(true);
      const res = await laudosService.getAmbientesWeb(id);
      setAmbientes([...res.ambientes].sort((a, b) => a.ordem - b.ordem));
      setLaudoInfo({ tipoUso: res.tipoUso, tipoImovel: res.tipoImovel });
    } catch (err: any) {
      console.error(err);
      toast.error("Não foi possível carregar os ambientes.");
    } finally {
      setLoadingAmbientes(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAmbientes();
  }, [fetchAmbientes]);

  // ========== CARREGAR TIPOS DE AMBIENTE (para criar) ==========
  const loadTipos = useCallback(
    async (search: string, newOffset: number, append = false) => {
      try {
        setLoadingTipos(true);
        const result = await ambientesService.listarNomesPaginado(
          LIMIT,
          newOffset,
          search || undefined,
          laudoInfo.tipoUso || undefined,
          laudoInfo.tipoImovel || undefined,
        );
        if (append) {
          setTiposDisponiveis((prev) => [...prev, ...result.data]);
        } else {
          setTiposDisponiveis(result.data);
        }
        setHasMore(result.hasMore);
        setTotalTipos(result.total);
        setOffset(newOffset);
      } catch (err) {
        console.error("Erro ao carregar tipos:", err);
      } finally {
        setLoadingTipos(false);
      }
    },
    [laudoInfo.tipoUso, laudoInfo.tipoImovel],
  );

  // Pesquisa com debounce para tipos
  useEffect(() => {
    if (!showSelector) return;
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => loadTipos(searchTerm, 0), 500);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchTerm, showSelector, loadTipos]);

  const handleScroll = () => {
    if (!listRef.current || loadingTipos || !hasMore) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    if (scrollHeight - scrollTop - clientHeight < 100) {
      loadTipos(searchTerm, offset + LIMIT, true);
    }
  };

  const openSelector = () => {
    setShowSelector(true);
    setSearchTerm("");
    setOffset(0);
    setSelectedTipo("");
    setNumeroAmbiente("");
    setEstrategiaConflito("erro");
    setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  const numeroAmbienteSelecionado = Number(numeroAmbiente);
  const numeroAmbienteValido =
    Number.isInteger(numeroAmbienteSelecionado) &&
    numeroAmbienteSelecionado >= 1;
  const ambienteComMesmaPosicao = numeroAmbienteValido
    ? ambientes.find((a) => a.ordem + 1 === numeroAmbienteSelecionado)
    : null;
  const proximoNumeroDisponivel = ambientes.length + 1;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleSelectTipo = (tipo: string) => {
    setSelectedTipo(tipo);
    setShowSelector(false);
    setShowNomeInput(true);
    setNumeroAmbiente(String(ambientes.length + 1));
    setEstrategiaConflito("erro");
  };

  const handleConfirmAmbiente = async () => {
    if (!id) {
      toast.error("Laudo não encontrado");
      return;
    }

    if (!selectedTipo.trim()) {
      toast.error("Selecione um tipo de ambiente");
      return;
    }

    if (!numeroAmbienteValido) {
      toast.error("Informe um número de ambiente válido (mínimo 1)");
      return;
    }

    if (
      ambienteComMesmaPosicao &&
      estrategiaConflito !== "deslocar" &&
      numeroAmbienteSelecionado <= ambientes.length
    ) {
      toast.warning(
        `A posição ${numeroAmbienteSelecionado} já existe. Altere o número ou selecione deslocar posição.`,
      );
      return;
    }

    try {
      setCreatingAmbiente(true);
      const nomeAmbienteNovo = `${numeroAmbienteSelecionado} - ${selectedTipo.trim()}`;
      await laudosService.addAmbienteWeb(
        id,
        nomeAmbienteNovo,
        selectedTipo.trim(),
        numeroAmbienteSelecionado,
        estrategiaConflito,
      );
      toast.success(`Ambiente "${nomeAmbienteNovo}" criado!`);
      setShowNomeInput(false);
      setSelectedTipo("");
      setNumeroAmbiente("");
      setEstrategiaConflito("erro");
      fetchAmbientes();
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar ambiente");
    } finally {
      setCreatingAmbiente(false);
    }
  };

  const handleDragEndAmbientes = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!id || !over || active.id === over.id || reorderingAmbientes) {
      return;
    }

    const oldIndex = ambientes.findIndex((a) => a.nomeAmbiente === active.id);
    const newIndex = ambientes.findIndex((a) => a.nomeAmbiente === over.id);
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const ambientesAnteriores = ambientes;
    const reordenados = arrayMove(ambientes, oldIndex, newIndex).map(
      (amb, i) => ({
        ...amb,
        ordem: i,
      }),
    );

    setAmbientes(reordenados);
    setReorderingAmbientes(true);
    try {
      await laudosService.reordenarAmbientesWeb(
        id,
        reordenados.map((amb) => amb.nomeAmbiente),
      );
      if (
        ambienteSelecionado &&
        reordenados.some(
          (a) => a.nomeAmbiente === ambienteSelecionado.nomeAmbiente,
        )
      ) {
        const ambienteAtualizado = reordenados.find(
          (a) => a.nomeAmbiente === ambienteSelecionado.nomeAmbiente,
        );
        if (ambienteAtualizado) {
          setAmbienteSelecionado(ambienteAtualizado);
        }
      }
      toast.success("Ordem dos ambientes atualizada");
    } catch (err: any) {
      setAmbientes(ambientesAnteriores);
      toast.error(err.message || "Erro ao reordenar ambientes");
    } finally {
      setReorderingAmbientes(false);
    }
  };

  const handleDeleteAmbiente = async () => {
    if (!id || !confirmDeleteAmbiente.nomeAmbiente) return;
    try {
      await laudosService.removeAmbienteWeb(
        id,
        confirmDeleteAmbiente.nomeAmbiente,
      );
      toast.success("Ambiente removido!");
      setConfirmDeleteAmbiente({ isOpen: false, nomeAmbiente: "" });
      fetchAmbientes();
      if (
        ambienteSelecionado?.nomeAmbiente === confirmDeleteAmbiente.nomeAmbiente
      ) {
        setAmbienteSelecionado(null);
        setImagens([]);
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao remover ambiente");
    }
  };

  const handleOpenRenameAmbiente = (ambiente: AmbienteWebInfo) => {
    setRenameAmbienteModal({
      isOpen: true,
      nomeAtual: ambiente.nomeAmbiente,
      novoNome: getAmbienteNome(ambiente.nomeAmbiente),
    });
  };

  const handleCloseRenameAmbiente = () => {
    if (renamingAmbiente) return;
    setRenameAmbienteModal({ isOpen: false, nomeAtual: "", novoNome: "" });
  };

  const handleRenameAmbiente = async () => {
    if (!id || !renameAmbienteModal.nomeAtual) return;
    const novoNome = renameAmbienteModal.novoNome.trim();
    if (!novoNome) {
      toast.error("Informe o novo nome do ambiente.");
      return;
    }
    if (novoNome.length > MAX_AMBIENTE_NOME_LENGTH) {
      toast.error(
        `O nome do ambiente deve ter no máximo ${MAX_AMBIENTE_NOME_LENGTH} caracteres.`,
      );
      return;
    }
    if (novoNome === renameAmbienteModal.nomeAtual) {
      handleCloseRenameAmbiente();
      return;
    }

    try {
      setRenamingAmbiente(true);
      const ambientesAtualizados = await laudosService.renomearAmbienteWeb(
        id,
        renameAmbienteModal.nomeAtual,
        novoNome,
      );
      const ambientesOrdenados = [...ambientesAtualizados].sort(
        (a, b) => a.ordem - b.ordem,
      );
      setAmbientes(ambientesOrdenados);

      if (ambienteSelecionado?.nomeAmbiente === renameAmbienteModal.nomeAtual) {
        const ambienteRenomeado = ambientesOrdenados.find(
          (amb) => amb.nomeAmbiente === novoNome,
        );
        if (ambienteRenomeado) {
          setAmbienteSelecionado(ambienteRenomeado);
        }
      }

      toast.success("Nome do ambiente atualizado.");
      setRenameAmbienteModal({ isOpen: false, nomeAtual: "", novoNome: "" });
      fetchAmbientes();
    } catch (err: any) {
      toast.error(err.message || "Erro ao renomear ambiente");
    } finally {
      setRenamingAmbiente(false);
    }
  };

  // ========== CARREGAR IMAGENS DO AMBIENTE ==========
  const fetchImagensByAmbiente = async (page: number, append = false) => {
    if (!id || !ambienteSelecionado) return;
    try {
      if (append) {
        setLoadingMaisImagens(true);
      } else {
        setLoadingImagens(true);
      }
      const res = await laudosService.getImagensByAmbiente(
        id,
        ambienteSelecionado.nomeAmbiente,
        page,
        limit,
      );
      const imagensNormalizadas = res.data.map((img) => ({
        ...img,
        tipo: normalizeTipoValue(img.tipo),
      }));
      setImagens((prev) => {
        if (!append) {
          return imagensNormalizadas;
        }
        const imagensMap = new Map(prev.map((img) => [img.id, img]));
        imagensNormalizadas.forEach((img) => imagensMap.set(img.id, img));
        return Array.from(imagensMap.values()).sort(
          (a, b) => a.ordem - b.ordem,
        );
      });
      setHasMoreImagens(res.page < res.lastPage);
      setPaginaAtual(res.page);
    } catch (err: any) {
      console.error(err);
      toast.error("Não foi possível carregar as imagens.");
    } finally {
      if (append) {
        setLoadingMaisImagens(false);
      } else {
        setLoadingImagens(false);
      }
    }
  };

  useEffect(() => {
    if (id && ambienteSelecionado) {
      setHasMoreImagens(false);
      fetchImagensByAmbiente(1, false);
    }
  }, [id, ambienteSelecionado]);

  const handleLoadMoreImagens = useCallback(() => {
    if (
      !ambienteSelecionado ||
      loadingImagens ||
      loadingMaisImagens ||
      !hasMoreImagens
    ) {
      return;
    }
    fetchImagensByAmbiente(paginaAtual + 1, true);
  }, [
    ambienteSelecionado,
    loadingImagens,
    loadingMaisImagens,
    hasMoreImagens,
    paginaAtual,
  ]);

  useEffect(() => {
    const target = imagensLoadMoreRef.current;
    if (!target || !ambienteSelecionado) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          handleLoadMoreImagens();
        }
      },
      { rootMargin: "220px 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [ambienteSelecionado, handleLoadMoreImagens]);

  // Carregar opções do select para edição rápida
  useEffect(() => {
    const fetchOpcoes = async () => {
      const tipo = ambienteSelecionado?.tipoAmbiente;
      if (tipo && !opcoesItensCache[tipo]) {
        try {
          const itensParentes = await ambientesService.getItensPorNomeEnv(tipo);
          if (itensParentes && Array.isArray(itensParentes)) {
            setOpcoesItensCache((prev) => ({
              ...prev,
              [tipo]: itensParentes.map((i: any) => i.nome),
            }));
          }
        } catch (err) {
          console.error("Erro ao puxar opções de itens", err);
        }
      }
    };
    if (ambienteSelecionado) fetchOpcoes();
  }, [ambienteSelecionado]);

  const handleUpdateItem = async (imgId: string, novoItem: string) => {
    if (!novoItem) return;
    const tipoNormalizado = normalizeTipoValue(novoItem);
    try {
      setLoadingItemChange(imgId);
      await laudosService.updateImagemMetadata(imgId, {
        tipo: tipoNormalizado,
      });
      setImagens((prev) =>
        prev.map((img) =>
          img.id === imgId ? { ...img, tipo: tipoNormalizado } : img,
        ),
      );
      toast.success("Item classificado com sucesso!");
    } catch (err) {
      toast.error("Erro ao atualizar o item da imagem.");
    } finally {
      setLoadingItemChange(null);
    }
  };

  // ========== UPLOAD DE IMAGENS ==========
  useEffect(() => {
    uploadPreviewItemsRef.current = uploadPreviewItems;
  }, [uploadPreviewItems]);

  useEffect(() => {
    return () => {
      uploadPreviewItemsRef.current.forEach((item) =>
        URL.revokeObjectURL(item.preview),
      );
    };
  }, []);

  const updateUploadPreviewItem = useCallback(
    (itemId: string, patch: Partial<UploadPreviewItem>) => {
      setUploadPreviewItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
      );
    },
    [],
  );

  const uploadFileWithProgress = useCallback(
    (uploadUrl: string, file: File, onProgress: (progress: number) => void) =>
      new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader(
          "Content-Type",
          file.type || "application/octet-stream",
        );

        xhr.upload.onprogress = (event) => {
          if (!event.lengthComputable) return;
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            onProgress(100);
            resolve();
            return;
          }
          reject(new Error(`Falha no upload para S3 (${xhr.status})`));
        };

        xhr.onerror = () => reject(new Error("Falha de rede durante upload"));
        xhr.onabort = () => reject(new Error("Upload cancelado"));
        xhr.send(file);
      }),
    [],
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !id || !ambienteSelecionado) return;

    const validFiles: File[] = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast.warning(
          `"${file.name}" excede ${MAX_FILE_SIZE_MB}MB e foi ignorado`,
        );
        continue;
      }
      if (!file.type.startsWith("image/")) {
        toast.warning(`"${file.name}" não é uma imagem válida`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    try {
      const limitCheck = await laudosService.checkUploadLimit(
        validFiles.length,
      );
      if (!limitCheck.canUpload) {
        toast.error(limitCheck.message || "Limite de imagens esgotado");
        return;
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao verificar créditos");
      return;
    }

    const queuedItems: UploadPreviewItem[] = validFiles.map((file, index) => ({
      id: `${Date.now()}-${index}-${file.name}`,
      file,
      preview: URL.createObjectURL(file),
      status: "pending",
      progress: 0,
    }));

    setUploadPreviewItems((prev) => {
      prev.forEach((item) => URL.revokeObjectURL(item.preview));
      return queuedItems;
    });

    setUploading(true);
    setUploadProgress({ current: 0, total: validFiles.length });
    let uploadedCount = 0;
    const confirmedUploads: ImagemLaudo[] = [];
    const ordemUploadBase = Math.floor(Date.now() / 1000);
    const selectedAmbiente = ambienteSelecionado;
    const uploadSessionId = `web-upload-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const failedUploads: Array<{
      index: number;
      fileName: string;
      error: string;
    }> = [];
    const sleep = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));
    console.group(`[UPLOAD][START][${uploadSessionId}]`);
    console.log("contexto", {
      laudoId: id,
      ambiente: selectedAmbiente.nomeAmbiente,
      tipoAmbiente: selectedAmbiente.tipoAmbiente,
      totalArquivosSelecionados: validFiles.length,
      nomesArquivos: validFiles.map((f) => f.name),
      tamanhoArquivos: validFiles.map((f) => ({ nome: f.name, bytes: f.size })),
    });
    console.groupEnd();

    const uploadSingleFile = async (file: File, index: number) => {
      const itemId = queuedItems[index]?.id;
      if (!itemId) {
        throw new Error("Item de upload inválido");
      }

      updateUploadPreviewItem(itemId, {
        status: "uploading",
        progress: 0,
        errorMessage: undefined,
      });

      let attempt = 0;
      let uploadedSuccessfully = false;
      let lastError: string | null = null;

      while (attempt < MAX_UPLOAD_ATTEMPTS && !uploadedSuccessfully) {
        attempt += 1;

        try {
          const uniqueFilename = `${Date.now()}-${index}-${attempt}-${file.name}`;
          console.log(`[UPLOAD][PRESIGNED][${uploadSessionId}]`, {
            fileIndex: index,
            fileName: file.name,
            attempt,
            uniqueFilename,
          });
          const { uploadUrl, s3Key } = await laudosService.getPresignedUrl(
            id,
            uniqueFilename,
          );
          console.log(`[UPLOAD][S3_PUT_START][${uploadSessionId}]`, {
            fileIndex: index,
            fileName: file.name,
            attempt,
            s3Key,
          });

          await uploadFileWithProgress(uploadUrl, file, (progress) => {
            updateUploadPreviewItem(itemId, { status: "uploading", progress });
          });
          console.log(`[UPLOAD][S3_PUT_DONE][${uploadSessionId}]`, {
            fileIndex: index,
            fileName: file.name,
            attempt,
            s3Key,
          });

          let confirmado = false;
          let confirmAttempt = 0;
          let ultimoErroConfirmacao: any = null;

          while (!confirmado && confirmAttempt < MAX_UPLOAD_ATTEMPTS) {
            confirmAttempt += 1;
            try {
              console.log(`[UPLOAD][CONFIRM_START][${uploadSessionId}]`, {
                fileIndex: index,
                fileName: file.name,
                attempt,
                confirmAttempt,
                s3Key,
              });
              const response = await laudosService.confirmWebUpload({
                laudoId: id,
                s3Key,
                ambiente: selectedAmbiente.nomeAmbiente,
                tipoAmbiente: selectedAmbiente.tipoAmbiente,
                tipo: "Não identificado",
                categoria: "VISTORIA",
                ordem: ordemUploadBase + index,
                uploadSessionId,
                clientFileId: itemId,
              });
              if (!response?.imagem?.id || !response.imagem.url) {
                throw new Error("Upload confirmado sem imagem retornada");
              }
              confirmedUploads.push({
                ...response.imagem,
                tipo: normalizeTipoValue(response.imagem.tipo),
              });
              console.log(`[UPLOAD][CONFIRM_DONE][${uploadSessionId}]`, {
                fileIndex: index,
                fileName: file.name,
                attempt,
                confirmAttempt,
                s3Key,
                imagemId: response.imagem.id,
              });
              confirmado = true;
            } catch (confirmErr: any) {
              ultimoErroConfirmacao = confirmErr;
              lastError = confirmErr?.message || "Falha ao confirmar upload";
              console.error(`[UPLOAD][CONFIRM_ERROR][${uploadSessionId}]`, {
                fileIndex: index,
                fileName: file.name,
                attempt,
                confirmAttempt,
                s3Key,
                erro: confirmErr,
              });
              if (confirmAttempt < MAX_UPLOAD_ATTEMPTS) {
                await sleep(300);
              }
            }
          }

          if (!confirmado) {
            throw (
              ultimoErroConfirmacao || new Error("Falha ao confirmar upload")
            );
          }

          uploadedSuccessfully = true;
          updateUploadPreviewItem(itemId, {
            status: "done",
            progress: 100,
            s3Key,
            errorMessage: undefined,
          });
        } catch (err: any) {
          lastError = err?.message || "Falha no upload";
          console.error(`[UPLOAD][FILE_ERROR][${uploadSessionId}]`, {
            fileIndex: index,
            fileName: file.name,
            attempt,
            erro: err,
          });
          if (attempt >= MAX_UPLOAD_ATTEMPTS) {
            updateUploadPreviewItem(itemId, {
              status: "error",
              progress: 0,
              errorMessage: err?.message || "Falha no upload",
            });
            toast.error(`Erro ao enviar "${file.name}"`);
            console.error(`Erro ao upload imagem ${index}:`, err);
          }
        }
      }
      setUploadProgress((prev) => ({ ...prev, current: prev.current + 1 }));
      if (!uploadedSuccessfully) {
        failedUploads.push({
          index,
          fileName: file.name,
          error: lastError || `Falha definitiva no upload de "${file.name}"`,
        });
        throw new Error(`Falha definitiva no upload de "${file.name}"`);
      }
    };

    for (
      let batchStart = 0;
      batchStart < validFiles.length;
      batchStart += CONCURRENT_UPLOADS
    ) {
      const batchFiles = validFiles.slice(
        batchStart,
        batchStart + CONCURRENT_UPLOADS,
      );
      const results = await Promise.allSettled(
        batchFiles.map((file, batchIndex) =>
          uploadSingleFile(file, batchStart + batchIndex),
        ),
      );

      results.forEach((result) => {
        if (result.status === "fulfilled") {
          uploadedCount += 1;
        } else {
          console.error(`[UPLOAD][BATCH_REJECTED][${uploadSessionId}]`, {
            batchStart,
            erro: result.reason,
          });
        }
      });
      console.log(`[UPLOAD][BATCH_SUMMARY][${uploadSessionId}]`, {
        batchStart,
        batchSize: batchFiles.length,
        fulfilled: results.filter((r) => r.status === "fulfilled").length,
        rejected: results.filter((r) => r.status === "rejected").length,
      });

      if (batchStart + CONCURRENT_UPLOADS < validFiles.length) {
        await sleep(BATCH_DELAY_MS);
      }
    }

    setUploading(false);

    if (fileInputRef.current) fileInputRef.current.value = "";

    setUploadPreviewItems((prev) => {
      prev.forEach((item) => URL.revokeObjectURL(item.preview));
      return [];
    });

    if (uploadedCount > 0) {
      const totalImagensEsperado =
        (selectedAmbiente.totalImagens || 0) + uploadedCount;
      let totalImagensAmbienteAtual = totalImagensEsperado;

      try {
        const sincronizarAmbienteCompleto = async () => {
          let requestedLimit = Math.max(totalImagensEsperado, limit, 50);
          let res = await laudosService.getImagensByAmbiente(
            id,
            selectedAmbiente.nomeAmbiente,
            1,
            requestedLimit,
          );
          if (res.total > requestedLimit) {
            requestedLimit = res.total;
            res = await laudosService.getImagensByAmbiente(
              id,
              selectedAmbiente.nomeAmbiente,
              1,
              requestedLimit,
            );
          }
          return res;
        };

        const syncRes = await sincronizarAmbienteCompleto();
        const idsRetornados = new Set(syncRes.data.map((img) => img.id));
        const imagensFaltantes = confirmedUploads.filter(
          (img) => !idsRetornados.has(img.id),
        );

        if (imagensFaltantes.length > 0) {
          console.warn(`[UPLOAD][REPAIR_START][${uploadSessionId}]`, {
            faltantes: imagensFaltantes.map((img) => ({
              id: img.id,
              s3Key: img.s3Key,
              ordem: img.ordem,
            })),
          });

          const repairResults = await Promise.allSettled(
            imagensFaltantes.map((img) =>
              laudosService.updateImagemMetadata(img.id, {
                ambiente: selectedAmbiente.nomeAmbiente,
                tipoAmbiente: selectedAmbiente.tipoAmbiente,
                tipo: "Não identificado",
                categoria: "VISTORIA",
                ordem: img.ordem,
              }),
            ),
          );

          console.log(`[UPLOAD][REPAIR_RESULT][${uploadSessionId}]`, {
            total: repairResults.length,
            fulfilled: repairResults.filter((r) => r.status === "fulfilled")
              .length,
            rejected: repairResults
              .filter((r) => r.status === "rejected")
              .map((r) =>
                r.status === "rejected" ? String(r.reason) : undefined,
              ),
          });
        }

        const syncResFinal = imagensFaltantes.length
          ? await sincronizarAmbienteCompleto()
          : syncRes;
        const idsFinais = new Set(syncResFinal.data.map((img) => img.id));
        const faltantesAposRepair = confirmedUploads.filter(
          (img) => !idsFinais.has(img.id),
        );
        setImagens(
          syncResFinal.data.map((img) => ({
            ...img,
            tipo: normalizeTipoValue(img.tipo),
          })),
        );
        setPaginaAtual(syncResFinal.page);
        setHasMoreImagens(syncResFinal.page < syncResFinal.lastPage);
        totalImagensAmbienteAtual = syncResFinal.total;
        console.log(`[UPLOAD][SYNC_RESULT][${uploadSessionId}]`, {
          totalEsperado: totalImagensEsperado,
          totalRetornado: syncResFinal.total,
          page: syncResFinal.page,
          lastPage: syncResFinal.lastPage,
          quantidadeNoPayloadAtual: syncResFinal.data.length,
          imagensRetornadas: syncResFinal.data.map((img) => ({
            id: img.id,
            s3Key: img.s3Key,
            ordem: img.ordem,
            ambiente: img.ambiente,
          })),
          imagensConfirmadas: confirmedUploads.map((img) => ({
            id: img.id,
            s3Key: img.s3Key,
            ordem: img.ordem,
            ambiente: img.ambiente,
          })),
          faltantesAposRepair: faltantesAposRepair.map((img) => ({
            id: img.id,
            s3Key: img.s3Key,
            ordem: img.ordem,
          })),
        });

        if (faltantesAposRepair.length > 0) {
          console.error(`[UPLOAD][INCONSISTENCIA][${uploadSessionId}]`, {
            totalAntes: selectedAmbiente.totalImagens || 0,
            uploadedCount,
            totalEsperado: totalImagensEsperado,
            totalAtual: totalImagensAmbienteAtual,
            failedUploads,
            confirmedUploads: confirmedUploads.map((img) => ({
              id: img.id,
              s3Key: img.s3Key,
              ordem: img.ordem,
              ambiente: img.ambiente,
            })),
            faltantesAposRepair: faltantesAposRepair.map((img) => ({
              id: img.id,
              s3Key: img.s3Key,
              ordem: img.ordem,
              ambiente: img.ambiente,
            })),
          });
          toast.error(
            `Inconsistência detectada: ${faltantesAposRepair.length} imagem(ns) confirmada(s) não apareceram no ambiente após reparo.`,
          );
        }
      } catch (syncErr) {
        console.error(`[UPLOAD][SYNC_ERROR][${uploadSessionId}]`, syncErr);
        setImagens((prev) => {
          const imagensMap = new Map(prev.map((img) => [img.id, img]));
          confirmedUploads.forEach((img) => {
            imagensMap.set(img.id, img);
          });
          return Array.from(imagensMap.values()).sort(
            (a, b) => a.ordem - b.ordem,
          );
        });
        setHasMoreImagens(imagens.length < totalImagensEsperado);
      }

      setAmbientes((prev) =>
        prev.map((amb) =>
          amb.nomeAmbiente === selectedAmbiente.nomeAmbiente
            ? {
                ...amb,
                totalImagens: totalImagensAmbienteAtual,
              }
            : amb,
        ),
      );
      setAmbienteSelecionado((prev) =>
        prev && prev.nomeAmbiente === selectedAmbiente.nomeAmbiente
          ? {
              ...prev,
              totalImagens: totalImagensAmbienteAtual,
            }
          : prev,
      );
      toast.success(
        `${uploadedCount} ${uploadedCount === 1 ? "imagem enviada" : "imagens enviadas"} com sucesso!`,
      );
      if (refreshUser) await refreshUser();
    }

    const failedCount = validFiles.length - uploadedCount;
    console.log(`[UPLOAD][END][${uploadSessionId}]`, {
      totalSelecionado: validFiles.length,
      uploadedCount,
      failedCount,
      failedUploads,
      confirmedUploadsCount: confirmedUploads.length,
      confirmedUploads: confirmedUploads.map((img) => ({
        id: img.id,
        s3Key: img.s3Key,
        ordem: img.ordem,
        ambiente: img.ambiente,
      })),
    });
    if (failedCount > 0) {
      toast.warning(
        `${failedCount} ${failedCount === 1 ? "imagem falhou" : "imagens falharam"} no envio.`,
      );
    }
  };

  // ========== DELETE IMAGEM ==========
  const handleDeleteImagem = async () => {
    const imagemId = confirmDelete.imagemId;
    const imagemDeletada = imagens.find((img) => img.id === imagemId);
    const indexOriginal = imagens.findIndex((img) => img.id === imagemId);

    setImagens((prev) => prev.filter((img) => img.id !== imagemId));
    setConfirmDelete({ isOpen: false, imagemId: "" });

    try {
      await laudosService.deleteImagem(imagemId);
      if (refreshUser) await refreshUser();
      toast.success("Imagem deletada com sucesso!");

      if (imagens.length === 1) {
        fetchAmbientes();
      }
    } catch (err: any) {
      if (imagemDeletada) {
        setImagens((prev) => {
          const novaLista = [...prev];
          novaLista.splice(indexOriginal, 0, imagemDeletada);
          return novaLista;
        });
      }
      toast.error("Erro ao deletar imagem.");
    }
  };

  // ========== INICIAR ANÁLISE IA ==========
  const handleIniciarAnalise = async () => {
    if (!id) return;

    // Verificar se há imagens sem item
    // Precisamos checar TODAS as imagens do laudo, não só da página atual
    try {
      setAnalisandoLaudo(true);
      await queueService.addToQueue(id);
      toast.success("Laudo adicionado à fila de análise! 🎉");
      if (refreshUser) await refreshUser();
    } catch (err: any) {
      if (err.message?.includes("já possui todas as imagens analisadas")) {
        toast.success("Este laudo já foi totalmente analisado!");
      } else {
        toast.error(err.message || "Erro ao iniciar análise");
      }
    } finally {
      setAnalisandoLaudo(false);
    }
  };

  // ========== HELPERS ==========
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getAmbienteNome = (nomeAmbiente: string) => {
    const match = nomeAmbiente.match(/^\d+\s*-\s*(.+)$/);
    return match ? match[1] : nomeAmbiente;
  };

  const handleSelectAmbiente = (amb: AmbienteWebInfo) => {
    setAmbienteSelecionado(amb);
    setPaginaAtual(1);
    setHasMoreImagens(false);
  };

  const handleVoltarParaAmbientes = () => {
    setAmbienteSelecionado(null);
    setImagens([]);
    setPaginaAtual(1);
    setHasMoreImagens(false);
    fetchAmbientes();
  };

  const handleDragEndImagens = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveImagemId(null);
    setOverImagemId(null);
    if (
      !over ||
      active.id === over.id ||
      reorderingImagens ||
      !ambienteSelecionado
    ) {
      return;
    }

    const oldIndex = imagens.findIndex((img) => img.id === active.id);
    const newIndex = imagens.findIndex((img) => img.id === over.id);
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const imagensAnteriores = imagens;
    const reordenadas = arrayMove(imagens, oldIndex, newIndex);
    const ordensAtuais = imagens
      .map((img) => img.ordem)
      .filter((ordem) => Number.isFinite(ordem))
      .sort((a, b) => a - b);
    const ordensDestino =
      ordensAtuais.length === reordenadas.length
        ? ordensAtuais
        : reordenadas.map((_, index) => index + 1);
    const reordenadasComOrdem = reordenadas.map((img, index) => ({
      ...img,
      ordem: ordensDestino[index],
    }));

    setImagens(reordenadasComOrdem);
    setReorderingImagens(true);

    try {
      const ordemOriginalPorId = new Map(
        imagensAnteriores.map((img) => [img.id, img.ordem]),
      );
      const imagensAlteradas = reordenadasComOrdem.filter(
        (img) => ordemOriginalPorId.get(img.id) !== img.ordem,
      );
      await Promise.all(
        imagensAlteradas.map((img) =>
          laudosService.updateImagemMetadata(img.id, { ordem: img.ordem }),
        ),
      );
      toast.success("Ordem das imagens atualizada");
    } catch (err: any) {
      setImagens(imagensAnteriores);
      toast.error(err.message || "Erro ao reordenar imagens");
    } finally {
      setReorderingImagens(false);
    }
  };

  const handleDragStartImagens = (event: DragStartEvent) => {
    setActiveImagemId(String(event.active.id));
    setOverImagemId(String(event.active.id));
  };

  const handleDragOverImagens = (event: DragOverEvent) => {
    if (!event.over) return;
    setOverImagemId(String(event.over.id));
  };

  const imagemSendoArrastada = activeImagemId
    ? imagens.find((img) => img.id === activeImagemId) || null
    : null;

  // Total de imagens do laudo
  const totalImagensLaudo = ambientes.reduce(
    (sum, a) => sum + a.totalImagens,
    0,
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            {ambienteSelecionado ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleVoltarParaAmbientes}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(backDestination)}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                Galeria de Imagens
              </h2>
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <button
                  onClick={handleVoltarParaAmbientes}
                  className={`hover:text-primary transition-colors ${!ambienteSelecionado ? "font-medium text-[var(--text-primary)]" : ""}`}
                  disabled={!ambienteSelecionado}
                >
                  Ambientes
                </button>
                {ambienteSelecionado && (
                  <>
                    <ChevronRight className="w-4 h-4" />
                    <span className="font-medium text-[var(--text-primary)]">
                      {getAmbienteNome(ambienteSelecionado.nomeAmbiente)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Info cards no header */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Saldo de classificações IA */}
            <div className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 border border-purple-500/20 rounded-lg text-sm">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-[var(--text-secondary)]">
                Classificações IA:
              </span>
              <span className="font-bold text-purple-400">
                {isAdminOrDev ? "∞" : classificacoesRestantes}
              </span>
            </div>

            {/* Total de imagens */}
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm">
              <ImageIcon className="w-4 h-4 text-blue-400" />
              <span className="text-[var(--text-secondary)]">Fotos:</span>
              <span className="font-bold text-blue-400">
                {totalImagensLaudo}
              </span>
            </div>

            {/* Botão iniciar análise */}
            {!ambienteSelecionado && totalImagensLaudo > 0 && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleIniciarAnalise}
                disabled={analisandoLaudo}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/30 border-0 transition-all duration-300 group"
              >
                {analisandoLaudo ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Iniciando...
                  </>
                ) : (
                  <>
                    <Bot className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                    Iniciar Análise IA
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {loadingAmbientes ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : !ambienteSelecionado ? (
          // === MODO AMBIENTES ===
          <>
            {/* Botão Adicionar Ambiente */}
            {!showSelector && !showNomeInput && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={openSelector}
                className="w-full py-4 border-2 border-dashed border-primary/30 rounded-xl text-primary font-medium hover:bg-primary/5 hover:border-primary/50 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Adicionar Ambiente
              </motion.button>
            )}

            {/* Seletor de Tipo de Ambiente */}
            {showSelector && (
              <div className="border-2 border-primary/30 rounded-xl overflow-hidden bg-[var(--bg-primary)] animate-in fade-in">
                <div className="p-3 border-b border-[var(--border-color)]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg focus:border-primary outline-none transition-all"
                      placeholder="Pesquisar tipo de ambiente..."
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-[var(--text-secondary)]">
                    <span>{totalTipos} tipos encontrados</span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSelector(false);
                        setSearchTerm("");
                      }}
                      className="text-red-500 hover:text-red-400 font-medium"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
                <div
                  ref={listRef}
                  onScroll={handleScroll}
                  className="max-h-72 overflow-y-auto"
                >
                  {tiposDisponiveis.map((tipo) => (
                    <button
                      key={tipo.nome}
                      type="button"
                      onClick={() => handleSelectTipo(tipo.nome)}
                      className="w-full text-left px-4 py-3 hover:bg-primary/10 border-b border-[var(--border-color)] last:border-b-0 transition-colors group"
                    >
                      <span className="font-medium text-[var(--text-primary)] group-hover:text-primary">
                        🚪 {tipo.nome}
                      </span>
                    </button>
                  ))}
                  {loadingTipos && (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      <span className="ml-2 text-sm text-[var(--text-secondary)]">
                        Carregando...
                      </span>
                    </div>
                  )}
                  {!loadingTipos && tiposDisponiveis.length === 0 && (
                    <div className="text-center py-8 text-[var(--text-secondary)]">
                      <p>Nenhum tipo de ambiente encontrado</p>
                    </div>
                  )}
                  {hasMore && !loadingTipos && (
                    <button
                      type="button"
                      onClick={() =>
                        loadTipos(searchTerm, offset + LIMIT, true)
                      }
                      className="w-full py-3 text-sm text-primary hover:bg-primary/5 flex items-center justify-center gap-1"
                    >
                      <ChevronDown className="w-4 h-4" /> Carregar mais
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Configuração obrigatória de posição do ambiente */}
            {showNomeInput && (
              <div className="border-2 border-primary/30 rounded-xl p-4 bg-[var(--bg-primary)] animate-in fade-in">
                <h4 className="text-sm font-bold text-[var(--text-secondary)] mb-1">
                  Tipo selecionado:{" "}
                  <span className="text-primary">{selectedTipo}</span>
                </h4>
                <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2 mt-3">
                  Número do Ambiente
                </label>
                <div className="flex gap-2 items-start">
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={numeroAmbiente}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (!value) {
                        setNumeroAmbiente("");
                        return;
                      }
                      const parsed = Number(value);
                      if (Number.isInteger(parsed) && parsed >= 1) {
                        setNumeroAmbiente(String(parsed));
                      }
                    }}
                    className="flex-1 px-4 py-3 bg-[var(--bg-secondary)] border-2 border-[var(--border-color)] text-[var(--text-primary)] rounded-lg focus:border-primary outline-none transition-all"
                    placeholder={`Ex: ${proximoNumeroDisponivel}`}
                    autoFocus
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      (e.preventDefault(), handleConfirmAmbiente())
                    }
                  />
                  <Button
                    variant="primary"
                    onClick={handleConfirmAmbiente}
                    disabled={creatingAmbiente}
                  >
                    {creatingAmbiente ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Confirmar"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowNomeInput(false);
                      setSelectedTipo("");
                      setNumeroAmbiente("");
                      setEstrategiaConflito("erro");
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
                <div className="mt-3 text-sm text-[var(--text-secondary)]">
                  Nome final:{" "}
                  <span className="text-[var(--text-primary)] font-semibold">
                    {numeroAmbienteValido
                      ? `${numeroAmbienteSelecionado} - ${selectedTipo}`
                      : `... - ${selectedTipo}`}
                  </span>
                </div>
                {ambienteComMesmaPosicao && (
                  <div className="mt-3 p-3 rounded-lg border border-amber-500/40 bg-amber-500/10">
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      A posição {numeroAmbienteSelecionado} já está ocupada por{" "}
                      <strong>
                        {getAmbienteNome(ambienteComMesmaPosicao.nomeAmbiente)}
                      </strong>
                      .
                    </p>
                    <div className="mt-2 flex gap-2 flex-wrap">
                      <Button
                        variant={
                          estrategiaConflito === "deslocar"
                            ? "primary"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => setEstrategiaConflito("deslocar")}
                      >
                        Inserir aqui e deslocar os próximos
                      </Button>
                      <Button
                        variant={
                          estrategiaConflito === "erro" ? "primary" : "outline"
                        }
                        size="sm"
                        onClick={() => {
                          setEstrategiaConflito("erro");
                          setNumeroAmbiente(String(proximoNumeroDisponivel));
                        }}
                      >
                        Usar próxima posição ({proximoNumeroDisponivel})
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Grid de ambientes */}
            {ambientes.length === 0 && !showSelector && !showNomeInput ? (
              <div className="text-center py-20 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)]">
                <FolderOpen className="w-16 h-16 mx-auto mb-4 text-[var(--text-secondary)] opacity-50" />
                <p className="text-[var(--text-secondary)] text-lg font-medium mb-2">
                  Nenhum ambiente criado ainda
                </p>
                <p className="text-[var(--text-secondary)] text-sm opacity-70">
                  Clique em "Adicionar Ambiente" para começar a organizar as
                  fotos da vistoria.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-[var(--text-secondary)]">
                  Arraste o ícone para reordenar os ambientes.
                </p>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEndAmbientes}
                >
                  <SortableContext
                    items={ambientes.map((amb) => amb.nomeAmbiente)}
                    strategy={rectSortingStrategy}
                  >
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {ambientes.map((amb, index) => (
                        <SortableAmbienteCard
                          key={amb.nomeAmbiente}
                          amb={amb}
                          index={index}
                          onSelect={handleSelectAmbiente}
                          onRename={handleOpenRenameAmbiente}
                          onDelete={(ambiente) =>
                            setConfirmDeleteAmbiente({
                              isOpen: true,
                              nomeAmbiente: ambiente.nomeAmbiente,
                            })
                          }
                          getAmbienteNome={getAmbienteNome}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
                {reorderingAmbientes && (
                  <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando nova ordem...
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          // === MODO IMAGENS (ambiente selecionado) ===
          <>
            {/* Upload Area */}
            <div
              className="border-2 border-dashed border-[var(--border-color)] bg-[var(--bg-primary)] rounded-xl p-6 text-center hover:border-primary transition-colors cursor-pointer group"
              onClick={() => !uploading && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
              <Upload className="w-10 h-10 mx-auto mb-2 text-[var(--text-secondary)] group-hover:text-primary group-hover:scale-110 transition-all" />
              <p className="font-medium text-[var(--text-primary)]">
                Clique para selecionar imagens
              </p>
              <p className="text-sm text-[var(--text-secondary)]">
                Ambiente:{" "}
                <strong className="text-primary">
                  {ambienteSelecionado.nomeAmbiente}
                </strong>
              </p>
            </div>

            {/* Progress bar de upload */}
            {uploading && (
              <div className="p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]">
                <div className="flex justify-between text-sm mb-2 text-[var(--text-secondary)]">
                  <span>Enviando imagens...</span>
                  <span>
                    {uploadProgress.current}/{uploadProgress.total}
                  </span>
                </div>
                <div className="h-2.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
                    style={{
                      width: `${uploadProgress.total > 0 ? (uploadProgress.current / uploadProgress.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {uploadPreviewItems.length > 0 && (
              <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-3">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    Preview do envio ({uploadPreviewItems.length})
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                  {uploadPreviewItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="relative rounded-lg overflow-hidden border border-[var(--border-color)] bg-[var(--bg-primary)]"
                    >
                      <img
                        src={item.preview}
                        alt={item.file.name}
                        className="w-full h-24 object-cover"
                      />
                      <div className="p-2">
                        <p className="text-[10px] text-[var(--text-secondary)] truncate">
                          {index + 1}. {item.file.name}
                        </p>
                        <div className="mt-2 h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              item.status === "error"
                                ? "bg-red-500"
                                : item.status === "done"
                                  ? "bg-green-500"
                                  : "bg-gradient-to-r from-blue-500 to-purple-600"
                            }`}
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                        <div className="mt-1 text-[10px] text-[var(--text-secondary)] flex justify-between">
                          <span>
                            {item.status === "uploading"
                              ? "Enviando"
                              : item.status === "done"
                                ? "Concluído"
                                : item.status === "error"
                                  ? "Falhou"
                                  : "Aguardando"}
                          </span>
                          <span>{item.progress}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {loadingImagens ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : imagens.length === 0 ? (
              <div className="text-center py-16 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)]">
                <ImageIcon className="w-16 h-16 mx-auto mb-4 text-[var(--text-secondary)] opacity-50" />
                <p className="text-[var(--text-secondary)] text-lg font-medium">
                  Nenhuma imagem neste ambiente
                </p>
                <p className="text-sm text-[var(--text-secondary)] opacity-70 mt-1">
                  Clique na área acima para adicionar fotos
                </p>
              </div>
            ) : (
              <>
                {/* Aviso de imagens sem item */}
                {totalImagensSemItem > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-sm text-yellow-600 dark:text-yellow-500">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>
                      <strong>{totalImagensSemItem}</strong>{" "}
                      {totalImagensSemItem === 1 ? "imagem" : "imagens"} sem
                      item identificado. Classifique manualmente pelo dropdown
                      ou inicie a análise IA.
                    </span>
                  </div>
                )}

                <div className="space-y-3">
                  <p className="text-xs text-[var(--text-secondary)]">
                    Arraste o ícone para reordenar as imagens.
                  </p>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStartImagens}
                    onDragOver={handleDragOverImagens}
                    onDragCancel={() => {
                      setActiveImagemId(null);
                      setOverImagemId(null);
                    }}
                    onDragEnd={handleDragEndImagens}
                  >
                    <SortableContext
                      items={imagens.map((img) => img.id)}
                      strategy={rectSortingStrategy}
                    >
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {imagens.map((img, index) => (
                          <SortableImagemCard
                            key={img.id}
                            img={img}
                            index={index}
                            tipoAmbiente={ambienteSelecionado?.tipoAmbiente}
                            opcoesItens={
                              ambienteSelecionado?.tipoAmbiente
                                ? opcoesItensCache[
                                    ambienteSelecionado.tipoAmbiente
                                  ] || []
                                : []
                            }
                            loadingItemChange={loadingItemChange}
                            onUpdateItem={handleUpdateItem}
                            onDelete={(imagemId) =>
                              setConfirmDelete({ isOpen: true, imagemId })
                            }
                            formatDate={formatDate}
                            isDropTarget={
                              !!activeImagemId &&
                              activeImagemId !== img.id &&
                              overImagemId === img.id
                            }
                          />
                        ))}
                      </div>
                    </SortableContext>
                    <DragOverlay>
                      {imagemSendoArrastada ? (
                        <div className="relative aspect-square w-[180px] md:w-[220px] lg:w-[240px] overflow-hidden rounded-lg border-2 border-primary/70 shadow-2xl">
                          <img
                            src={imagemSendoArrastada.url}
                            alt={
                              imagemSendoArrastada.tipo || "Imagem sendo movida"
                            }
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-black/70 px-3 py-2 text-xs font-semibold text-white">
                            Movendo imagem
                          </div>
                        </div>
                      ) : null}
                    </DragOverlay>
                  </DndContext>
                  {reorderingImagens && (
                    <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando nova ordem das imagens...
                    </div>
                  )}
                  {hasMoreImagens && (
                    <div
                      ref={imagensLoadMoreRef}
                      className="h-12 flex items-center justify-center text-sm text-[var(--text-secondary)]"
                    >
                      {loadingMaisImagens ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Carregando mais imagens...
                        </>
                      ) : (
                        "Role para carregar mais imagens"
                      )}
                    </div>
                  )}
                  {!hasMoreImagens && imagens.length > 0 && (
                    <div className="text-center text-xs text-[var(--text-secondary)] opacity-80 pt-2">
                      Todas as imagens foram carregadas
                    </div>
                  )}
                  {loadingMaisImagens && !hasMoreImagens && (
                    <div className="flex items-center justify-center py-3 text-sm text-[var(--text-secondary)]">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Carregando mais imagens...
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {/* Modal de confirmar exclusão de imagem */}
        <ConfirmModal
          isOpen={confirmDelete.isOpen}
          onClose={() => setConfirmDelete({ isOpen: false, imagemId: "" })}
          onConfirm={handleDeleteImagem}
          title="Excluir Imagem"
          message="Tem certeza que deseja excluir esta imagem? Esta ação não pode ser desfeita."
          confirmLabel="Excluir"
          cancelLabel="Cancelar"
          variant="danger"
        />

        {renameAmbienteModal.isOpen && (
          <div className="fixed inset-0 z-[70] bg-black/70 flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-5">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                Renomear ambiente
              </h3>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Atualize o nome do ambiente (máximo de{" "}
                {MAX_AMBIENTE_NOME_LENGTH} caracteres).
              </p>
              <div className="mt-4 space-y-2">
                <label
                  htmlFor="novo-nome-ambiente"
                  className="block text-sm font-medium text-[var(--text-secondary)]"
                >
                  Novo nome
                </label>
                <input
                  id="novo-nome-ambiente"
                  type="text"
                  maxLength={MAX_AMBIENTE_NOME_LENGTH}
                  value={renameAmbienteModal.novoNome}
                  onChange={(e) =>
                    setRenameAmbienteModal((prev) => ({
                      ...prev,
                      novoNome: e.target.value,
                    }))
                  }
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    (e.preventDefault(), handleRenameAmbiente())
                  }
                  className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg focus:border-primary outline-none transition-all"
                  placeholder="Digite o novo nome do ambiente"
                  autoFocus
                />
                <div className="text-right text-xs text-[var(--text-secondary)]">
                  {renameAmbienteModal.novoNome.length}/
                  {MAX_AMBIENTE_NOME_LENGTH}
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={handleCloseRenameAmbiente}
                  disabled={renamingAmbiente}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onClick={handleRenameAmbiente}
                  disabled={renamingAmbiente}
                >
                  {renamingAmbiente ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Salvar"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmar exclusão de ambiente */}
        <ConfirmModal
          isOpen={confirmDeleteAmbiente.isOpen}
          onClose={() =>
            setConfirmDeleteAmbiente({ isOpen: false, nomeAmbiente: "" })
          }
          onConfirm={handleDeleteAmbiente}
          title="Remover Ambiente"
          message={`Tem certeza que deseja remover o ambiente "${confirmDeleteAmbiente.nomeAmbiente}"? As imagens associadas NÃO serão deletadas automaticamente.`}
          confirmLabel="Remover"
          cancelLabel="Cancelar"
          variant="danger"
        />
      </div>
    </DashboardLayout>
  );
}
