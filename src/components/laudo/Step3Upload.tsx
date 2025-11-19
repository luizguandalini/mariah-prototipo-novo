import { useState } from 'react'
import Button from '../ui/Button'

interface Step3Props {
  onNext: (data: any) => void
  onBack: () => void
  ambientes: any[]
}

export default function Step3Upload({ onNext, onBack, ambientes }: Step3Props) {
  const [ambienteAtual, setAmbienteAtual] = useState(0)
  const [uploadedImages, setUploadedImages] = useState<{[key: string]: string[]}>({})

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const ambienteId = ambientes[ambienteAtual].id
      const urls = Array.from(files).map(file => URL.createObjectURL(file))
      setUploadedImages({
        ...uploadedImages,
        [ambienteId]: [...(uploadedImages[ambienteId] || []), ...urls]
      })
    }
  }

  const handleRemoveImage = (ambienteId: string, index: number) => {
    setUploadedImages({
      ...uploadedImages,
      [ambienteId]: uploadedImages[ambienteId].filter((_, i) => i !== index)
    })
  }

  const handleNext = () => {
    if (ambienteAtual < ambientes.length - 1) {
      setAmbienteAtual(ambienteAtual + 1)
    } else {
      onNext({ uploadedImages })
    }
  }

  const currentAmbiente = ambientes[ambienteAtual]
  const currentImages = uploadedImages[currentAmbiente?.id] || []

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-2xl font-bold text-gray-900 mb-2">Upload de Imagens</h3>
      <p className="text-gray-600 mb-6">
        Ambiente {ambienteAtual + 1} de {ambientes.length}: <strong>{currentAmbiente?.nome}</strong>
      </p>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progresso</span>
          <span>{ambienteAtual + 1}/{ambientes.length}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${((ambienteAtual + 1) / ambientes.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6 hover:border-primary transition-colors">
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <div className="text-5xl mb-4">📸</div>
          <p className="text-lg font-medium text-gray-900 mb-2">
            Clique para selecionar imagens
          </p>
          <p className="text-sm text-gray-500">
            Você pode selecionar múltiplas imagens de uma vez. Sem limite de quantidade.
          </p>
        </label>
      </div>

      {/* Uploaded Images */}
      {currentImages.length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">
            Imagens Adicionadas ({currentImages.length})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {currentImages.map((url, index) => (
              <div key={index} className="relative group">
                <img
                  src={url}
                  alt={`Imagem ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                />
                <button
                  onClick={() => handleRemoveImage(currentAmbiente.id, index)}
                  className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
                <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  #{index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <Button variant="outline" size="lg" onClick={onBack}>
          ← Voltar
        </Button>
        <div className="flex gap-3">
          {ambienteAtual > 0 && (
            <Button variant="outline" size="lg" onClick={() => setAmbienteAtual(ambienteAtual - 1)}>
              ← Ambiente Anterior
            </Button>
          )}
          <Button variant="primary" size="lg" onClick={handleNext}>
            {ambienteAtual < ambientes.length - 1 ? 'Próximo Ambiente →' : 'Finalizar Upload →'}
          </Button>
        </div>
      </div>
    </div>
  )
}
