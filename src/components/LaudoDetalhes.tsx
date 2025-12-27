import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Laudo } from "../services/laudos";
import { laudosService } from "../services/laudos";

interface LaudoDetalhesProps {
  laudo: Laudo;
}

export default function LaudoDetalhes({ laudo }: LaudoDetalhesProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [detalhes, setDetalhes] = useState<Partial<Laudo> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Só exibe botão se incluirAtestado === 1
  if (laudo.incluirAtestado !== 1) {
    return null;
  }

  const handleExpand = async () => {
    if (!isExpanded && !detalhes && !loading) {
      setLoading(true);
      setError(null);
      try {
        const data = await laudosService.getLaudoDetalhes(laudo.id);
        setDetalhes(data);
      } catch (err: any) {
        setError("Erro ao carregar detalhes do laudo.");
      } finally {
        setLoading(false);
      }
    }
    setIsExpanded((prev) => !prev);
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
                  {/* Atestado */}
                  {detalhes.atestado && (
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <span>📋</span>
                        Atestado da Vistoria
                      </h4>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {detalhes.atestado}
                      </p>
                    </div>
                  )}

                  {/* Análises Hidráulicas */}
                  {detalhes.analisesHidraulicas && (
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <span>💧</span>
                        Análises Hidráulicas
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <span className="text-xs text-gray-500 block mb-1">
                            Fluxo de Água
                          </span>
                          <span className="text-sm text-gray-900">
                            {detalhes.analisesHidraulicas.fluxo_agua}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 block mb-1">
                            Vazamentos
                          </span>
                          <span className="text-sm text-gray-900">
                            {detalhes.analisesHidraulicas.vazamentos}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Análises Elétricas */}
                  {detalhes.analisesEletricas && (
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <span>⚡</span>
                        Análises Elétricas
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <span className="text-xs text-gray-500 block mb-1">
                            Funcionamento
                          </span>
                          <span className="text-sm text-gray-900">
                            {detalhes.analisesEletricas.funcionamento}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 block mb-1">
                            Disjuntores
                          </span>
                          <span className="text-sm text-gray-900">
                            {detalhes.analisesEletricas.disjuntores}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sistema de Ar */}
                  {detalhes.sistemaAr && (
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <span>❄️</span>
                        Sistema de Ar
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <span className="text-xs text-gray-500 block mb-1">
                            Ar Condicionado
                          </span>
                          <span className="text-sm text-gray-900">
                            {detalhes.sistemaAr.ar_condicionado}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 block mb-1">
                            Aquecimento
                          </span>
                          <span className="text-sm text-gray-900">
                            {detalhes.sistemaAr.aquecimento}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mecanismos de Abertura */}
                  {detalhes.mecanismosAbertura && (
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <span>🚪</span>
                        Mecanismos de Abertura
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <span className="text-xs text-gray-500 block mb-1">
                            Portas
                          </span>
                          <span className="text-sm text-gray-900">
                            {detalhes.mecanismosAbertura.portas}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 block mb-1">
                            Maçanetas
                          </span>
                          <span className="text-sm text-gray-900">
                            {detalhes.mecanismosAbertura.macanetas}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 block mb-1">
                            Janelas
                          </span>
                          <span className="text-sm text-gray-900">
                            {detalhes.mecanismosAbertura.janelas}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Revestimentos */}
                  {detalhes.revestimentos && (
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <span>🎨</span>
                        Revestimentos
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <span className="text-xs text-gray-500 block mb-1">
                            Tetos
                          </span>
                          <span className="text-sm text-gray-900">
                            {detalhes.revestimentos.tetos}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 block mb-1">
                            Pisos
                          </span>
                          <span className="text-sm text-gray-900">
                            {detalhes.revestimentos.pisos}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 block mb-1">
                            Bancadas
                          </span>
                          <span className="text-sm text-gray-900">
                            {detalhes.revestimentos.bancadas}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mobílias */}
                  {detalhes.mobilias && (
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <span>🪑</span>
                        Mobílias
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <span className="text-xs text-gray-500 block mb-1">
                            Mobília Fixa
                          </span>
                          <span className="text-sm text-gray-900">
                            {detalhes.mobilias.fixa}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 block mb-1">
                            Mobília Não Fixa
                          </span>
                          <span className="text-sm text-gray-900">
                            {detalhes.mobilias.nao_fixa}
                          </span>
                        </div>
                      </div>
                    </div>
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
