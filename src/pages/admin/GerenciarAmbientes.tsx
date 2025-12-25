import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

export default function GerenciarAmbientes() {
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedAmbientes, setExpandedAmbientes] = useState<Set<string>>(
    new Set()
  );
  const [dialog, setDialog] = useState<DialogState>({
    open: false,
    type: null,
    mode: "create",
  });

  // Estados do formulário
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    prompt: "",
    ativo: true,
    tiposUso: [] as TipoUso[],
    tiposImovel: [] as TipoImovel[],
  });

  // Estado de notificação
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "success" as "success" | "error" | "info",
  });

  useEffect(() => {
    carregarAmbientes();
  }, []);

  const carregarAmbientes = async () => {
    try {
      setLoading(true);
      const data = await ambientesService.listarAmbientesComArvore();
      setAmbientes(data);
      // Expandir todos por padrão
      setExpandedAmbientes(new Set(data.map((a) => a.id)));
    } catch (error) {
      mostrarNotificacao("Erro ao carregar ambientes", "error");
      console.error("Erro ao carregar ambientes:", error);
    } finally {
      setLoading(false);
    }
  };

  const mostrarNotificacao = (
    message: string,
    type: "success" | "error" | "info"
  ) => {
    setNotification({ show: true, message, type });
    setTimeout(
      () => setNotification({ show: false, message: "", type: "success" }),
      4000
    );
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
          mostrarNotificacao("Ambiente criado com sucesso!", "success");
        } else if (dialog.mode === "edit" && dialog.data) {
          const data: UpdateAmbienteDto = {
            nome: formData.nome,
            descricao: formData.descricao || undefined,
            ativo: formData.ativo,
            tiposUso: formData.tiposUso,
            tiposImovel: formData.tiposImovel,
          };
          await ambientesService.atualizarAmbiente(dialog.data.id, data);
          mostrarNotificacao("Ambiente atualizado com sucesso!", "success");
        }
      } else if (
        (dialog.type === "item" || dialog.type === "subitem") &&
        dialog.ambienteId
      ) {
        if (dialog.mode === "create") {
          const data: CreateItemAmbienteDto = {
            nome: formData.nome,
            prompt: formData.prompt,
            parentId: dialog.parentId,
            ativo: formData.ativo,
          };
          await ambientesService.criarItem(dialog.ambienteId, data);
          mostrarNotificacao("Item criado com sucesso!", "success");
        } else if (dialog.mode === "edit" && dialog.data) {
          const data: UpdateItemAmbienteDto = {
            nome: formData.nome,
            prompt: formData.prompt,
            ativo: formData.ativo,
          };
          await ambientesService.atualizarItem(
            dialog.ambienteId,
            dialog.data.id,
            data
          );
          mostrarNotificacao("Item atualizado com sucesso!", "success");
        }
      }

      await carregarAmbientes();
      fecharDialog();
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      mostrarNotificacao(
        error?.response?.data?.message || "Erro ao salvar",
        "error"
      );
    }
  };

  const handleDelete = async (
    type: "ambiente" | "item",
    id: string,
    ambienteId?: string
  ) => {
    if (
      !window.confirm(
        "Tem certeza que deseja deletar? Esta ação não pode ser desfeita."
      )
    ) {
      return;
    }

    try {
      if (type === "ambiente") {
        await ambientesService.deletarAmbiente(id);
        mostrarNotificacao("Ambiente deletado com sucesso!", "success");
      } else if (type === "item" && ambienteId) {
        await ambientesService.deletarItem(ambienteId, id);
        mostrarNotificacao("Item deletado com sucesso!", "success");
      }

      await carregarAmbientes();
    } catch (error: any) {
      console.error("Erro ao deletar:", error);
      mostrarNotificacao(
        error?.response?.data?.message || "Erro ao deletar",
        "error"
      );
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
      const novosTipos = tiposAtuais.includes(tipo)
        ? tiposAtuais.filter((t) => t !== tipo)
        : [...tiposAtuais, tipo];

      // Atualização local otimista (ANTES da request)
      setAmbientes((prev) =>
        prev.map((a) =>
          a.id === ambienteId ? { ...a, tiposUso: novosTipos } : a
        )
      );

      // Request otimizada - endpoint específico que retorna apenas id e tipos
      await ambientesService.atualizarTiposAmbiente(ambienteId, {
        tiposUso: novosTipos,
      });

      mostrarNotificacao(
        `Tipo de uso ${
          tiposAtuais.includes(tipo) ? "removido" : "adicionado"
        }!`,
        "success"
      );
    } catch (error: any) {
      console.error("Erro ao atualizar tipo de uso:", error);
      mostrarNotificacao("Erro ao atualizar tipo de uso", "error");
      await carregarAmbientes(); // Recarrega em caso de erro
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
      const novosTipos = tiposAtuais.includes(tipo)
        ? tiposAtuais.filter((t) => t !== tipo)
        : [...tiposAtuais, tipo];

      // Atualização local otimista (ANTES da request)
      setAmbientes((prev) =>
        prev.map((a) =>
          a.id === ambienteId ? { ...a, tiposImovel: novosTipos } : a
        )
      );

      // Request otimizada - endpoint específico que retorna apenas id e tipos
      await ambientesService.atualizarTiposAmbiente(ambienteId, {
        tiposImovel: novosTipos,
      });

      mostrarNotificacao(
        `Tipo de imóvel ${
          tiposAtuais.includes(tipo) ? "removido" : "adicionado"
        }!`,
        "success"
      );
    } catch (error: any) {
      console.error("Erro ao atualizar tipo de imóvel:", error);
      mostrarNotificacao("Erro ao atualizar tipo de imóvel", "error");
      await carregarAmbientes(); // Recarrega em caso de erro
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
          className={`bg-white border-2 ${
            nivel === 0 ? "border-gray-200" : "border-gray-300"
          } rounded-lg p-4 shadow-sm`}
        >
          <div className="flex items-start gap-3">
            {nivel > 0 && <span className="text-gray-400 mt-1">↳</span>}

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-lg font-semibold text-gray-900">
                  {item.nome}
                </h4>
                <span
                  className={`px-2 py-0.5 text-xs font-semibold rounded ${
                    item.ativo
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {item.ativo ? "Ativo" : "Inativo"}
                </span>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-3">
                <p className="text-xs font-semibold text-gray-600 mb-1">
                  PROMPT:
                </p>
                <p className="text-sm text-gray-700 font-mono">{item.prompt}</p>
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
                  className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                  title="Adicionar sub-item"
                >
                  ➕ Sub-item
                </button>
                <button
                  onClick={() => abrirDialog("item", "edit", item, ambienteId)}
                  className="px-3 py-1.5 text-sm bg-amber-50 text-amber-600 rounded hover:bg-amber-100 transition-colors"
                  title="Editar"
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => handleDelete("item", item.id, ambienteId)}
                  className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
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
    <DashboardLayout userType="admin">
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              🏠 Gerenciar Ambientes
            </h2>
            <p className="text-gray-600 mt-1">
              Configure ambientes, itens e prompts para análise de laudos
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => abrirDialog("ambiente", "create")}
          >
            ➕ Novo Ambiente
          </Button>
        </div>

        {/* Notificação */}
        <AnimatePresence>
          {notification.show && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`p-4 rounded-lg border-2 ${
                notification.type === "success"
                  ? "bg-green-50 border-green-200 text-green-800"
                  : notification.type === "error"
                  ? "bg-red-50 border-red-200 text-red-800"
                  : "bg-blue-50 border-blue-200 text-blue-800"
              }`}
            >
              {notification.message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lista de Ambientes */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-gray-600">Carregando ambientes...</p>
          </div>
        ) : ambientes.length === 0 ? (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 text-center">
            <p className="text-blue-800">
              ℹ️ Nenhum ambiente cadastrado. Clique em "Novo Ambiente" para
              começar.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {ambientes.map((ambiente) => (
              <motion.div
                key={ambiente.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden shadow-sm"
              >
                {/* Header do Ambiente */}
                <div
                  className="p-5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleAmbiente(ambiente.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-2xl">📁</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-xl font-bold text-gray-900">
                            {ambiente.nome}
                          </h3>

                          {/* Badges de Tipos de Uso */}
                          {ambiente.tiposUso &&
                            ambiente.tiposUso.length > 0 && (
                              <div className="flex gap-1">
                                {ambiente.tiposUso.map((tipo) => (
                                  <span
                                    key={tipo}
                                    className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded"
                                    title="Tipo de Uso"
                                  >
                                    🏢 {tipo}
                                  </span>
                                ))}
                              </div>
                            )}

                          {/* Badges de Tipos de Imóvel */}
                          {ambiente.tiposImovel &&
                            ambiente.tiposImovel.length > 0 && (
                              <div className="flex gap-1">
                                {ambiente.tiposImovel.map((tipo) => (
                                  <span
                                    key={tipo}
                                    className="px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-700 rounded"
                                    title="Tipo de Imóvel"
                                  >
                                    🏠 {tipo}
                                  </span>
                                ))}
                              </div>
                            )}
                        </div>
                        {ambiente.descricao && (
                          <p className="text-sm text-gray-600 mt-1">
                            {ambiente.descricao}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 text-sm font-semibold rounded-full ${
                          ambiente.ativo
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {ambiente.ativo ? "Ativo" : "Inativo"}
                      </span>
                      <span className="px-3 py-1 text-sm font-semibold bg-purple-100 text-purple-700 rounded-full">
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
                        {/* Seletores de Tipos */}
                        <div className="mb-4 space-y-3">
                          {/* Tipos de Uso */}
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-2">
                              🏢 TIPOS DE USO
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {Object.values(TipoUso).map((tipo) => (
                                <button
                                  key={tipo}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleTipoUso(ambiente.id, tipo);
                                  }}
                                  className={`px-3 py-1.5 text-sm rounded-lg font-semibold transition-all ${
                                    ambiente.tiposUso?.includes(tipo)
                                      ? "bg-blue-500 text-white shadow-md hover:bg-blue-600"
                                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                  }`}
                                >
                                  {tipo}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Tipos de Imóvel */}
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-2">
                              🏠 TIPOS DE IMÓVEL
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {Object.values(TipoImovel).map((tipo) => (
                                <button
                                  key={tipo}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleTipoImovel(ambiente.id, tipo);
                                  }}
                                  className={`px-3 py-1.5 text-sm rounded-lg font-semibold transition-all ${
                                    ambiente.tiposImovel?.includes(tipo)
                                      ? "bg-green-500 text-white shadow-md hover:bg-green-600"
                                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                  }`}
                                >
                                  {tipo}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Botões de Ação do Ambiente */}
                        <div className="flex gap-2 mb-4 pb-4 border-b border-gray-200">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              abrirDialog(
                                "item",
                                "create",
                                undefined,
                                ambiente.id
                              )
                            }
                          >
                            ➕ Adicionar Item
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              abrirDialog("ambiente", "edit", ambiente)
                            }
                          >
                            ✏️ Editar Ambiente
                          </Button>
                          <button
                            onClick={() =>
                              handleDelete("ambiente", ambiente.id)
                            }
                            className="px-4 py-2 text-sm font-semibold bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors border-2 border-red-200"
                          >
                            🗑️ Deletar Ambiente
                          </button>
                        </div>

                        {/* Lista de Itens */}
                        {ambiente.itens && ambiente.itens.length > 0 ? (
                          <div className="space-y-3">
                            {ambiente.itens.map((item) =>
                              renderItem(item, ambiente.id)
                            )}
                          </div>
                        ) : (
                          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <p className="text-gray-600">
                              📝 Nenhum item cadastrado neste ambiente.
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
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
              className="fixed inset-0 bg-black/50 z-40"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-2xl font-bold text-gray-900">
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
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nome *
                    </label>
                    <input
                      type="text"
                      value={formData.nome}
                      onChange={(e) =>
                        setFormData({ ...formData, nome: e.target.value })
                      }
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                      required
                      autoFocus
                      placeholder="Digite o nome..."
                    />
                  </div>

                  {dialog.type === "ambiente" && (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                          rows={3}
                          placeholder="Descrição opcional..."
                        />
                      </div>

                      {/* Tipos de Uso */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          🏢 Tipos de Uso
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {Object.values(TipoUso).map((tipo) => (
                            <button
                              key={tipo}
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  tiposUso: prev.tiposUso.includes(tipo)
                                    ? prev.tiposUso.filter((t) => t !== tipo)
                                    : [...prev.tiposUso, tipo],
                                }));
                              }}
                              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                                formData.tiposUso.includes(tipo)
                                  ? "bg-blue-500 text-white shadow-md"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }`}
                            >
                              {tipo}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Tipos de Imóvel */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          🏠 Tipos de Imóvel
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {Object.values(TipoImovel).map((tipo) => (
                            <button
                              key={tipo}
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  tiposImovel: prev.tiposImovel.includes(tipo)
                                    ? prev.tiposImovel.filter((t) => t !== tipo)
                                    : [...prev.tiposImovel, tipo],
                                }));
                              }}
                              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                                formData.tiposImovel.includes(tipo)
                                  ? "bg-green-500 text-white shadow-md"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }`}
                            >
                              {tipo}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {(dialog.type === "item" || dialog.type === "subitem") && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Prompt de IA *
                      </label>
                      <textarea
                        value={formData.prompt}
                        onChange={(e) =>
                          setFormData({ ...formData, prompt: e.target.value })
                        }
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none font-mono text-sm"
                        rows={5}
                        required
                        placeholder="Digite o prompt para análise deste item..."
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Este prompt será usado pela IA para analisar este item
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      id="ativo"
                      checked={formData.ativo}
                      onChange={(e) =>
                        setFormData({ ...formData, ativo: e.target.checked })
                      }
                      className="w-5 h-5 text-primary rounded border-gray-300 focus:ring-2 focus:ring-primary"
                    />
                    <label
                      htmlFor="ativo"
                      className="text-sm font-semibold text-gray-700 cursor-pointer"
                    >
                      Ativo
                    </label>
                  </div>

                  {/* Botões */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={fecharDialog}
                      className="flex-1 px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={
                        !formData.nome ||
                        (dialog.type !== "ambiente" && !formData.prompt)
                      }
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
    </DashboardLayout>
  );
}
