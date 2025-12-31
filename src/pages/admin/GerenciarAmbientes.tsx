import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Button from "../../components/ui/Button";
import { ambientesService } from "../../services/ambientes";
import {
  Ambiente,
  ItemAmbiente,
  CreateAmbienteDto,
  UpdateAmbienteDto,
  CreateItemAmbienteDto,
  UpdateItemAmbienteDto,
  TipoUso,
  TipoImovel,
} from "../../types/ambiente";

type DialogType = "ambiente" | "item" | "subitem" | null;

interface DialogState {
  open: boolean;
  type: DialogType;
  mode: "create" | "edit";
  data?: Ambiente | ItemAmbiente;
  ambienteId?: string;
  parentId?: string;
}

// Componente para item arrastável
function SortableAmbienteCard({
  ambiente,
  expandedAmbientes,
  toggleAmbiente,
  handleToggleTipoUso,
  handleToggleTipoImovel,
  abrirDialog,
  confirmarDelete,
  renderItem,
  setDialogGrupo,
  setDialogEditarAmbientes,
  ambientes,
}: {
  ambiente: Ambiente;
  expandedAmbientes: Set<string>;
  toggleAmbiente: (id: string) => void;
  handleToggleTipoUso: (id: string, tipo: TipoUso) => void;
  handleToggleTipoImovel: (id: string, tipo: TipoImovel) => void;
  abrirDialog: (
    type: DialogType,
    mode: "create" | "edit",
    data?: Ambiente | ItemAmbiente,
    ambienteId?: string,
    parentId?: string
  ) => void;
  confirmarDelete: (
    type: "ambiente" | "item",
    id: string,
    ambienteId?: string
  ) => void;
  renderItem: (
    item: ItemAmbiente,
    ambienteId: string,
    nivel?: number
  ) => JSX.Element;
  setDialogGrupo: (state: {
    open: boolean;
    ambienteId?: string;
    inputAmbiente?: string;
  }) => void;
  setDialogEditarAmbientes: (state: {
    open: boolean;
    ambientes: Ambiente[];
  }) => void;
  ambientes: Ambiente[];
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ambiente.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-[var(--bg-secondary)] rounded-xl border-2 transition-all duration-300 ${
          isDragging ? "border-primary shadow-2xl" : "border-[var(--border-color)]"
        } overflow-hidden shadow-sm`}
      >
        {/* Header do Ambiente */}
        <div className="p-5 bg-gradient-to-r from-[var(--bg-primary)] to-[var(--bg-secondary)] border-b border-[var(--border-color)] transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              {/* Handle para arrastar */}
              <button
                {...attributes}
                {...listeners}
                className="drag-handle text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] bg-[var(--bg-primary)] border border-[var(--border-color)] rounded p-2 transition-all shadow-sm"
                title="Arrastar para reordenar"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="9" cy="5" r="1.5" fill="currentColor" />
                  <circle cx="9" cy="12" r="1.5" fill="currentColor" />
                  <circle cx="9" cy="19" r="1.5" fill="currentColor" />
                  <circle cx="15" cy="5" r="1.5" fill="currentColor" />
                  <circle cx="15" cy="12" r="1.5" fill="currentColor" />
                  <circle cx="15" cy="19" r="1.5" fill="currentColor" />
                </svg>
              </button>
              <span
                className="text-2xl cursor-pointer"
                onClick={() => toggleAmbiente(ambiente.id)}
              >
                📁
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3
                    className="text-xl font-bold text-[var(--text-primary)] cursor-pointer"
                    onClick={() => toggleAmbiente(ambiente.id)}
                  >
                    {ambiente.nome}
                  </h3>

                  {/* Badge indicando grupo */}
                  {ambiente.isGrupo && (
                    <span
                      className="px-2 py-0.5 text-xs font-semibold bg-primary/10 text-primary-dark dark:text-primary rounded border border-primary/20"
                      title={`Grupo de ambientes: ${ambiente.ambientes
                        ?.map((a) => a.nome)
                        .join(", ")}`}
                    >
                      👥 Grupo ({ambiente.ambientes?.length || 0})
                    </span>
                  )}

                  {/* Botão + para Agrupar Ambientes */}
                  <button
                    onClick={() =>
                      setDialogGrupo({
                        open: true,
                        ambienteId: ambiente.id,
                        inputAmbiente: "",
                      })
                    }
                    className="ml-2 w-7 h-7 flex items-center justify-center bg-primary hover:bg-primary-dark text-white rounded-full font-bold text-lg transition-all shadow-md hover:shadow-lg"
                    title="Agrupar com outros ambientes"
                  >
                    +
                  </button>

                  {/* Tipos de Uso - TODOS visíveis, clique para toggle */}
                  <div className="flex gap-1 items-center">
                    {Object.values(TipoUso).map((tipo) => (
                      <button
                        key={tipo}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleTipoUso(ambiente.id, tipo);
                        }}
                        className={`px-2 py-0.5 text-xs font-semibold rounded transition-all border ${
                          ambiente.tiposUso?.includes(tipo)
                            ? "bg-blue-500 text-white border-blue-600 shadow-md"
                            : "bg-blue-500/10 text-blue-500 border-blue-500/20 opacity-60 hover:opacity-100"
                        }`}
                        title={
                          ambiente.tiposUso?.includes(tipo)
                            ? "Clique para desativar"
                            : "Clique para ativar"
                        }
                      >
                        🏢 {tipo}
                      </button>
                    ))}
                  </div>

                  {/* Tipos de Imóvel - TODOS visíveis, clique para toggle */}
                  <div className="flex gap-1 items-center">
                    {Object.values(TipoImovel).map((tipo) => (
                      <button
                        key={tipo}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleTipoImovel(ambiente.id, tipo);
                        }}
                        className={`px-2 py-0.5 text-xs font-semibold rounded transition-all border ${
                          ambiente.tiposImovel?.includes(tipo)
                            ? "bg-green-500 text-white border-green-600 shadow-md"
                            : "bg-green-500/10 text-green-500 border-green-500/20 opacity-60 hover:opacity-100"
                        }`}
                        title={
                          ambiente.tiposImovel?.includes(tipo)
                            ? "Clique para desativar"
                            : "Clique para ativar"
                        }
                      >
                        🏠 {tipo}
                      </button>
                    ))}
                  </div>
                </div>
                {ambiente.descricao && (
                  <p className="text-sm text-[var(--text-secondary)] opacity-70 mt-1">
                    {ambiente.descricao}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1 text-sm font-semibold rounded-full border transition-colors ${
                  ambiente.ativo
                    ? "bg-green-500/10 text-green-500 border-green-500/20"
                    : "bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border-color)]"
                }`}
              >
                {ambiente.ativo ? "Ativo" : "Inativo"}
              </span>
              <span className="px-3 py-1 text-sm font-semibold bg-primary/10 text-primary border border-primary/20 rounded-full transition-colors">
                {ambiente.itens?.length || 0} itens
              </span>
              <span
                className={`transform transition-transform ${
                  expandedAmbientes.has(ambiente.id) ? "rotate-180" : ""
                }`}
              >
                ▼
              </span>
            </div>
          </div>
        </div>

        {/* Conteúdo do Ambiente */}
        <AnimatePresence>
          {expandedAmbientes.has(ambiente.id) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="p-5">
                {/* Botões de Ação do Ambiente */}
                <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-[var(--border-color)]">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      const ambienteIdParaItem =
                        ambiente.isGrupo &&
                        ambiente.ambientes &&
                        ambiente.ambientes.length > 0
                          ? ambiente.ambientes[0].id
                          : ambiente.id;
                      abrirDialog(
                        "item",
                        "create",
                        undefined,
                        ambienteIdParaItem
                      );
                    }}
                  >
                    ➕ Adicionar Item
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // Para grupos, coletar todos os ambientes do grupo (completos)
                      if (ambiente.isGrupo && ambiente.ambientes) {
                        const idsNoGrupo = ambiente.ambientes.map(a => a.id);
                        const ambientesCompletos = ambientes.filter(a => idsNoGrupo.includes(a.id));
                        setDialogEditarAmbientes({
                          open: true,
                          ambientes: ambientesCompletos,
                        });
                      } else {
                        // Para ambiente individual, criar array com 1 elemento
                        setDialogEditarAmbientes({
                          open: true,
                          ambientes: [ambiente],
                        });
                      }
                    }}
                  >
                    ✏️ Editar Ambiente
                  </Button>
                  <button
                    onClick={() => confirmarDelete("ambiente", ambiente.id)}
                    className="px-4 py-2 text-sm font-semibold bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                  >
                    🗑️ Deletar Ambiente
                  </button>
                </div>

                {/* Lista de Itens */}
                {ambiente.itens && ambiente.itens.length > 0 ? (
                  <div className="space-y-3">
                    {ambiente.itens.map((item) =>
                      renderItem(
                        item,
                        ambiente.isGrupo && ambiente.ambientes?.[0]?.id
                          ? ambiente.ambientes[0].id
                          : ambiente.id
                      )
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-[var(--text-secondary)] bg-[var(--bg-primary)] rounded-lg border-2 border-dashed border-[var(--border-color)] transition-colors">
                    <p>📋 Nenhum item cadastrado neste ambiente</p>
                    <p className="text-sm mt-1 opacity-70">
                      Clique em "Adicionar Item" para começar
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default function GerenciarAmbientes() {
  // @ts-ignore - TypeScript tem problemas de inferência com enums retornados da API, mas os tipos estão corretos em runtime
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 10;
  const observerTarget = useRef<HTMLDivElement>(null);

  const [expandedAmbientes, setExpandedAmbientes] = useState<Set<string>>(
    new Set()
  );
  const [dialog, setDialog] = useState<DialogState>({
    open: false,
    type: null,
    mode: "create",
  });
  const [dialogGrupo, setDialogGrupo] = useState<{
    open: boolean;
    ambienteId?: string;
    inputAmbiente?: string;
  }>({ open: false, inputAmbiente: "" });

  // @ts-ignore - TypeScript tem problemas de inferência com enums retornados da API, mas os tipos estão corretos em runtime
  const [dialogEditarAmbientes, setDialogEditarAmbientes] = useState<{
    open: boolean;
    ambientes: Ambiente[];
  }>({ open: false, ambientes: [] });

  const [dialogConfirm, setDialogConfirm] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ open: false, title: "", message: "", onConfirm: () => {} });

  // Estados do formulário
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    prompt: "",
    ativo: true,
    tiposUso: [] as TipoUso[],
    tiposImovel: [] as TipoImovel[],
  });

  // Configurar sensores para drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Precisa mover 8px para ativar o drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    carregarAmbientes();
  }, []);

  // Scroll infinito com Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          carregarMaisAmbientes();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, loadingMore, loading, offset]);

  const carregarAmbientes = async () => {
    try {
      setLoading(true);
      const response = await ambientesService.listarAmbientesComArvorePaginado(
        limit,
        0
      );
      // Forçar tipo correto - API retorna strings mas são enums válidos
      setAmbientes(response.data as unknown as Ambiente[]);
      setHasMore(response.hasMore);
      setOffset(limit);
      // Expandir todos por padrão
      setExpandedAmbientes(new Set(response.data.map((a) => a.id)));
    } catch (error) {
      toast.error("Erro ao carregar ambientes");
      console.error("Erro ao carregar ambientes:", error);
    } finally {
      setLoading(false);
    }
  };

  const carregarMaisAmbientes = async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      const response = await ambientesService.listarAmbientesComArvorePaginado(
        limit,
        offset
      );
      // Forçar tipo correto - API retorna strings mas são enums válidos
      setAmbientes((prev) => [
        ...prev,
        ...(response.data as unknown as Ambiente[]),
      ]);
      setHasMore(response.hasMore);
      setOffset((prev) => prev + limit);
      // Expandir novos ambientes
      setExpandedAmbientes((prev) => {
        const newSet = new Set(prev);
        response.data.forEach((a) => newSet.add(a.id));
        return newSet;
      });
    } catch (error) {
      toast.error("Erro ao carregar mais ambientes");
      console.error("Erro ao carregar mais ambientes:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = ambientes.findIndex((a) => a.id === active.id);
    const newIndex = ambientes.findIndex((a) => a.id === over.id);

    // Atualizar ordem localmente primeiro para feedback imediato
    const reordered = arrayMove(ambientes, oldIndex, newIndex);
    setAmbientes(reordered as Ambiente[]);

    // Enviar para backend apenas o item movido e sua nova posição
    try {
      await ambientesService.moverAmbiente(active.id as string, newIndex);
      toast.success("Ordem atualizada!");
    } catch (error) {
      toast.error("Erro ao atualizar ordem");
      console.error("Erro ao reordenar:", error);
      // Reverter em caso de erro
      carregarAmbientes();
    }
  };

  const toggleAmbiente = (id: string) => {
    setExpandedAmbientes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleAgruparAmbientes = async () => {
    if (!dialogGrupo.ambienteId || !dialogGrupo.inputAmbiente?.trim()) {
      toast.error("Digite o nome do ambiente para agrupar");
      return;
    }

    try {
      const nomeAmbiente = dialogGrupo.inputAmbiente.trim();

      // Encontrar o ambiente correto
      const ambiente = ambientes.find((a) => a.id === dialogGrupo.ambienteId);

      // Se for um grupo, usar o ID do primeiro ambiente do grupo
      const ambienteIdReal =
        ambiente?.isGrupo && ambiente.ambientes && ambiente.ambientes.length > 0
          ? ambiente.ambientes[0].id
          : dialogGrupo.ambienteId;

      await ambientesService.agruparCom(ambienteIdReal, nomeAmbiente);

      const ambienteExiste = ambientes.some(
        (a) => a.nome.toLowerCase() === nomeAmbiente.toLowerCase()
      );

      toast.success(
        ambienteExiste
          ? `Ambientes agrupados com sucesso!`
          : `Ambiente "${nomeAmbiente}" criado e agrupado!`
      );
      setDialogGrupo({ open: false, inputAmbiente: "" });
      await carregarAmbientes();
    } catch (error: any) {
      console.error("Erro ao agrupar ambientes:", error);

      // Extrair mensagem de erro clara do backend
      let mensagemErro = "Não foi possível agrupar os ambientes";

      if (error?.response?.data?.message) {
        // Usar mensagem do backend diretamente (já está clara e didática)
        mensagemErro = error.response.data.message;
      } else if (error?.message) {
        mensagemErro = error.message;
      }

      toast.error(mensagemErro);
    }
  };

  const abrirDialog = (
    type: DialogType,
    mode: "create" | "edit",
    data?: Ambiente | ItemAmbiente,
    ambienteId?: string,
    parentId?: string
  ) => {
    setDialog({ open: true, type, mode, data, ambienteId, parentId });

    if (mode === "edit" && data) {
      setFormData({
        nome: data.nome,
        descricao: "descricao" in data ? data.descricao || "" : "",
        prompt: "prompt" in data ? data.prompt : "",
        ativo: data.ativo,
        tiposUso: "tiposUso" in data ? data.tiposUso || [] : [],
        tiposImovel: "tiposImovel" in data ? data.tiposImovel || [] : [],
      });
    } else {
      setFormData({
        nome: "",
        descricao: "",
        prompt: "",
        ativo: true,
        tiposUso: [],
        tiposImovel: [],
      });
    }
  };

  const fecharDialog = () => {
    setDialog({ open: false, type: null, mode: "create" });
    setFormData({
      nome: "",
      descricao: "",
      prompt: "",
      ativo: true,
      tiposUso: [],
      tiposImovel: [],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (dialog.type === "ambiente") {
        if (dialog.mode === "create") {
          const data: CreateAmbienteDto = {
            nome: formData.nome,
            descricao: formData.descricao || undefined,
            ativo: formData.ativo,
            tiposUso:
              formData.tiposUso.length > 0 ? formData.tiposUso : undefined,
            tiposImovel:
              formData.tiposImovel.length > 0
                ? formData.tiposImovel
                : undefined,
          };
          await ambientesService.criarAmbiente(data);
          toast.success("Ambiente criado com sucesso!");
        } else if (dialog.mode === "edit" && dialog.data) {
          const data: UpdateAmbienteDto = {
            nome: formData.nome,
            descricao: formData.descricao || undefined,
            ativo: formData.ativo,
            tiposUso: formData.tiposUso,
            tiposImovel: formData.tiposImovel,
          };
          await ambientesService.atualizarAmbiente(dialog.data.id, data);
          toast.success("Ambiente atualizado com sucesso!");
        }
      } else if (
        (dialog.type === "item" || dialog.type === "subitem") &&
        dialog.ambienteId
      ) {
        if (dialog.mode === "create") {
          const data: CreateItemAmbienteDto = {
            nome: formData.nome,
            prompt: formData.prompt,
            descricao: formData.descricao || undefined,
            parentId: dialog.parentId,
            ativo: formData.ativo,
          };
          await ambientesService.criarItem(dialog.ambienteId, data);
          toast.success("Item criado com sucesso!");
        } else if (dialog.mode === "edit" && dialog.data) {
          const data: UpdateItemAmbienteDto = {
            nome: formData.nome,
            prompt: formData.prompt,
            descricao: formData.descricao || undefined,
            ativo: formData.ativo,
          };
          await ambientesService.atualizarItem(
            dialog.ambienteId,
            dialog.data.id,
            data
          );
          toast.success("Item atualizado com sucesso!");
        }
      }

      await carregarAmbientes();
      fecharDialog();
    } catch (error: any) {
      console.error("Erro ao salvar:", error);

      // Extrair mensagem clara do backend
      let mensagemErro = "Não foi possível salvar";

      if (error?.response?.data?.message) {
        // Usar mensagem do backend (já formatada)
        mensagemErro = error.response.data.message;
      } else if (error?.message) {
        mensagemErro = error.message;
      }

      toast.error(mensagemErro);
    }
  };

  const confirmarDelete = (
    type: "ambiente" | "item",
    id: string,
    ambienteId?: string
  ) => {
    const ambiente = ambientes.find((a) => a.id === id);
    const nomeItem = ambiente?.nome || "este item";

    setDialogConfirm({
      open: true,
      title: "⚠️ Confirmar Exclusão",
      message: `Tem certeza que deseja deletar "${nomeItem}"? Esta ação não pode ser desfeita.`,
      onConfirm: () => handleDelete(type, id, ambienteId),
    });
  };

  const handleDelete = async (
    type: "ambiente" | "item",
    id: string,
    ambienteId?: string
  ) => {
    setDialogConfirm({
      open: false,
      title: "",
      message: "",
      onConfirm: () => {},
    });

    try {
      if (type === "ambiente") {
        const ambiente = ambientes.find((a) => a.id === id);

        // Se for um grupo, deletar todos os ambientes do grupo
        if (
          ambiente?.isGrupo &&
          ambiente.ambientes &&
          ambiente.ambientes.length > 0
        ) {
          for (const amb of ambiente.ambientes) {
            await ambientesService.deletarAmbiente(amb.id);
          }
        } else {
          await ambientesService.deletarAmbiente(id);
        }

        // Fechar dialog de edição ANTES de mostrar notificação
        setDialogEditarAmbientes({ open: false, ambientes: [] });

        toast.success("Ambiente deletado com sucesso!");
      } else if (type === "item" && ambienteId) {
        const ambiente = ambientes.find((a) => a.id === ambienteId);

        // Se for um grupo, deletar o item do primeiro ambiente do grupo
        if (
          ambiente?.isGrupo &&
          ambiente.ambientes &&
          ambiente.ambientes.length > 0
        ) {
          await ambientesService.deletarItem(ambiente.ambientes[0].id, id);
        } else {
          await ambientesService.deletarItem(ambienteId, id);
        }

        toast.success("Item deletado com sucesso!");
      }

      await carregarAmbientes();
    } catch (error: any) {
      console.error("Erro ao deletar:", error);

      // Fechar dialog mesmo em caso de erro
      setDialogEditarAmbientes({ open: false, ambientes: [] });

      toast.error(error?.response?.data?.message || "Erro ao deletar");
    }
  };

  /**
   * Toggle de tipo específico sem recarregar tudo
   */
  const handleToggleTipoUso = async (ambienteId: string, tipo: TipoUso) => {
    try {
      const ambiente = ambientes.find((a) => a.id === ambienteId);
      if (!ambiente) return;

      const tiposAtuais = ambiente.tiposUso || [];
      const estaRemovendo = tiposAtuais.includes(tipo);

      // Se for um grupo, usar ID do primeiro ambiente
      const ambienteIdReal =
        ambiente.isGrupo && ambiente.ambientes && ambiente.ambientes.length > 0
          ? ambiente.ambientes[0].id
          : ambienteId;

      // Chamar endpoint REST específico (mais eficiente!)
      const resultado = estaRemovendo
        ? await ambientesService.removerTipoUso(ambienteIdReal, tipo)
        : await ambientesService.adicionarTipoUso(ambienteIdReal, tipo);

      // Forçar o tipo correto - o backend retorna strings mas sabemos que são TipoUso válidos
      const tiposUsoAtualizados = resultado.tiposUso as unknown as TipoUso[];

      // Atualizar localmente APÓS sucesso da API
      setAmbientes(
        (prev) =>
          prev.map((a) =>
            a.id === ambienteId ? { ...a, tiposUso: tiposUsoAtualizados } : a
          ) as unknown as Ambiente[]
      );

      toast.success(`${tipo} ${estaRemovendo ? "removido" : "adicionado"}!`);
    } catch (error: any) {
      console.error("Erro ao atualizar tipo de uso:", error);
      toast.error("Erro ao atualizar tipo de uso");
    }
  };

  const handleToggleTipoImovel = async (
    ambienteId: string,
    tipo: TipoImovel
  ) => {
    try {
      const ambiente = ambientes.find((a) => a.id === ambienteId);
      if (!ambiente) return;

      const tiposAtuais = ambiente.tiposImovel || [];
      const estaRemovendo = tiposAtuais.includes(tipo);

      // Se for um grupo, usar ID do primeiro ambiente
      const ambienteIdReal =
        ambiente.isGrupo && ambiente.ambientes && ambiente.ambientes.length > 0
          ? ambiente.ambientes[0].id
          : ambienteId;

      // Chamar endpoint REST específico (mais eficiente!)
      const resultado = estaRemovendo
        ? await ambientesService.removerTipoImovel(ambienteIdReal, tipo)
        : await ambientesService.adicionarTipoImovel(ambienteIdReal, tipo);

      // Forçar o tipo correto - o backend retorna strings mas sabemos que são TipoImovel válidos
      const tiposImovelAtualizados =
        resultado.tiposImovel as unknown as TipoImovel[];

      // Atualizar localmente APÓS sucesso da API
      setAmbientes(
        (prev) =>
          prev.map((a) =>
            a.id === ambienteId
              ? { ...a, tiposImovel: tiposImovelAtualizados }
              : a
          ) as unknown as Ambiente[]
      );

      toast.success(`${tipo} ${estaRemovendo ? "removido" : "adicionado"}!`);
    } catch (error: any) {
      console.error("Erro ao atualizar tipo de imóvel:", error);
      toast.error("Erro ao atualizar tipo de imóvel");
    }
  };

  const renderItem = (
    item: ItemAmbiente,
    ambienteId: string,
    nivel: number = 0
  ): JSX.Element => {
    return (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`mb-3 ${nivel > 0 ? "ml-8" : ""}`}
      >
        <div
          className={`bg-[var(--bg-secondary)] border-2 transition-all duration-300 ${
            nivel === 0 ? "border-[var(--border-color)]" : "border-[var(--border-color)] opacity-90"
          } rounded-lg p-4 shadow-sm`}
        >
          <div className="flex items-start gap-3">
            {nivel > 0 && <span className="text-gray-400 mt-1">↳</span>}

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-lg font-bold text-[var(--text-primary)] transition-colors">
                  {item.nome}
                </h4>
                <span
                  className={`px-2 py-0.5 text-xs font-semibold rounded border transition-colors ${
                    item.ativo
                      ? "bg-green-500/10 text-green-500 border-green-500/20"
                      : "bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border-color)]"
                  }`}
                >
                  {item.ativo ? "Ativo" : "Inativo"}
                </span>
              </div>

              <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded p-3 mb-3 transition-colors">
                <p className="text-xs font-bold text-[var(--text-secondary)] opacity-60 mb-1">
                  PROMPT:
                </p>
                <p className="text-sm text-[var(--text-primary)] font-mono break-words">{item.prompt}</p>
              </div>

              <div className="flex gap-2">
                 <button
                  onClick={() =>
                    abrirDialog(
                      "subitem",
                      "create",
                      undefined,
                      ambienteId,
                      item.id
                    )
                  }
                  className="px-3 py-1.5 text-sm bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded hover:bg-blue-500 hover:text-white transition-all shadow-sm"
                  title="Adicionar sub-item"
                >
                  ➕ Sub-item
                </button>
                <button
                  onClick={() => abrirDialog("item", "edit", item, ambienteId)}
                  className="px-3 py-1.5 text-sm bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded hover:bg-amber-500 hover:text-white transition-all shadow-sm"
                  title="Editar"
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => {
                    const itemNome = item.nome;
                    setDialogConfirm({
                      open: true,
                      title: "⚠️ Confirmar Exclusão",
                      message: `Tem certeza que deseja deletar o item "${itemNome}"? Esta ação não pode ser desfeita.`,
                      onConfirm: () =>
                        handleDelete("item", item.id, ambienteId),
                    });
                  }}
                  className="px-3 py-1.5 text-sm bg-red-500/10 text-red-500 border border-red-500/20 rounded hover:bg-red-500 hover:text-white transition-all shadow-sm"
                  title="Deletar"
                >
                  🗑️ Deletar
                </button>
              </div>
            </div>
          </div>

          {/* Renderizar sub-itens recursivamente */}
          {item.filhos && item.filhos.length > 0 && (
            <div className="mt-4">
              {item.filhos.map((filho) =>
                renderItem(filho, ambienteId, nivel + 1)
              )}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-[var(--text-primary)] transition-colors">
              🏠 Gerenciar Ambientes
            </h2>
            <p className="text-[var(--text-secondary)] opacity-70 mt-1">
              Configure ambientes, itens e prompts para análise de laudos
            </p>
            <p className="text-sm text-primary font-medium mt-1">
              ↕️ Arraste os blocos para reorganizar
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => abrirDialog("ambiente", "create")}
          >
            ➕ Novo Ambiente
          </Button>
        </div>

        {/* Lista de Ambientes */}
        {loading ? (
          <div className="text-center py-24 transition-colors">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-[var(--text-secondary)] font-medium">Carregando ambientes...</p>
          </div>
        ) : ambientes.length === 0 ? (
          <div className="bg-blue-500/10 border-2 border-blue-500/20 rounded-xl p-8 text-center transition-colors">
            <p className="text-blue-500 font-medium">
              ℹ️ Nenhum ambiente cadastrado. Clique em "Novo Ambiente" para
              começar.
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={ambientes.map((a) => a.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {ambientes.map((ambiente) => (
                  <SortableAmbienteCard
                    key={ambiente.id}
                    ambiente={ambiente}
                    expandedAmbientes={expandedAmbientes}
                    toggleAmbiente={toggleAmbiente}
                    handleToggleTipoUso={handleToggleTipoUso}
                    handleToggleTipoImovel={handleToggleTipoImovel}
                    abrirDialog={abrirDialog}
                    confirmarDelete={confirmarDelete}
                    renderItem={renderItem}
                    setDialogGrupo={setDialogGrupo}
                    setDialogEditarAmbientes={setDialogEditarAmbientes}
                    ambientes={ambientes}
                  />
                ))}
              </div>
            </SortableContext>

            {/* Indicador de carregamento de mais items */}
            {loadingMore && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-2 text-[var(--text-secondary)]">Carregando mais...</p>
              </div>
            )}

            {/* Observer target para scroll infinito */}
            <div ref={observerTarget} className="h-4" />

            {/* Mensagem de fim */}
            {!hasMore && ambientes.length > 0 && (
              <div className="text-center py-6 text-[var(--text-secondary)] opacity-50">
                <p>✓ Todos os ambientes foram carregados</p>
              </div>
            )}
          </DndContext>
        )}
      </div>

      {/* Dialog de Criação/Edição */}
      <AnimatePresence>
        {dialog.open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={fecharDialog}
              className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
             <div className="bg-[var(--bg-secondary)] rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[var(--border-color)] transition-all">
                {/* Header */}
                <div className="p-6 border-b border-[var(--border-color)]">
                  <h3 className="text-2xl font-bold text-[var(--text-primary)]">
                    {dialog.mode === "create" ? "➕ Criar" : "✏️ Editar"}{" "}
                    {dialog.type === "ambiente"
                      ? "Ambiente"
                      : dialog.type === "subitem"
                      ? "Sub-item"
                      : "Item"}
                  </h3>
                </div>

                {/* Formulário */}
                 <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">
                      Nome *
                    </label>
                    <input
                      type="text"
                      value={formData.nome}
                      onChange={(e) =>
                        setFormData({ ...formData, nome: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-[var(--bg-primary)] border-2 border-[var(--border-color)] text-[var(--text-primary)] rounded-lg focus:border-primary outline-none transition-all placeholder:opacity-50"
                      required
                      autoFocus
                      placeholder="Digite o nome..."
                    />
                  </div>

                  {dialog.type === "ambiente" && (
                    <>
                       <div>
                        <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">
                          Descrição
                        </label>
                        <textarea
                          value={formData.descricao}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              descricao: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 bg-[var(--bg-primary)] border-2 border-[var(--border-color)] text-[var(--text-primary)] rounded-lg focus:border-primary outline-none resize-none transition-all placeholder:opacity-50"
                          rows={3}
                          placeholder="Descrição opcional..."
                        />
                      </div>
                    </>
                  )}

                  {(dialog.type === "item" || dialog.type === "subitem") && (
                    <>
                      {/* Campo Descrição - APENAS para itens PAI */}
                      {dialog.type === "item" && !dialog.parentId && (
                        <div>
                          <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">
                            Descrição (exibida no app)
                          </label>
                          <textarea
                            value={formData.descricao}
                            onChange={(e) =>
                              setFormData({ ...formData, descricao: e.target.value })
                            }
                            className="w-full px-4 py-2 bg-[var(--bg-primary)] border-2 border-[var(--border-color)] text-[var(--text-primary)] rounded-lg focus:border-primary outline-none resize-none transition-all placeholder:opacity-50"
                            rows={2}
                            placeholder="Ex: Fotografe a porta principal do ambiente"
                          />
                          <p className="text-xs text-[var(--text-secondary)] opacity-60 mt-1">
                            Esta descrição será exibida ao usuário no app mobile
                          </p>
                        </div>
                      )}

                      {/* Campo Prompt - SEMPRE obrigatório */}
                     <div>
                      <label className="block text-sm font-bold text-amber-600 dark:text-amber-500 mb-2">
                        🤖 Prompt de IA (uso interno) *
                      </label>
                      <textarea
                        value={formData.prompt}
                        onChange={(e) =>
                          setFormData({ ...formData, prompt: e.target.value })
                        }
                        className="w-full px-4 py-2 bg-[var(--bg-primary)] border-2 border-amber-500/20 text-[var(--text-primary)] rounded-lg focus:border-amber-500 outline-none resize-none font-mono text-sm transition-all placeholder:opacity-50"
                        rows={5}
                        required
                        placeholder="Digite o prompt para análise deste item..."
                      />
                      <p className="text-xs text-amber-600/80 dark:text-amber-500/80 font-semibold mt-1">
                        ⚠️ Este campo NÃO é exibido ao usuário - apenas para uso interno da IA
                      </p>
                    </div>
                    </>
                  )}

                   <div className="flex items-center gap-3 p-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg transition-colors">
                    <input
                      type="checkbox"
                      id="ativo"
                      checked={formData.ativo}
                      onChange={(e) =>
                        setFormData({ ...formData, ativo: e.target.checked })
                      }
                      className="w-5 h-5 text-primary rounded border-[var(--border-color)] focus:ring-2 focus:ring-primary"
                    />
                    <label
                      htmlFor="ativo"
                      className="text-sm font-bold text-[var(--text-primary)] cursor-pointer"
                    >
                      Ativo
                    </label>
                  </div>

                  {/* Botões */}
                  <div className="flex gap-3 pt-4">
                     <button
                      type="button"
                      onClick={fecharDialog}
                      className="flex-1 px-6 py-3 text-[var(--text-primary)] bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg font-bold transition-all"
                    >
                      Cancelar
                    </button>
                     <button
                      type="submit"
                      disabled={
                        !formData.nome ||
                        (dialog.type !== "ambiente" && !formData.prompt)
                      }
                      className="flex-1 px-6 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {dialog.mode === "create" ? "Criar" : "Salvar"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Dialog de Agrupamento de Ambientes */}
      <AnimatePresence>
        {dialogGrupo.open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() =>
                setDialogGrupo({
                  open: false,
                  inputAmbiente: "",
                })
              }
              className="fixed inset-0 bg-black/50 z-40"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
               <div className="bg-[var(--bg-secondary)] rounded-xl shadow-2xl max-w-md w-full border border-[var(--border-color)] transition-all overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-[var(--border-color)] bg-gradient-to-r from-primary/10 to-primary/20">
                  <h3 className="text-2xl font-bold text-primary">
                    ➕ Agrupar Ambientes
                  </h3>
                  <p className="text-sm text-primary opacity-80 mt-1">
                    Selecione os ambientes que devem compartilhar a mesma
                    configuração
                  </p>
                </div>

                {/* Conteúdo */}
                 <div className="p-6">
                  <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-sm text-blue-500">
                      💡 <strong>Como funciona:</strong> Digite o nome de um
                      ambiente existente para agrupar, ou digite um novo nome
                      para criar e agrupar automaticamente.
                    </p>
                  </div>

                  <div className="space-y-4">
                     <div>
                      <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">
                        Nome do ambiente:
                      </label>
                       <input
                        type="text"
                        value={dialogGrupo.inputAmbiente || ""}
                        onChange={(e) =>
                          setDialogGrupo({
                            ...dialogGrupo,
                            inputAmbiente: e.target.value,
                          })
                        }
                        placeholder="Digite ou selecione um ambiente..."
                        className="w-full px-4 py-3 bg-[var(--bg-primary)] border-2 border-[var(--border-color)] text-[var(--text-primary)] rounded-lg focus:border-primary outline-none text-lg transition-all"
                        autoFocus
                      />
                    </div>

                    {/* Sugestões de Ambientes Existentes */}
                    {dialogGrupo.inputAmbiente &&
                      dialogGrupo.inputAmbiente.trim().length > 0 && (
                        <div className="max-h-48 overflow-y-auto border-2 border-gray-200 rounded-lg">
                          {ambientes
                            .filter((a) => {
                              const ambienteAtual = ambientes.find(
                                (amb) => amb.id === dialogGrupo.ambienteId
                              );

                              // Não mostrar o próprio ambiente
                              if (a.id === dialogGrupo.ambienteId) return false;

                              // Se o ambiente atual é um grupo, não mostrar ambientes que já estão nesse grupo
                              if (
                                ambienteAtual?.isGrupo &&
                                ambienteAtual.ambientes
                              ) {
                                const nomesNoGrupo =
                                  ambienteAtual.ambientes.map((amb) =>
                                    amb.nome.toLowerCase()
                                  );
                                if (nomesNoGrupo.includes(a.nome.toLowerCase()))
                                  return false;
                              }

                              // Filtrar por nome digitado
                              return a.nome
                                .toLowerCase()
                                .includes(
                                  dialogGrupo.inputAmbiente!.toLowerCase()
                                );
                            })
                            .map((ambiente) => (
                               <button
                                key={ambiente.id}
                                onClick={() =>
                                  setDialogGrupo({
                                    ...dialogGrupo,
                                    inputAmbiente: ambiente.nome,
                                  })
                                }
                                className="w-full flex items-center gap-3 p-3 hover:bg-primary/10 transition-colors text-left border-b border-[var(--border-color)] last:border-0"
                              >
                                <span className="text-2xl">📁</span>
                                <div className="flex-1">
                                  <p className="font-bold text-[var(--text-primary)]">
                                    {ambiente.nome}
                                  </p>
                                  <div className="flex gap-1 mt-1">
                                    {ambiente.tiposUso
                                      ?.slice(0, 2)
                                      .map((tipo) => (
                                        <span
                                          key={tipo}
                                          className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded"
                                        >
                                          {tipo}
                                        </span>
                                      ))}
                                    {ambiente.tiposImovel
                                      ?.slice(0, 2)
                                      .map((tipo) => (
                                        <span
                                          key={tipo}
                                          className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded"
                                        >
                                          {tipo}
                                        </span>
                                      ))}
                                  </div>
                                </div>
                                <span className="text-sm text-gray-500">
                                  Existente
                                </span>
                              </button>
                            ))}

                          {/* Opção de criar novo */}
                          {ambientes.filter(
                            (a) =>
                              a.id !== dialogGrupo.ambienteId &&
                              a.nome.toLowerCase() ===
                                dialogGrupo.inputAmbiente?.toLowerCase()
                          ).length === 0 && (
                            <div className="p-3 bg-green-50 border-t-2 border-green-200">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">✨</span>
                                <div>
                                  <p className="font-semibold text-green-900">
                                    Criar "{dialogGrupo.inputAmbiente}"
                                  </p>
                                  <p className="text-xs text-green-700">
                                    Novo ambiente será criado e agrupado
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                  </div>

                  {/* Botões */}
                   <div className="flex gap-3 mt-6">
                    <button
                      onClick={() =>
                        setDialogGrupo({
                          open: false,
                          inputAmbiente: "",
                        })
                      }
                      className="flex-1 px-6 py-3 text-[var(--text-primary)] bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg font-bold transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleAgruparAmbientes}
                      disabled={!dialogGrupo.inputAmbiente?.trim()}
                      className="flex-1 px-6 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Agrupar
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Dialog de Editar Ambientes */}
      <AnimatePresence>
        {dialogEditarAmbientes.open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() =>
                setDialogEditarAmbientes({ open: false, ambientes: [] })
              }
              className="fixed inset-0 bg-black/50 z-40"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
               <div className="bg-[var(--bg-secondary)] rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-[var(--border-color)] transition-all">
                {/* Header */}
                <div className="p-6 border-b border-[var(--border-color)] bg-primary transition-colors">
                  <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                    ✏️ Editar Ambientes Cadastrados
                  </h3>
                  <p className="text-white/80 mt-1">
                    Renomeie ou remova os ambientes abaixo
                  </p>
                </div>

                {/* Lista de Ambientes */}
                <div className="p-6 space-y-3">
                   {dialogEditarAmbientes.ambientes.length === 0 ? (
                    <div className="text-center py-12 text-[var(--text-secondary)] opacity-50">
                      <p className="text-lg">📭 Nenhum ambiente para editar</p>
                    </div>
                  ) : (
                    dialogEditarAmbientes.ambientes.map((ambiente) => (
                      <motion.div
                        key={ambiente.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-4 transition-colors hover:border-primary/50"
                      >
                        <div className="flex items-center justify-between gap-4">
                          {/* Info do Ambiente */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">📁</span>
                              <h4 className="text-lg font-bold text-[var(--text-primary)] transition-colors">
                                {ambiente.nome}
                              </h4>
                            </div>
                            {ambiente.descricao && (
                              <p className="text-sm text-[var(--text-secondary)] mt-1 ml-8 opacity-70">
                                {ambiente.descricao}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-2 mt-2 ml-8">
                              {ambiente.tiposUso?.map((tipo) => (
                                <span
                                  key={tipo}
                                  className="px-2 py-0.5 text-xs font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded transition-colors"
                                >
                                  🏢 {tipo}
                                </span>
                              ))}
                              {ambiente.tiposImovel?.map((tipo) => (
                                <span
                                  key={tipo}
                                  className="px-2 py-0.5 text-xs font-semibold bg-green-500/10 text-green-500 border border-green-500/20 rounded transition-colors"
                                >
                                  🏠 {tipo}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Botões de Ação */}
                           <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setDialogEditarAmbientes({
                                  open: false,
                                  ambientes: [],
                                });
                                abrirDialog("ambiente", "edit", ambiente);
                              }}
                              className="px-4 py-2 bg-primary text-white rounded-lg font-bold transition-all shadow-md hover:bg-primary-dark flex items-center gap-2"
                              title="Renomear ambiente"
                            >
                              ✏️ Renomear
                            </button>
                            <button
                              onClick={() => {
                                // Primeiro fechar o modal de edição
                                setDialogEditarAmbientes({
                                  open: false,
                                  ambientes: [],
                                });
                                // Depois abrir confirmação de delete
                                setTimeout(() => {
                                  confirmarDelete("ambiente", ambiente.id);
                                }, 100);
                              }}
                              className="px-4 py-2 bg-red-500 text-white rounded-lg font-bold transition-all shadow-md hover:bg-red-600 flex items-center gap-2"
                              title="Remover ambiente"
                            >
                              🗑️ Remover
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-[var(--border-color)] bg-[var(--bg-primary)] transition-colors">
                  <button
                    onClick={() =>
                      setDialogEditarAmbientes({ open: false, ambientes: [] })
                    }
                    className="w-full px-6 py-3 bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-lg font-bold transition-all"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Dialog de Confirmação Customizado */}
      <AnimatePresence>
        {dialogConfirm.open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-[var(--bg-secondary)] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-[var(--border-color)] transition-all">
                {/* Header */}
                <div className="p-6 bg-red-500 border-b border-red-600 transition-colors">
                  <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                    {dialogConfirm.title}
                  </h3>
                </div>

                {/* Conteúdo */}
                <div className="p-6">
                  <p className="text-[var(--text-primary)] text-lg leading-relaxed font-medium transition-colors">
                    {dialogConfirm.message}
                  </p>
                </div>

                 {/* Botões */}
                <div className="p-6 bg-[var(--bg-primary)] border-t border-[var(--border-color)] flex gap-3 transition-colors">
                  <button
                    onClick={() =>
                      setDialogConfirm({
                        open: false,
                        title: "",
                        message: "",
                        onConfirm: () => {},
                      })
                    }
                    className="flex-1 px-6 py-3 bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-lg font-bold transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={dialogConfirm.onConfirm}
                    className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold transition-all shadow-md"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
