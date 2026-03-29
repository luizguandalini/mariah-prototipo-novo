import { useState, useRef, useCallback } from 'react'
import Button from '../ui/Button'
import { laudosService } from '../../services/laudos'
import { toast } from 'sonner'
import { Upload, Trash2, Loader2, Image, CheckCircle, AlertCircle, FolderOpen } from 'lucide-react'

interface AmbienteFolder {
  id: string
  tipoAmbiente: string
  nomeAmbiente: string
  ordem: number
}

interface ImageFile {
  file: File
  preview: string
  status: 'pending' | 'uploading' | 'done' | 'error'
  progress: number
  s3Key?: string
  imagemId?: string
  errorMessage?: string
  item?: string
}

interface Step3Props {
  onNext: (data: any) => void
  onBack: () => void
  ambientes: AmbienteFolder[]
  laudoId: string
}

const MAX_IMAGES_PER_BATCH = 50
const MAX_FILE_SIZE_MB = 15

export default function Step3Upload({ onNext, onBack, ambientes, laudoId }: Step3Props) {
  const [ambienteAtual, setAmbienteAtual] = useState(0)
  const [imagesByAmbiente, setImagesByAmbiente] = useState<Record<string, ImageFile[]>>({})
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 })
  const [modoIA, setModoIA] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentAmbiente = ambientes[ambienteAtual]
  const currentImages = imagesByAmbiente[currentAmbiente?.id] || []

  const totalImages = Object.values(imagesByAmbiente).reduce((acc, imgs) => acc + imgs.length, 0)
  const totalUploaded = Object.values(imagesByAmbiente)
    .flat()
    .filter(img => img.status === 'done').length

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const ambienteId = currentAmbiente.id
    const existingCount = currentImages.length

    if (existingCount + files.length > MAX_IMAGES_PER_BATCH) {
      toast.error(`Máximo de ${MAX_IMAGES_PER_BATCH} imagens por ambiente. Você tem ${existingCount} e está tentando adicionar ${files.length}.`)
      return
    }

    const newImages: ImageFile[] = []
    for (const file of Array.from(files)) {
      // Validar tamanho
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast.warning(`"${file.name}" excede ${MAX_FILE_SIZE_MB}MB e foi ignorado`)
        continue
      }

      // Validar tipo
      if (!file.type.startsWith('image/')) {
        toast.warning(`"${file.name}" não é uma imagem válida`)
        continue
      }

      newImages.push({
        file,
        preview: URL.createObjectURL(file),
        status: 'pending',
        progress: 0,
      })
    }

    setImagesByAmbiente(prev => ({
      ...prev,
      [ambienteId]: [...(prev[ambienteId] || []), ...newImages],
    }))
  }

  const removeImage = (ambienteId: string, index: number) => {
    setImagesByAmbiente(prev => {
      const images = [...(prev[ambienteId] || [])]
      // Revogar URL para liberar memória
      URL.revokeObjectURL(images[index].preview)
      images.splice(index, 1)
      return { ...prev, [ambienteId]: images }
    })
  }

  const uploadAllImages = useCallback(async () => {
    if (totalImages === 0) {
      toast.error('Adicione pelo menos uma imagem antes de prosseguir')
      return
    }

    // Verificar créditos
    try {
      const limitCheck = await laudosService.checkUploadLimit(totalImages - totalUploaded)
      if (!limitCheck.canUpload) {
        toast.error(limitCheck.message || 'Limite de imagens esgotado')
        return
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao verificar créditos')
      return
    }

    setUploading(true)
    let uploaded = 0
    const pending = Object.values(imagesByAmbiente).flat().filter(img => img.status !== 'done').length
    setUploadProgress({ current: 0, total: pending })

    for (const ambiente of ambientes) {
      const images = imagesByAmbiente[ambiente.id] || []

      for (let i = 0; i < images.length; i++) {
        const img = images[i]
        if (img.status === 'done') continue

        try {
          // Marcar como uploading
          updateImageStatus(ambiente.id, i, 'uploading', 50)

          // 1. Presigned URL
          const { uploadUrl, s3Key } = await laudosService.getPresignedUrl(
            laudoId,
            img.file.name
          )

          updateImageStatus(ambiente.id, i, 'uploading', 70)

          // 2. Upload para S3
          const uploadResp = await fetch(uploadUrl, {
            method: 'PUT',
            body: img.file,
            headers: { 'Content-Type': 'image/jpeg' },
          })

          if (!uploadResp.ok) {
            throw new Error('Falha no upload para S3')
          }

          updateImageStatus(ambiente.id, i, 'uploading', 80)

          let itemName = 'Não identificado'
          if (modoIA) {
            try {
              const aiResp = await laudosService.classifyWebItem(s3Key, ambiente.tipoAmbiente)
              if (aiResp.success) {
                itemName = aiResp.item
              }
            } catch (err) {
              console.error('Erro na classificação IA:', err)
            }
          }

          updateImageStatus(ambiente.id, i, 'uploading', 90)

          // 3. Confirmar no backend com metadados
          const confirmResult = await laudosService.confirmWebUpload({
            laudoId,
            s3Key,
            ambiente: ambiente.nomeAmbiente,
            tipoAmbiente: ambiente.tipoAmbiente,
            tipo: itemName,
            categoria: 'VISTORIA',
            ordem: i,
          })

          // Sucesso
          updateImageStatus(ambiente.id, i, 'done', 100, s3Key, confirmResult.imagem?.id, undefined, itemName)
          uploaded++
          setUploadProgress(prev => ({ ...prev, current: prev.current + 1 }))
        } catch (err: any) {
          console.error(`Erro ao upload imagem ${i}:`, err)
          updateImageStatus(ambiente.id, i, 'error', 0, undefined, undefined, err.message)
        }
      }
    }

    setUploading(false)

    if (uploaded > 0) {
      toast.success(`${uploaded} imagens enviadas com sucesso!`)
    }
  }, [imagesByAmbiente, ambientes, laudoId, totalImages, totalUploaded])

  const updateImageStatus = (
    ambienteId: string,
    index: number,
    status: ImageFile['status'],
    progress: number,
    s3Key?: string,
    imagemId?: string,
    errorMessage?: string,
    item?: string,
  ) => {
    setImagesByAmbiente(prev => {
      const images = [...(prev[ambienteId] || [])]
      if (images[index]) {
        images[index] = {
          ...images[index],
          status,
          progress,
          ...(s3Key && { s3Key }),
          ...(imagemId && { imagemId }),
          ...(errorMessage && { errorMessage }),
          ...(item && { item }),
        }
      }
      return { ...prev, [ambienteId]: images }
    })
  }

  const handleNext = () => {
    const allDone = Object.values(imagesByAmbiente)
      .flat()
      .every(img => img.status === 'done')

    if (totalImages > 0 && !allDone) {
      toast.error('Ainda há imagens pendentes de upload. Clique em "Enviar Todas" primeiro.')
      return
    }

    onNext({
      uploadedImages: imagesByAmbiente,
      totalImagesUploaded: totalUploaded,
    })
  }

  const getAmbienteStats = (ambienteId: string) => {
    const images = imagesByAmbiente[ambienteId] || []
    const done = images.filter(i => i.status === 'done').length
    const errors = images.filter(i => i.status === 'error').length
    return { total: images.length, done, errors }
  }

  return (
    <div className="bg-[var(--bg-secondary)] rounded-xl shadow-sm border border-[var(--border-color)] p-6 transition-all">
      <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Upload de Imagens</h3>
      <p className="text-[var(--text-secondary)] mb-4">
        Selecione imagens para cada ambiente. Máximo de {MAX_IMAGES_PER_BATCH} por ambiente, {MAX_FILE_SIZE_MB}MB por imagem.
      </p>

      {/* Tabs dos ambientes */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {ambientes.map((ambiente, index) => {
          const stats = getAmbienteStats(ambiente.id)
          return (
            <button
              key={ambiente.id}
              type="button"
              onClick={() => setAmbienteAtual(index)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                ambienteAtual === index
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] border border-[var(--border-color)]'
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              {ambiente.nomeAmbiente}
              {stats.total > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                  stats.done === stats.total && stats.total > 0
                    ? 'bg-green-500/20 text-green-500'
                    : stats.errors > 0
                      ? 'bg-red-500/20 text-red-500'
                      : 'bg-white/20'
                }`}>
                  {stats.done}/{stats.total}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Switch IA/Manual */}
      <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4">
        <div>
          <h4 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
            🤖 Inteligência Artificial
          </h4>
          <p className="text-sm text-[var(--text-secondary)]">
            Identificar automaticamente os itens das fotos (consome créditos web).
          </p>
        </div>
        <button
          onClick={() => setModoIA(!modoIA)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${modoIA ? 'bg-primary' : 'bg-gray-400'}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${modoIA ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      {/* Upload Area */}
      <div
        className="border-2 border-dashed border-[var(--border-color)] bg-[var(--bg-primary)] rounded-lg p-8 text-center mb-4 hover:border-primary transition-colors cursor-pointer group"
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
        <Upload className="w-12 h-12 mx-auto mb-3 text-[var(--text-secondary)] group-hover:text-primary group-hover:scale-110 transition-all" />
        <p className="text-lg font-medium text-[var(--text-primary)] mb-1">
          Clique para selecionar imagens
        </p>
        <p className="text-sm text-[var(--text-secondary)]">
          Ambiente: <strong className="text-primary">{currentAmbiente?.nomeAmbiente}</strong> ({currentAmbiente?.tipoAmbiente})
        </p>
      </div>

      {/* Imagens do ambiente atual */}
      {currentImages.length > 0 && (
        <div className="mb-4">
          <h4 className="font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
            <Image className="w-4 h-4" />
            Imagens — {currentAmbiente?.nomeAmbiente} ({currentImages.length})
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {currentImages.map((img, index) => (
              <div key={index} className="relative group rounded-lg overflow-hidden border border-[var(--border-color)]">
                <img
                  src={img.preview}
                  alt={`Imagem ${index + 1}`}
                  className="w-full h-28 object-cover"
                />

                {/* Status overlay */}
                {img.status === 'uploading' && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="w-6 h-6 animate-spin text-white mx-auto" />
                      <span className="text-white text-xs mt-1 block">{img.progress}%</span>
                    </div>
                  </div>
                )}
                {img.status === 'done' && (
                  <div className="absolute top-2 right-2 bg-white/90 rounded-full p-1" title={img.item}>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                )}
                {img.status === 'done' && img.item && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] p-1 truncate text-center">
                    {img.item}
                  </div>
                )}
                
                {img.status === 'error' && (
                  <div className="absolute top-1 left-1" title={img.errorMessage}>
                    <AlertCircle className="w-5 h-5 text-red-500 drop-shadow-lg" />
                  </div>
                )}

                {/* Número */}
                <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                  #{index + 1}
                </div>

                {/* Remover */}
                {img.status !== 'uploading' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); removeImage(currentAmbiente.id, index) }}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                    title="Remover"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress bar geral */}
      {uploading && (
        <div className="mb-4 p-3 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-color)]">
          <div className="flex justify-between text-sm mb-2 text-[var(--text-secondary)]">
            <span>Enviando imagens...</span>
            <span>{uploadProgress.current}/{uploadProgress.total}</span>
          </div>
          <div className="h-2.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
              style={{ width: `${uploadProgress.total > 0 ? (uploadProgress.current / uploadProgress.total) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Resumo total */}
      {totalImages > 0 && (
        <div className="mb-4 p-3 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-color)] text-sm text-[var(--text-secondary)]">
          <strong>Total:</strong> {totalImages} imagens em {Object.keys(imagesByAmbiente).filter(k => (imagesByAmbiente[k]?.length || 0) > 0).length} ambientes
          {totalUploaded > 0 && <span className="ml-2 text-green-500">({totalUploaded} enviadas ✅)</span>}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-[var(--border-color)]">
        <Button variant="outline" size="lg" onClick={onBack} disabled={uploading}>
          ← Voltar
        </Button>
        <div className="flex gap-3">
          {totalImages > 0 && totalUploaded < totalImages && (
            <Button
              variant="primary"
              size="lg"
              onClick={uploadAllImages}
              disabled={uploading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Enviar Todas ({totalImages - totalUploaded})
                </>
              )}
            </Button>
          )}
          <Button
            variant="primary"
            size="lg"
            onClick={handleNext}
            disabled={uploading || totalImages === 0}
          >
            Próximo: Revisão →
          </Button>
        </div>
      </div>
    </div>
  )
}
