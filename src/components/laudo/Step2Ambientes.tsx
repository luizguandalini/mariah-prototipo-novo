import { useState } from 'react'
import Button from '../ui/Button'

interface Step2Props {
  onNext: (data: any) => void
  onBack: () => void
  initialData?: any[]
}

export default function Step2Ambientes({ onNext, onBack, initialData = [] }: Step2Props) {
  const [ambientes, setAmbientes] = useState<string[]>(
    initialData.length > 0 ? initialData : ['Sala', 'Cozinha']
  )
  const [novoAmbiente, setNovoAmbiente] = useState('')

  const handleAddAmbiente = () => {
    if (novoAmbiente.trim()) {
      setAmbientes([...ambientes, novoAmbiente.trim()])
      setNovoAmbiente('')
    }
  }

  const handleRemoveAmbiente = (index: number) => {
    setAmbientes(ambientes.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onNext({ ambientes: ambientes.map((nome, index) => ({ id: `amb-${index}`, nome, imagens: [], ordem: index })) })
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-2xl font-bold text-gray-900 mb-2">Ambientes do Imóvel</h3>
      <p className="text-gray-600 mb-6">
        Adicione todos os ambientes que farão parte da vistoria
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Input para adicionar ambiente */}
        <div className="flex gap-3">
          <input
            type="text"
            value={novoAmbiente}
            onChange={(e) => setNovoAmbiente(e.target.value)}
            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none transition-colors"
            placeholder="Digite o nome do ambiente (ex: Sala, Cozinha, Quarto 1...)"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAmbiente())}
          />
          <Button
            type="button"
            variant="primary"
            onClick={handleAddAmbiente}
            disabled={!novoAmbiente.trim()}
          >
            ➕ Adicionar
          </Button>
        </div>

        {/* Lista de ambientes */}
        {ambientes.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900">Ambientes Adicionados ({ambientes.length})</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ambientes.map((ambiente, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between px-4 py-3 bg-purple-50 border-2 border-purple-200 rounded-lg"
                >
                  <span className="font-medium text-gray-900">🏠 {ambiente}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAmbiente(index)}
                    className="text-red-600 hover:text-red-700 font-semibold"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {ambientes.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Nenhum ambiente adicionado ainda</p>
            <p className="text-sm text-gray-400 mt-1">Adicione pelo menos um ambiente para continuar</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-between pt-6 border-t border-gray-200">
          <Button type="button" variant="outline" size="lg" onClick={onBack}>
            ← Voltar
          </Button>
          <Button type="submit" variant="primary" size="lg" disabled={ambientes.length === 0}>
            Próximo: Upload de Imagens →
          </Button>
        </div>
      </form>
    </div>
  )
}
