import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Button from "../../components/ui/Button";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { laudoDetailsService } from "../../services/laudo-details";
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
} from "../../types/laudo-details";

export default function GerenciarDetalhesLaudo() {
  const [sections, setSections] = useState<LaudoSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  // Estado para controlar seções expandidas
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );
  const [loadingSectionDetails, setLoadingSectionDetails] = useState<
    Set<string>
  >(new Set());

  // Estados para modais
  const [sectionModal, setSectionModal] = useState<{
    open: boolean;
    mode: "create" | "edit";
    data?: LaudoSection;
  }>({ open: false, mode: "create" });

  const [questionModal, setQuestionModal] = useState<{
    open: boolean;
    mode: "create" | "edit";
    data?: LaudoQuestion;
    sectionId?: string;
  }>({ open: false, mode: "create" });

  const [optionModal, setOptionModal] = useState<{
    open: boolean;
    mode: "create" | "edit";
    data?: LaudoOption;
    questionId?: string;
  }>({ open: false, mode: "create" });

  // Estados para formulários
  const [sectionForm, setSectionForm] = useState<CreateLaudoSectionDto>({
    name: "",
  });
  const [questionForm, setQuestionForm] = useState<CreateLaudoQuestionDto>({
    sectionId: "",
    questionText: "",
  });
  const [optionForm, setOptionForm] = useState<CreateLaudoOptionDto>({
    questionId: "",
    optionText: "",
  });

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const loadMoreSections = () => {
    if (hasMore && !loadingMore) {
      loadSections(currentPage + 1, true);
    }
  };

  const reloadSections = () => {
    loadSections(1, false);
  };

  // Funções auxiliares para atualização otimizada do estado local
  const addSectionToLocalState = (newSection: LaudoSection) => {
    setSections((prevSections) => [...prevSections, newSection]);
  };

  const updateSectionInLocalState = (updatedSection: LaudoSection) => {
    setSections((prevSections) =>
      prevSections.map((section) =>
        section.id === updatedSection.id ? updatedSection : section
      )
    );
  };

  const removeSectionFromLocalState = (sectionId: string) => {
    setSections((prevSections) =>
      prevSections.filter((section) => section.id !== sectionId)
    );
  };

  // Função para carregar detalhes de uma seção específica
  const loadSectionDetails = async (sectionId: string) => {
    try {
      setLoadingSectionDetails((prev) => new Set(prev).add(sectionId));

      const sectionDetails = await laudoDetailsService.getSectionDetails(
        sectionId
      );

      // Atualizar a seção no estado local
      setSections((prevSections) =>
        prevSections.map((section) =>
          section.id === sectionId
            ? { ...section, questions: sectionDetails.questions }
            : section
        )
      );
    } catch (error) {
      console.error(`Erro ao carregar detalhes da seção ${sectionId}:`, error);
      toast.error("Erro ao carregar detalhes da seção");
    } finally {
      setLoadingSectionDetails((prev) => {
        const newSet = new Set(prev);
        newSet.delete(sectionId);
        return newSet;
      });
    }
  };

  // Função para alternar expansão de uma seção
  const toggleSectionExpansion = async (sectionId: string) => {
    const isExpanded = expandedSections.has(sectionId);

    if (isExpanded) {
      // Colapsar seção
      setExpandedSections((prev) => {
        const newSet = new Set(prev);
        newSet.delete(sectionId);
        return newSet;
      });
    } else {
      // Expandir seção
      setExpandedSections((prev) => new Set(prev).add(sectionId));

      // Verificar se a seção já tem detalhes carregados
      const section = sections.find((s) => s.id === sectionId);
      if (section && !section.questions) {
        await loadSectionDetails(sectionId);
      }
    }
  };

  // Funções auxiliares para atualização otimizada do estado local
  const addOptionToLocalState = (newOption: LaudoOption) => {
    setSections((prevSections) =>
      prevSections.map((section) =>
        section.questions?.some((q) => q.id === newOption.questionId)
          ? {
              ...section,
              questions: section.questions?.map((question) =>
                question.id === newOption.questionId
                  ? {
                      ...question,
                      options: [...(question.options || []), newOption],
                    }
                  : question
              ),
            }
          : section
      )
    );
  };

  const updateOptionInLocalState = (updatedOption: LaudoOption) => {
    setSections((prevSections) =>
      prevSections.map((section) =>
        section.questions?.some((q) =>
          q.options?.some((o) => o.id === updatedOption.id)
        )
          ? {
              ...section,
              questions: section.questions?.map((question) =>
                question.options?.some((o) => o.id === updatedOption.id)
                  ? {
                      ...question,
                      options: question.options?.map((option) =>
                        option.id === updatedOption.id ? updatedOption : option
                      ),
                    }
                  : question
              ),
            }
          : section
      )
    );
  };

  const removeOptionFromLocalState = (optionId: string) => {
    setSections((prevSections) =>
      prevSections.map((section) => ({
        ...section,
        questions: section.questions?.map((question) => ({
          ...question,
          options: question.options?.filter((option) => option.id !== optionId),
        })),
      }))
    );
  };

  // Funções auxiliares para perguntas
  const addQuestionToLocalState = (newQuestion: LaudoQuestion) => {
    setSections((prevSections) =>
      prevSections.map((section) =>
        section.id === newQuestion.sectionId
          ? {
              ...section,
              questions: [...(section.questions || []), newQuestion],
            }
          : section
      )
    );
  };

  const updateQuestionInLocalState = (updatedQuestion: LaudoQuestion) => {
    setSections((prevSections) =>
      prevSections.map((section) =>
        section.questions?.some((q) => q.id === updatedQuestion.id)
          ? {
              ...section,
              questions: section.questions?.map((question) =>
                question.id === updatedQuestion.id ? updatedQuestion : question
              ),
            }
          : section
      )
    );
  };

  const removeQuestionFromLocalState = (questionId: string) => {
    setSections((prevSections) =>
      prevSections.map((section) => ({
        ...section,
        questions: section.questions?.filter(
          (question) => question.id !== questionId
        ),
      }))
    );
  };

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async (page: number = 1, append: boolean = false) => {
    try {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);

      const response = await laudoDetailsService.getAllSections(page, 10);

      if (append) {
        setSections((prev) => [...prev, ...response.data]);
      } else {
        setSections(response.data);
      }

      setTotal(response.total);
      setHasMore(response.hasMore);
      setCurrentPage(page);
    } catch (error) {
      toast.error("Erro ao carregar seções");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Handlers para seções
  const handleCreateSection = async () => {
    try {
      const newSection = await laudoDetailsService.createSection(sectionForm);
      addSectionToLocalState(newSection);
      toast.success("Seção criada com sucesso");
      setSectionModal({ open: false, mode: "create" });
      setSectionForm({ name: "" });
    } catch (error) {
      toast.error("Erro ao criar seção");
    }
  };

  const handleUpdateSection = async () => {
    if (!sectionModal.data) return;
    try {
      const updatedSection = await laudoDetailsService.updateSection(
        sectionModal.data.id,
        sectionForm
      );
      updateSectionInLocalState(updatedSection);
      toast.success("Seção atualizada com sucesso");
      setSectionModal({ open: false, mode: "create" });
      setSectionForm({ name: "" });
    } catch (error) {
      toast.error("Erro ao atualizar seção");
    }
  };

  const handleDeleteSection = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Deletar Seção",
      message: "Tem certeza que deseja deletar esta seção? Esta ação não pode ser desfeita.",
      onConfirm: async () => {
        try {
          await laudoDetailsService.deleteSection(id);
          removeSectionFromLocalState(id);
          toast.success("Seção deletada com sucesso");
        } catch (error) {
          toast.error("Erro ao deletar seção");
        }
      },
    });
  };

  // Handlers para perguntas
  const handleCreateQuestion = async () => {
    try {
      const newQuestion = await laudoDetailsService.createQuestion(
        questionForm
      );
      addQuestionToLocalState(newQuestion);
      toast.success("Pergunta criada com sucesso");
      setQuestionModal({ open: false, mode: "create" });
      setQuestionForm({ sectionId: "", questionText: "" });
    } catch (error) {
      toast.error("Erro ao criar pergunta");
    }
  };

  const handleUpdateQuestion = async () => {
    if (!questionModal.data) return;
    try {
      const updatedQuestion = await laudoDetailsService.updateQuestion(
        questionModal.data.id,
        {
          questionText: questionForm.questionText,
        }
      );
      updateQuestionInLocalState(updatedQuestion);
      toast.success("Pergunta atualizada com sucesso");
      setQuestionModal({ open: false, mode: "create" });
      setQuestionForm({ sectionId: "", questionText: "" });
    } catch (error) {
      toast.error("Erro ao atualizar pergunta");
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Deletar Pergunta",
      message: "Tem certeza que deseja deletar esta pergunta? Esta ação não pode ser desfeita.",
      onConfirm: async () => {
        try {
          await laudoDetailsService.deleteQuestion(id);
          removeQuestionFromLocalState(id);
          toast.success("Pergunta deletada com sucesso");
        } catch (error) {
          toast.error("Erro ao deletar pergunta");
        }
      },
    });
  };

  // Handlers para opções
  const handleCreateOption = async () => {
    try {
      const newOption = await laudoDetailsService.createOption(optionForm);
      toast.success("Opção criada com sucesso");
      addOptionToLocalState(newOption);
      setOptionModal({ open: false, mode: "create" });
      setOptionForm({ questionId: "", optionText: "" });
    } catch (error) {
      toast.error("Erro ao criar opção");
    }
  };

  const handleUpdateOption = async () => {
    if (!optionModal.data) return;
    try {
      const updatedOption = await laudoDetailsService.updateOption(
        optionModal.data.id,
        {
          optionText: optionForm.optionText,
        }
      );
      toast.success("Opção atualizada com sucesso");
      updateOptionInLocalState(updatedOption);
      setOptionModal({ open: false, mode: "create" });
      setOptionForm({ questionId: "", optionText: "" });
    } catch (error) {
      toast.error("Erro ao atualizar opção");
    }
  };

  const handleDeleteOption = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Deletar Opção",
      message: "Tem certeza que deseja deletar esta opção? Esta ação não pode ser desfeita.",
      onConfirm: async () => {
        try {
          await laudoDetailsService.deleteOption(id);
          toast.success("Opção deletada com sucesso");
          removeOptionFromLocalState(id);
        } catch (error) {
          toast.error("Erro ao deletar opção");
        }
      },
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Gerenciar Detalhes do Laudo
          </h1>
          <Button
            onClick={() => setSectionModal({ open: true, mode: "create" })}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Nova Seção
          </Button>
        </div>

        <div className="space-y-6">
          {sections.map((section) => {
            const isExpanded = expandedSections.has(section.id);
            const isLoadingDetails = loadingSectionDetails.has(section.id);

            return (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[var(--bg-secondary)] rounded-lg shadow-md p-6 border border-[var(--border-color)]"
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleSectionExpansion(section.id)}
                      className="text-gray-500 hover:text-gray-700 transition-colors"
                      title={isExpanded ? "Recolher seção" : "Expandir seção"}
                    >
                      {isLoadingDetails ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
                      ) : (
                        <span className="text-xl">
                          {isExpanded ? "▼" : "▶"}
                        </span>
                      )}
                    </button>
                    <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                      {section.name}
                    </h2>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setSectionModal({
                          open: true,
                          mode: "edit",
                          data: section,
                        });
                        setSectionForm({ name: section.name });
                      }}
                      variant="secondary"
                      size="sm"
                      title="Editar seção"
                    >
                      ✏️
                    </Button>
                    <Button
                      onClick={() => handleDeleteSection(section.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
                      title="Deletar seção"
                    >
                      🗑️
                    </Button>
                    {isExpanded && (
                      <Button
                        onClick={() => {
                          setQuestionModal({
                            open: true,
                            mode: "create",
                            sectionId: section.id,
                          });
                          setQuestionForm({
                            sectionId: section.id,
                            questionText: "",
                          });
                        }}
                        size="sm"
                      >
                        Nova Pergunta
                      </Button>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                  >
                    {section.questions?.map((question) => (
                      <div
                        key={question.id}
                        className="border-l-4 border-blue-200 pl-4"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-lg font-medium text-[var(--text-primary)]">
                            {question.questionText || "Pergunta sem texto"}
                          </h3>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => {
                                setQuestionModal({
                                  open: true,
                                  mode: "edit",
                                  data: question,
                                });
                                setQuestionForm({
                                  sectionId: question.sectionId,
                                  questionText: question.questionText || "",
                                });
                              }}
                              variant="secondary"
                              size="sm"
                              title="Editar pergunta"
                            >
                              ✏️
                            </Button>
                            <Button
                              onClick={() => handleDeleteQuestion(question.id)}
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
                              title="Deletar pergunta"
                            >
                              🗑️
                            </Button>
                            <Button
                              onClick={() => {
                                setOptionModal({
                                  open: true,
                                  mode: "create",
                                  questionId: question.id,
                                });
                                setOptionForm({
                                  questionId: question.id,
                                  optionText: "",
                                });
                              }}
                              size="sm"
                            >
                              Nova Opção
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {question.options?.map((option) => (
                            <div
                              key={option.id}
                              className="flex justify-between items-center bg-[var(--bg-primary)] p-2 rounded border border-[var(--border-color)]"
                            >
                              <span className="text-[var(--text-secondary)]">
                                {option.optionText}
                              </span>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => {
                                    setOptionModal({
                                      open: true,
                                      mode: "edit",
                                      data: option,
                                    });
                                    setOptionForm({
                                      questionId: option.questionId,
                                      optionText: option.optionText,
                                    });
                                  }}
                                  variant="secondary"
                                  size="sm"
                                  title="Editar opção"
                                >
                                  ✏️
                                </Button>
                                <Button
                                  onClick={() => handleDeleteOption(option.id)}
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
                                  title="Deletar opção"
                                >
                                  🗑️
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    {isExpanded &&
                      !isLoadingDetails &&
                      (!section.questions ||
                        section.questions.length === 0) && (
                        <div className="text-center text-gray-500 py-8">
                          <p>Nenhuma pergunta cadastrada nesta seção.</p>
                          <Button
                            onClick={() => {
                              setQuestionModal({
                                open: true,
                                mode: "create",
                                sectionId: section.id,
                              });
                              setQuestionForm({
                                sectionId: section.id,
                                questionText: "",
                              });
                            }}
                            className="mt-4"
                          >
                            Criar primeira pergunta
                          </Button>
                        </div>
                      )}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Botão Carregar Mais */}
        {hasMore && (
          <div className="flex justify-center mt-6">
            <Button
              onClick={loadMoreSections}
              disabled={loadingMore}
              className="bg-gray-600 hover:bg-gray-700"
            >
              {loadingMore ? "Carregando..." : "Carregar Mais"}
            </Button>
          </div>
        )}

        {/* Modal para Seção */}
        {sectionModal.open && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6 w-full max-w-md shadow-xl"
            >
              <h3 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">
                {sectionModal.mode === "create" ? "Nova Seção" : "Editar Seção"}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Nome da Seção
                  </label>
                  <input
                    type="text"
                    value={sectionForm.name}
                    onChange={(e) =>
                      setSectionForm({ ...sectionForm, name: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    onClick={() => {
                      setSectionModal({ open: false, mode: "create" });
                      setSectionForm({ name: "" });
                    }}
                    variant="secondary"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={
                      sectionModal.mode === "create"
                        ? handleCreateSection
                        : handleUpdateSection
                    }
                  >
                    {sectionModal.mode === "create" ? "Criar" : "Atualizar"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Modal para Pergunta */}
        {questionModal.open && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6 w-full max-w-md shadow-xl"
            >
              <h3 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">
                {questionModal.mode === "create"
                  ? "Nova Pergunta"
                  : "Editar Pergunta"}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Texto da Pergunta (opcional)
                  </label>
                  <input
                    type="text"
                    value={questionForm.questionText}
                    onChange={(e) =>
                      setQuestionForm({
                        ...questionForm,
                        questionText: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Deixe vazio se não houver pergunta específica"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    onClick={() => {
                      setQuestionModal({ open: false, mode: "create" });
                      setQuestionForm({ sectionId: "", questionText: "" });
                    }}
                    variant="secondary"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={
                      questionModal.mode === "create"
                        ? handleCreateQuestion
                        : handleUpdateQuestion
                    }
                  >
                    {questionModal.mode === "create" ? "Criar" : "Atualizar"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Modal para Opção */}
        {optionModal.open && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6 w-full max-w-md shadow-xl"
            >
              <h3 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">
                {optionModal.mode === "create" ? "Nova Opção" : "Editar Opção"}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Texto da Opção
                  </label>
                  <input
                    type="text"
                    value={optionForm.optionText}
                    onChange={(e) =>
                      setOptionForm({
                        ...optionForm,
                        optionText: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    onClick={() => {
                      setOptionModal({ open: false, mode: "create" });
                      setOptionForm({ questionId: "", optionText: "" });
                    }}
                    variant="secondary"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={
                      optionModal.mode === "create"
                        ? handleCreateOption
                        : handleUpdateOption
                    }
                  >
                    {optionModal.mode === "create" ? "Criar" : "Atualizar"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
          onConfirm={confirmModal.onConfirm}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmLabel="Deletar"
          variant="danger"
        />
      </div>
    </DashboardLayout>
  );
}
