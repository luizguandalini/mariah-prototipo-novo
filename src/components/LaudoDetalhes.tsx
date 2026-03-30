import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import type { Laudo } from "../services/laudos";
import { laudosService } from "../services/laudos";
import type { LaudoSection, LaudoQuestion } from "../types/laudo-details";

interface LaudoDetalhesProps {
  laudo: Laudo;
}

interface DetailedLaudoResponse extends Partial<Laudo> {
  availableSections?: LaudoSection[];
}

// Função auxiliar para normalizar nomes de seções
const normalizeSectionName = (name: string): string => {
  return name
    .toLowerCase()
    .trim() // Remove espaços extras
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/\s+/g, ""); // Remove espaços
};

// Mapeamento de seção -> campo de dados (usando chaves normalizadas)
const SECTION_FIELD_MAP: Record<
  string,
  { dataKey: string; fields?: string[] }
> = {
  [normalizeSectionName("Atestado da vistoria")]: { dataKey: "atestado" },
  [normalizeSectionName("Análises Hidráulicas")]: {
    dataKey: "analisesHidraulicas",
    fields: ["fluxo_agua", "vazamentos"],
  },
  [normalizeSectionName("Análises Elétricas")]: {
    dataKey: "analisesEletricas",
    fields: ["funcionamento", "disjuntores"],
  },
  [normalizeSectionName("Sistema de ar")]: {
    dataKey: "sistemaAr",
    fields: ["ar_condicionado", "aquecimento"],
  },
  [normalizeSectionName("Mecanismos de abertura")]: {
    dataKey: "mecanismosAbertura",
    fields: ["portas", "macanetas", "janelas"],
  },
  [normalizeSectionName("Revestimentos")]: {
    dataKey: "revestimentos",
    fields: ["tetos", "pisos", "bancadas"],
  },
  [normalizeSectionName("Mobilias")]: {
    dataKey: "mobilias",
    fields: ["fixa", "nao_fixa"],
  },
};

export default function LaudoDetalhes({ laudo }: LaudoDetalhesProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [detalhes, setDetalhes] = useState<DetailedLaudoResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Estados para edição
  const [editedValues, setEditedValues] = useState<Record<string, any>>({});

  if (laudo.incluirAtestado === 0) {
    return null;
  }

  const handleExpand = async () => {
    if (!isExpanded && !detalhes && !loading) {
      setLoading(true);
      setError(null);
      try {
        const data = (await laudosService.getLaudoDetalhes(
          laudo.id,
        )) as DetailedLaudoResponse;
        console.log("📊 Detalhes carregados:", data);
        console.log("📊 Seções disponíveis:", data.availableSections);
        setDetalhes(data);

        // Inicializar valores de edição
        setEditedValues({
          atestado: data.atestado || "",
          analisesHidraulicas: data.analisesHidraulicas || {},
          analisesEletricas: data.analisesEletricas || {},
          sistemaAr: data.sistemaAr || {},
          mecanismosAbertura: data.mecanismosAbertura || {},
          revestimentos: data.revestimentos || {},
          mobilias: data.mobilias || {},
          dadosExtra: data.dadosExtra || {},
        });
      } catch (err: any) {
        setError("Erro ao carregar detalhes do laudo.");
      } finally {
        setLoading(false);
      }
    }
    setIsExpanded((prev) => !prev);
  };

  const handleSave = async () => {
    setSaving(true);

    // Payload que será enviado ao backend
    const payload: Record<string, any> = { ...editedValues };

    // Pegar dadosExtra dos editados (que já contém os originais se não foram removidos)
    const dadosExtra: Record<string, any> = {
      ...(editedValues.dadosExtra || {}),
    };

    // Validação e Limpeza de chaves não whitelisted
    if (detalhes?.availableSections) {
      for (const section of detalhes.availableSections) {
        const normalizedKey = normalizeSectionName(section.name);
        const mapping = SECTION_FIELD_MAP[normalizedKey];
        const dataKey = mapping?.dataKey || normalizedKey;
        const fields = mapping?.fields || [];

        const sectionEditedData = payload[dataKey] || {};
        if (!section.questions) continue;

        // Limpar dados antes de enviar se for uma seção mapeada (evitar erro de whitelist no backend)
        const whitelistedData: Record<string, any> = {};
        const extraDataForSection: Record<string, any> = {};
        let hasExtra = false;

        for (let i = 0; i < section.questions.length; i++) {
          const q = section.questions[i];
          const fieldKey = fields[i];

          let value = null;
          if (typeof sectionEditedData === "string") {
            value = sectionEditedData;
          } else {
            // Priority 1: Edited data
            if (fieldKey && sectionEditedData[fieldKey] !== undefined) {
              value = sectionEditedData[fieldKey];
            } else if (
              q.questionText &&
              sectionEditedData[q.questionText] !== undefined
            ) {
              value = sectionEditedData[q.questionText];
            } else if (q.id && sectionEditedData[q.id] !== undefined) {
              value = sectionEditedData[q.id];
            }

            // Priority 2: Original data (Fallback if untouched)
            if (value === null) {
              // Load original data for this section
              const rawOriginal = detalhes?.[dataKey as keyof typeof detalhes];
              let originalParsed = rawOriginal;
              if (
                !originalParsed &&
                detalhes?.dadosExtra &&
                (detalhes.dadosExtra as any)[section.name]
              ) {
                originalParsed = (detalhes.dadosExtra as any)[section.name];
              }
              if (
                typeof originalParsed === "string" &&
                originalParsed.startsWith("{")
              ) {
                try {
                  originalParsed = JSON.parse(originalParsed);
                } catch (e) {}
              }

              if (originalParsed && typeof originalParsed === "object") {
                if (fieldKey) value = (originalParsed as any)[fieldKey];
                else
                  value =
                    (originalParsed as any)[q.questionText || ""] ||
                    (originalParsed as any)[q.id];
              } else if (
                typeof originalParsed === "string" &&
                dataKey === "atestado"
              ) {
                value = originalParsed;
              }
            }
          }

          // [VALIDAÇÃO] Exigir resposta para todas as perguntas
          if (
            value === null ||
            value === undefined ||
            (typeof value === "string" && value.trim() === "")
          ) {
            const friendlyLabel = q.questionText || `Pergunta ${i + 1}`;
            toast.error(
              `Por favor, responda a pergunta: "${friendlyLabel}" na seção "${section.name}"`,
            );
            setSaving(false);
            return;
          }

          // Separar o que é whitelist do que é extra
          if (fieldKey) {
            whitelistedData[fieldKey] = value;
          } else if (dataKey === "atestado") {
            // Atestado é string pura no backend
            payload[dataKey] = value;
          } else {
            // Vai para dadosExtra
            extraDataForSection[q.questionText || q.id] = value;
            hasExtra = true;
          }
        }

        // Se a seção for mapeada, atualizamos o campo com apenas o que é whitelisted
        if (mapping && dataKey !== "atestado") {
          // [LIMPEZA CRUCIAL] O backend rejeita propriedades extras em objetos whitelisted.
          // Precisamos garantir que payload[dataKey] contenha APENAS chaves de 'fields'.
          const finalWhitelisted: Record<string, any> = {};
          const extraFieldsInMappedSection: Record<string, any> = {};

          // 1. Pegar tudo o que está em editedValues[dataKey]
          const currentData = editedValues[dataKey] || {};
          if (typeof currentData === "object") {
            Object.entries(currentData).forEach(([k, v]) => {
              if (fields.includes(k)) {
                finalWhitelisted[k] = v;
              } else {
                // Se não é whitelisted, movemos para dadosExtra para não dar erro 400
                extraFieldsInMappedSection[k] = v;
              }
            });
          }

          // 2. Garantir que whitelistedData (das perguntas oficiais) sobrescreva
          Object.assign(finalWhitelisted, whitelistedData);

          payload[dataKey] = finalWhitelisted;

          // 3. Mover extras para dadosExtra
          if (hasExtra || Object.keys(extraFieldsInMappedSection).length > 0) {
            dadosExtra[section.name] = {
              ...(dadosExtra[section.name] || {}),
              ...extraDataForSection,
              ...extraFieldsInMappedSection,
            };
          }
        }
        // Se for seção dinâmica (não mapeada), vai tudo para dadosExtra
        else if (!mapping) {
          // [MELHORIA] Em vez de usar o raw state, usamos o que foi consolidado no loop das perguntas (extraDataForSection)
          // Isso garante que peguemos os valores atuais + fallbacks de dados legados se houver.
          dadosExtra[section.name] = extraDataForSection;
          delete payload[dataKey];
        }
      }
    }

    // Adicionar dadosExtra consolidados
    payload.dadosExtra = dadosExtra;

    console.log("🚀 Payload final para envio:", payload);

    try {
      await laudosService.updateLaudoDetalhes(laudo.id, payload);

      setDetalhes({
        ...detalhes,
        ...payload,
      } as DetailedLaudoResponse);

      setIsEditing(false);
      toast.success("Detalhes atualizados com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar detalhes");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reverter para valores originais
    setEditedValues({
      atestado: detalhes?.atestado || "",
      analisesHidraulicas: detalhes?.analisesHidraulicas || {},
      analisesEletricas: detalhes?.analisesEletricas || {},
      sistemaAr: detalhes?.sistemaAr || {},
      mecanismosAbertura: detalhes?.mecanismosAbertura || {},
      revestimentos: detalhes?.revestimentos || {},
      mobilias: detalhes?.mobilias || {},
      dadosExtra: detalhes?.dadosExtra || {},
    });
    setIsEditing(false);
  };

  // Renderizar uma pergunta individual
  const renderQuestion = (
    section: LaudoSection,
    question: LaudoQuestion,
    questionIndex: number,
    dataKey?: string,
    fields?: string[],
  ) => {
    // Se não recebeu dataKey, tenta buscar do mapeamento
    if (!dataKey) {
      const normalizedKey = normalizeSectionName(section.name);
      const mapping = SECTION_FIELD_MAP[normalizedKey];
      if (!mapping) return null;
      dataKey = mapping.dataKey;
      fields = mapping.fields;
    }

    const rawSectionData = detalhes?.[dataKey as keyof typeof detalhes];

    // Tentar buscar em dadosExtra se não encontrou no campo específico
    let finalSectionData = rawSectionData;
    if (
      !finalSectionData &&
      detalhes?.dadosExtra &&
      (detalhes.dadosExtra as any)[section.name]
    ) {
      finalSectionData = (detalhes.dadosExtra as any)[section.name];
    }

    // Tentar converter string JSON para objeto, se necessário
    let sectionData = finalSectionData;
    if (
      typeof finalSectionData === "string" &&
      finalSectionData.startsWith("{")
    ) {
      try {
        sectionData = JSON.parse(finalSectionData);
      } catch (e) {
        // Mantém como string se falhar
      }
    }

    // Determinar qual campo usar
    const fieldKey = fields ? fields[questionIndex] : null;

    // Tentar encontrar o valor usando várias estratégias
    let currentValue = null;

    if (sectionData) {
      // Estratégia 1: Legacy (mapeamento hardcoded por índice)
      if (fieldKey && (sectionData as any)[fieldKey] !== undefined) {
        currentValue = (sectionData as any)[fieldKey];
      }
      // Estratégia 2: Dinâmico por Texto da Pergunta (Nova App)
      else if (
        question.questionText &&
        (sectionData as any)[question.questionText] !== undefined
      ) {
        currentValue = (sectionData as any)[question.questionText];
      }
      // Estratégia 3: Dinâmico por ID da Pergunta (Futuro)
      else if (question.id && (sectionData as any)[question.id] !== undefined) {
        currentValue = (sectionData as any)[question.id];
      }
      // Estratégia 4: Seção sem campos definidos (Fallback para seções simples ou unificadas)
      else if (!fieldKey && typeof sectionData === "string") {
        // Caso raríssimo onde a seção inteira é uma string (ex: Atestado antigo)
        currentValue = sectionData;
      }
    }

    // Valor editado (mesma lógica de prioridade)
    let editedValue = null;
    const editedSection = editedValues[dataKey];
    if (editedSection) {
      if (fieldKey && editedSection[fieldKey] !== undefined)
        editedValue = editedSection[fieldKey];
      else if (
        question.questionText &&
        editedSection[question.questionText] !== undefined
      )
        editedValue = editedSection[question.questionText];
      else if (typeof editedSection === "string") editedValue = editedSection;
    }

    // Se ainda for null e estivermos editando, usa o valor atual como base (para não sumir o campo)
    if (editedValue === null && isEditing) {
      editedValue = currentValue;
    }

    // Não renderizar se não há valor e não está editando
    // user feedback: "deveria exibir a 'pergunta' ... nao apenas no modo de edicao"
    // if (!currentValue && !isEditing) return null;

    return (
      <div key={question.id} className="mb-3 last:mb-0">
        {/* Mostrar questionText apenas se existir */}
        {question.questionText && (
          <p className="text-xs text-gray-600 mb-1 font-medium">
            {question.questionText}
          </p>
        )}

        {/* Campo de valor */}
        {!isEditing ? (
          <p className="text-sm text-gray-700">
            {currentValue === null || currentValue === undefined
              ? "Não informado"
              : typeof currentValue === "object"
                ? JSON.stringify(currentValue)
                : String(currentValue)}
          </p>
        ) : question.options && question.options.length > 0 ? (
          <div className="flex flex-wrap gap-2 mt-2">
            {question.options.map((opt) => {
              const isSelected = editedValue === opt.optionText;
              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    const key =
                      fieldKey || question.questionText || question.id;
                    setEditedValues({
                      ...editedValues,
                      [dataKey]: {
                        ...(typeof editedValues[dataKey] === "object"
                          ? editedValues[dataKey]
                          : {}),
                        [key]: opt.optionText,
                      },
                    });
                  }}
                  className={`px-3 py-2 text-sm rounded-lg border transition-all text-left break-words max-w-full ${
                    isSelected
                      ? "bg-primary text-white border-primary shadow-sm"
                      : "bg-white text-gray-700 border-gray-200 hover:border-primary/50 hover:bg-gray-50"
                  }`}
                >
                  {opt.optionText}
                </button>
              );
            })}
            {/* Botão de Limpar Seleção (Opcional) */}
            {editedValue && (
              <button
                onClick={() => {
                  const key = fieldKey || question.questionText || question.id;
                  const newValue = {
                    ...(typeof editedValues[dataKey] === "object"
                      ? editedValues[dataKey]
                      : {}),
                  };
                  delete (newValue as any)[key];
                  setEditedValues({ ...editedValues, [dataKey]: newValue });
                }}
                className="px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                Limpar
              </button>
            )}
          </div>
        ) : (
          <input
            type="text"
            value={editedValue || ""}
            onChange={(e) => {
              const key = fieldKey || question.questionText || question.id;

              if (key) {
                setEditedValues({
                  ...editedValues,
                  [dataKey]: {
                    ...(typeof editedValues[dataKey] === "object"
                      ? editedValues[dataKey]
                      : {}),
                    [key]: e.target.value,
                  },
                });
              } else {
                setEditedValues({
                  ...editedValues,
                  [dataKey]: e.target.value,
                });
              }
            }}
            className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}
      </div>
    );
  };

  // Renderizar seção dinamicamente
  const renderSection = (section: LaudoSection, icon: string) => {
    const normalizedKey = normalizeSectionName(section.name);
    const mapping = SECTION_FIELD_MAP[normalizedKey];

    // Se não há mapeamento, tentar adivinhar pelo nome
    let dataKey = mapping?.dataKey;
    let fields = mapping?.fields;

    if (!dataKey) {
      // Usar a chave normalizada diretamente
      dataKey = normalizedKey;
      // Removido console.warn
    }

    const rawSectionData = detalhes?.[dataKey as keyof typeof detalhes];

    // Tentar buscar em dadosExtra se não encontrou no campo específico
    let finalSectionData = rawSectionData;
    if (
      !finalSectionData &&
      detalhes?.dadosExtra &&
      (detalhes.dadosExtra as any)[section.name]
    ) {
      finalSectionData = (detalhes.dadosExtra as any)[section.name];
    }

    // Tentar converter string JSON para objeto, se necessário
    let sectionData = finalSectionData;
    if (
      typeof finalSectionData === "string" &&
      finalSectionData.startsWith("{")
    ) {
      try {
        sectionData = JSON.parse(finalSectionData);
      } catch (e) {
        // Mantém como string se falhar
      }
    }

    // Verificar se há algum dado nesta seção
    const hasData =
      sectionData &&
      (typeof sectionData === "string"
        ? sectionData
        : Object.values(sectionData).some((v) => v));

    // SEMPRE renderizar seções que vêm do banco, mesmo sem dados
    // Apenas ocultar se não estiver editando E não tiver dados E não for uma seção dinâmica conhecida
    // Mas o requisito é "refletiu no app, mas não na web", então vamos ser permissivos:
    // Se a seção existe em availableSections, ela deve aparecer.

    // if (!hasData && !isEditing) return null; // REMOVED strict check

    return (
      <div
        key={section.id}
        className="bg-white rounded-lg p-4 border border-gray-200"
      >
        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <span>{icon}</span>
          {section.name}
        </h4>

        {/* Debug info - REMOVED per user request */}

        {/* Renderizar cada pergunta da seção */}
        {section.questions && section.questions.length > 0 ? (
          <div className="space-y-3">
            {section.questions.map((question, index) =>
              renderQuestion(section, question, index, dataKey, fields),
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Nenhuma pergunta configurada</p>
        )}
      </div>
    );
  };

  // Renderizar dados que não têm mais uma seção correspondente no Admin
  const renderLegacyData = () => {
    if (!detalhes) return null;

    // 1. Identificar quais dados já foram renderizados
    const renderedDataKeys = new Set();
    const renderedQuestionsInKeys: Record<string, Set<string>> = {};

    detalhes.availableSections?.forEach((section) => {
      const normalizedKey = normalizeSectionName(section.name);
      const mapping = SECTION_FIELD_MAP[normalizedKey];
      const dataKey = mapping?.dataKey || normalizedKey;
      renderedDataKeys.add(dataKey);

      if (!renderedQuestionsInKeys[dataKey])
        renderedQuestionsInKeys[dataKey] = new Set();
      section.questions?.forEach((q) => {
        if (q.questionText)
          renderedQuestionsInKeys[dataKey].add(q.questionText);
        renderedQuestionsInKeys[dataKey].add(q.id);
      });
      // Adicionar mapping.fields se existir
      mapping?.fields?.forEach((f) => renderedQuestionsInKeys[dataKey]?.add(f));
    });

    const orphanSections: any[] = [];

    // 2. Verificar dadosExtra
    if (detalhes.dadosExtra) {
      Object.entries(detalhes.dadosExtra).forEach(([sectionName, data]) => {
        if (!detalhes.availableSections?.some((s) => s.name === sectionName)) {
          // Se estiver editando e a chave foi removida de editedValues.dadosExtra, pular (deletado)
          if (
            isEditing &&
            editedValues.dadosExtra &&
            editedValues.dadosExtra[sectionName] === undefined
          ) {
            return;
          }
          orphanSections.push({
            title: sectionName,
            data,
            isExtra: true,
            dataKey: sectionName,
          });
        }
      });
    }

    // 3. Verificar colunas específicas para dados "esquecidos"
    const hardcodedKeys = Object.values(SECTION_FIELD_MAP).map(
      (m) => m.dataKey,
    );
    hardcodedKeys.forEach((key) => {
      const data = detalhes[key as keyof typeof detalhes];
      if (!data) return;

      if (!renderedDataKeys.has(key)) {
        // Se estiver editando e a coluna foi marcada como null, pular
        if (isEditing && editedValues[key] === null) return;
        orphanSections.push({
          title: `Coluna: ${key}`,
          data,
          isExtra: false,
          dataKey: key,
        });
      } else if (typeof data === "object") {
        // Se a coluna foi renderizada, mas contém chaves que não estão nas perguntas atuais
        const unusedFields: Record<string, any> = {};
        let hasUnused = false;
        Object.entries(data).forEach(([fKey, fValue]) => {
          if (!renderedQuestionsInKeys[key]?.has(fKey)) {
            unusedFields[fKey] = fValue;
            hasUnused = true;
          }
        });
        if (hasUnused) {
          orphanSections.push({
            title: `Campos Alterados (${key})`,
            data: unusedFields,
            isExtra: false,
            dataKey: key,
            partial: true,
          });
        }
      }
    });

    if (orphanSections.length === 0) return null;

    return (
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-sm font-bold text-gray-500 mb-4 flex items-center gap-2 uppercase tracking-wider">
          <span className="text-amber-500">⚠️</span> Dados Adicionais ou Legados
        </h3>
        <div className="space-y-4">
          {orphanSections.map((orphan, idx) => (
            <div
              key={idx}
              className="bg-amber-50/50 rounded-lg p-4 border border-amber-100/50"
            >
              <h4 className="text-xs font-bold text-amber-800 mb-3 flex items-center justify-between uppercase">
                <div className="flex items-center gap-2">
                  <span>📂</span> {orphan.title}
                </div>
                {isEditing && (
                  <button
                    onClick={() => {
                      if (orphan.isExtra) {
                        const newExtra = { ...(editedValues.dadosExtra || {}) };
                        delete newExtra[orphan.dataKey];
                        setEditedValues({
                          ...editedValues,
                          dadosExtra: newExtra,
                        });
                      } else {
                        setEditedValues({
                          ...editedValues,
                          [orphan.dataKey]: null,
                        });
                      }
                      toast.success(
                        `Seção "${orphan.title}" marcada para remoção.`,
                      );
                    }}
                    className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded hover:bg-red-200 transition-colors"
                  >
                    Remover Dados
                  </button>
                )}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {typeof orphan.data === "object" ? (
                  Object.entries(orphan.data).map(([k, v]: [string, any]) => {
                    let editedValue = v;
                    if (orphan.isExtra) {
                      editedValue =
                        editedValues.dadosExtra?.[orphan.dataKey]?.[k] ?? v;
                    } else {
                      editedValue = editedValues[orphan.dataKey]?.[k] ?? v;
                    }

                    return (
                      <div key={k} className="flex flex-col">
                        <span className="text-[10px] text-amber-600 font-bold uppercase mb-0.5">
                          {k}
                        </span>
                        {!isEditing ? (
                          <span className="text-sm text-gray-800">
                            {typeof editedValue === "object"
                              ? JSON.stringify(editedValue)
                              : String(editedValue)}
                          </span>
                        ) : (
                          <input
                            type="text"
                            maxLength={30}
                            value={String(editedValue || "")}
                            onChange={(e) => {
                              const newVal = e.target.value;
                              if (orphan.isExtra) {
                                setEditedValues({
                                  ...editedValues,
                                  dadosExtra: {
                                    ...(editedValues.dadosExtra || {}),
                                    [orphan.dataKey]: {
                                      ...(editedValues.dadosExtra?.[
                                        orphan.dataKey
                                      ] || orphan.data),
                                      [k]: newVal,
                                    },
                                  },
                                });
                              } else {
                                setEditedValues({
                                  ...editedValues,
                                  [orphan.dataKey]: {
                                    ...(editedValues[orphan.dataKey] ||
                                      orphan.data),
                                    [k]: newVal,
                                  },
                                });
                              }
                            }}
                            className="text-sm px-2 py-1 border border-amber-200 rounded focus:border-amber-500 outline-none bg-white/50"
                          />
                        )}
                      </div>
                    );
                  })
                ) : !isEditing ? (
                  <span className="text-sm text-gray-800">
                    {String(orphan.data)}
                  </span>
                ) : (
                  <input
                    type="text"
                    maxLength={30}
                    value={String(editedValues[orphan.dataKey] ?? orphan.data)}
                    onChange={(e) =>
                      setEditedValues({
                        ...editedValues,
                        [orphan.dataKey]: e.target.value,
                      })
                    }
                    className="text-sm px-2 py-1 border border-amber-200 rounded focus:border-amber-500 outline-none bg-white/50 w-full"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Ícones para cada seção (Unificado conforme solicitado)
  const getSectionIcon = (sectionName: string): string => {
    // "imagino que os emojis hojes existentes terao que ser trocados por um emoji igual pra todos"
    return "📋";
  };

  return (
    <div className="border-t border-gray-100 pt-4 mt-4">
      <button
        onClick={handleExpand}
        className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
        aria-expanded={isExpanded}
      >
        <motion.svg
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="w-5 h-5 text-primary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </motion.svg>
        <span>
          {isExpanded ? "Ocultar Detalhes" : "Ver Detalhes do Questionário"}
        </span>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-4 bg-gray-50 rounded-lg p-4">
              {loading && (
                <div className="text-sm text-gray-500">
                  Carregando detalhes...
                </div>
              )}
              {error && <div className="text-sm text-red-500">{error}</div>}
              {!loading && !error && detalhes && (
                <>
                  {/* Debug: mostrar quantas seções vieram do backend */}
                  {detalhes.availableSections && (
                    <div className="text-xs text-gray-400 mb-2">
                      📊 {detalhes.availableSections.length} seção(ões)
                      cadastrada(s):
                      {detalhes.availableSections.map((s) => s.name).join(", ")}
                    </div>
                  )}

                  {/* Botões de ação */}
                  <div className="flex justify-end gap-2 mb-4">
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        ✏️ Editar
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={handleCancel}
                          disabled={saving}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          {saving ? "Salvando..." : "💾 Salvar"}
                        </button>
                      </>
                    )}
                  </div>

                  {/* Renderizar seções dinamicamente */}
                  {detalhes.availableSections?.map((section) =>
                    renderSection(section, getSectionIcon(section.name)),
                  )}

                  {/* Renderizar dados órfãos ou legados */}
                  {renderLegacyData()}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
