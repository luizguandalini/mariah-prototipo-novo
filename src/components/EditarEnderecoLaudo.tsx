import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import type { Laudo } from "../services/laudos";
import { laudosService } from "../services/laudos";
import { viaCepService } from "../services/viacep";
import { useViaCep } from "../hooks/useViaCep";

interface EditarEnderecoLaudoProps {
  laudo: Laudo;
  onClose: () => void;
  onSuccess: (laudoAtualizado: Laudo) => void;
}

export default function EditarEnderecoLaudo({
  laudo,
  onClose,
  onSuccess,
}: EditarEnderecoLaudoProps) {
  const [formData, setFormData] = useState({
    cep: laudo.cep || "",
    rua: laudo.rua || "",
    numero: laudo.numero || "",
    complemento: laudo.complemento || "",
    bairro: laudo.bairro || "",
    cidade: laudo.cidade || "",
    estado: laudo.estado || "",
  });

  const [saving, setSaving] = useState(false);
  const { endereco, loading: loadingCep, error: errorCep, consultarCEP } = useViaCep();

  // Aplicar máscara ao CEP enquanto digita
  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value.replace(/\D/g, "");
    
    // Limitar a 8 dígitos
    if (valor.length > 8) {
      valor = valor.substring(0, 8);
    }

    // Aplicar máscara
    if (valor.length > 5) {
      valor = `${valor.substring(0, 5)}-${valor.substring(5)}`;
    }

    setFormData({ ...formData, cep: valor });

    // Consultar ViaCEP quando tiver 8 dígitos
    const cepLimpo = valor.replace(/\D/g, "");
    if (cepLimpo.length === 8) {
      consultarCEP(cepLimpo);
    }
  };

  // Preencher campos automaticamente quando ViaCEP retornar
  useEffect(() => {
    if (endereco) {
      setFormData((prev) => ({
        ...prev,
        // Atualizar com dados do ViaCEP (sobrescreve valores anteriores)
        rua: endereco.rua || prev.rua,
        complemento: endereco.complemento || prev.complemento,
        bairro: endereco.bairro || prev.bairro,
        cidade: endereco.cidade || prev.cidade,
        estado: endereco.estado || prev.estado,
        // Número NÃO é atualizado (é específico do usuário)
      }));
      
      toast.success("Endereço encontrado!");
    }
  }, [endereco]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação básica
    if (!formData.cep || !formData.rua || !formData.cidade) {
      toast.error("CEP, Rua e Cidade são obrigatórios");
      return;
    }

    setSaving(true);
    try {
      const laudoAtualizado = await laudosService.updateLaudoEndereco(
        laudo.id,
        formData
      );
      toast.success("Endereço atualizado com sucesso!");
      onSuccess(laudoAtualizado);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar endereço");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                ✏️ Editar Endereço
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* CEP */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CEP <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.cep}
                  onChange={handleCepChange}
                  placeholder="00000-000"
                  maxLength={9}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {loadingCep && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                  </div>
                )}
              </div>
              {errorCep && (
                <p className="text-xs text-red-500 mt-1">{errorCep}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Digite o CEP e os campos serão preenchidos automaticamente
              </p>
            </div>

            {/* Rua */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rua/Avenida <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.rua}
                onChange={(e) =>
                  setFormData({ ...formData, rua: e.target.value })
                }
                placeholder="Nome da rua"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Número e Complemento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número
                </label>
                <input
                  type="text"
                  value={formData.numero}
                  onChange={(e) =>
                    setFormData({ ...formData, numero: e.target.value })
                  }
                  placeholder="123"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Complemento
                </label>
                <input
                  type="text"
                  value={formData.complemento}
                  onChange={(e) =>
                    setFormData({ ...formData, complemento: e.target.value })
                  }
                  placeholder="Apto, Bloco, etc"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Bairro */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bairro
              </label>
              <input
                type="text"
                value={formData.bairro}
                onChange={(e) =>
                  setFormData({ ...formData, bairro: e.target.value })
                }
                placeholder="Nome do bairro"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Cidade e Estado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cidade <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.cidade}
                  onChange={(e) =>
                    setFormData({ ...formData, cidade: e.target.value })
                  }
                  placeholder="Nome da cidade"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado (UF)
                </label>
                <input
                  type="text"
                  value={formData.estado}
                  onChange={(e) =>
                    setFormData({ ...formData, estado: e.target.value.toUpperCase() })
                  }
                  placeholder="SP"
                  maxLength={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                />
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || loadingCep}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Salvando...
                  </>
                ) : (
                  <>💾 Salvar</>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
