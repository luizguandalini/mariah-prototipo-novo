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
const SECTION_FIELD_MAP: Record<string, { dataKey: string; fields?: string[] }> = {
  [normalizeSectionName("Atestado da vistoria")]: { dataKey: "atestado" },
  [normalizeSectionName("Análises Hidráulicas")]: { dataKey: "analisesHidraulicas", fields: ["fluxo_agua", "vazamentos"] },
  [normalizeSectionName("Análises Elétricas")]: { dataKey: "analisesEletricas", fields: ["funcionamento", "disjuntores"] },
  [normalizeSectionName("Sistema de ar")]: { dataKey: "sistemaAr", fields: ["ar_condicionado", "aquecimento"] },
  [normalizeSectionName("Mecanismos de abertura")]: { dataKey: "mecanismosAbertura", fields: ["portas", "macanetas", "janelas"] },
  [normalizeSectionName("Revestimentos")]: { dataKey: "revestimentos", fields: ["tetos", "pisos", "bancadas"] },
  [normalizeSectionName("Mobilias")]: { dataKey: "mobilias", fields: ["fixa", "nao_fixa"] },
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

  // Só exibe botão se incluirAtestado === 1
  if (laudo.incluirAtestado !== 1) {
    return null;
  }

  const handleExpand = async () => {
    if (!isExpanded && !detalhes && !loading) {
      setLoading(true);
      setError(null);
      try {
        const data = await laudosService.getLaudoDetalhes(laudo.id) as DetailedLaudoResponse;
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
    try {
      await laudosService.updateLaudoDetalhes(laudo.id, editedValues);
      
      // Atualizar os detalhes locais
      setDetalhes({
        ...detalhes,
        ...editedValues,
      });
      
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
    });
    setIsEditing(false);
  };

  // Renderizar uma pergunta individual
  const renderQuestion = (
    section: LaudoSection,
    question: LaudoQuestion,
    questionIndex: number,
    dataKey?: string,
    fields?: string[]
  ) => {
    // Se não recebeu dataKey, tenta buscar do mapeamento
    if (!dataKey) {
      const normalizedKey = normalizeSectionName(section.name);
      const mapping = SECTION_FIELD_MAP[normalizedKey];
      if (!mapping) return null;
      dataKey = mapping.dataKey;
      fields = mapping.fields;
    }

    const sectionData = detalhes?.[dataKey as keyof typeof detalhes];

    // Determinar qual campo usar baseado no índice da pergunta
    const fieldKey = fields ? fields[questionIndex] : null;
    
    // Valor atual
    const currentValue = fieldKey 
      ? (sectionData as any)?.[fieldKey]
      : sectionData;

    // Valor editado
    const editedValue = fieldKey
      ? editedValues[dataKey]?.[fieldKey]
      : editedValues[dataKey];

    // Não renderizar se não há valor e não está editando
    if (!currentValue && !isEditing) return null;

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
            {/* Garantir que sempre renderiza string */}
            {typeof currentValue === 'object' 
              ? JSON.stringify(currentValue) 
              : (currentValue || "Não informado")}
          </p>
        ) : (
          question.options && question.options.length > 0 ? (
            <select
              value={editedValue || ""}
              onChange={(e) => {
                if (fieldKey) {
                  setEditedValues({
                    ...editedValues,
                    [dataKey]: {
                      ...editedValues[dataKey],
                      [fieldKey]: e.target.value
                    }
                  });
                } else {
                  setEditedValues({
                    ...editedValues,
                    [dataKey]: e.target.value
                  });
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione uma opção</option>
              {question.options.map((opt) => (
                <option key={opt.id} value={opt.optionText}>
                  {opt.optionText}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={editedValue || ""}
              onChange={(e) => {
                if (fieldKey) {
                  setEditedValues({
                    ...editedValues,
                    [dataKey]: {
                      ...editedValues[dataKey],
                      [fieldKey]: e.target.value
                    }
                  });
                } else {
                  setEditedValues({
                    ...editedValues,
                    [dataKey]: e.target.value
                  });
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )
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
      console.warn(`Seção "${section.name}" não mapeada, usando chave: ${dataKey}`);
    }

    const sectionData = detalhes?.[dataKey as keyof typeof detalhes];
    
    // Verificar se há algum dado nesta seção
    const hasData = sectionData && (
      typeof sectionData === 'string' ? sectionData : Object.values(sectionData).some(v => v)
    );

    // SEMPRE renderizar seções que vêm do banco, mesmo sem dados no modo edição
    if (!hasData && !isEditing) return null;

    return (
      <div key={section.id} className="bg-white rounded-lg p-4 border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <span>{icon}</span>
          {section.name}
        </h4>

        {/* Debug info */}
        {!mapping && (
          <p className="text-xs text-orange-500 mb-2">
            ⚠️ Mapeamento automático: usando chave "{dataKey}"
          </p>
        )}

        {/* Renderizar cada pergunta da seção */}
        {section.questions && section.questions.length > 0 ? (
          <div className="space-y-3">
            {section.questions.map((question, index) => 
              renderQuestion(section, question, index, dataKey, fields)
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Nenhuma pergunta configurada</p>
        )}
      </div>
    );
  };

  // Ícones para cada seção (com fallback)
  const getSectionIcon = (sectionName: string): string => {
    const icons: Record<string, string> = {
      "Atestado da vistoria": "📋",
      "Análises Hidráulicas": "💧",
      "Análises Elétricas": "⚡",
      "Sistema de ar": "❄️",
      "Mecanismos de abertura": "🚪",
      "Revestimentos": "🎨",
      "Mobílias": "🪑",
    };
    return icons[sectionName] || "📄";
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
                      📊 {detalhes.availableSections.length} seção(ões) cadastrada(s): 
                      {detalhes.availableSections.map(s => s.name).join(", ")}
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
                    renderSection(section, getSectionIcon(section.name))
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
