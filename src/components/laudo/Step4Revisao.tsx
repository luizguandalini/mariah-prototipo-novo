import { useState } from 'react'
import Button from '../ui/Button'
import { queueService } from '../../services/queue'
import { toast } from 'sonner'
import { CheckCircle, MapPin, FolderOpen, Image, Bot, Loader2, Rocket, AlertCircle } from 'lucide-react'

interface Step4Props {
  onSubmit: (data?: any) => void
  onBack: () => void
  laudoData: any
}

export default function Step4Revisao({ onSubmit, onBack, laudoData }: Step4Props) {
  const [confirmacoes, setConfirmacoes] = useState({
    dadosCorretos: false,
    ambientesCorretos: false,
    imagensCorretas: false,
  })
  const [iniciandoAnalise, setIniciandoAnalise] = useState(false)

  const info = laudoData.vistoriaInfo || {}
  const ambientes = laudoData.ambientes || []
  const uploadedImages = laudoData.uploadedImages || {}
  const totalImagesUploaded = laudoData.totalImagesUploaded || 0
  const laudoId = laudoData.laudoId

  const unidentifiedCount = Object.values(uploadedImages)
    .flat()
    .filter((img: any) => img.item === 'Não identificado' || !img.item).length

  const podeSubmeter = confirmacoes.dadosCorretos && confirmacoes.ambientesCorretos && confirmacoes.imagensCorretas
  const canAnalyzeIA = podeSubmeter && unidentifiedCount === 0 && !iniciandoAnalise

  const handleIniciarAnalise = async () => {
    if (!laudoId) {
      toast.error('Laudo não encontrado')
      return
    }

    try {
      setIniciandoAnalise(true)
      await queueService.addToQueue(laudoId)
      toast.success('Laudo adicionado à fila de análise! 🎉')
      onSubmit()
    } catch (err: any) {
      if (err.message?.includes('já possui todas as imagens analisadas')) {
        toast.success('Este laudo já foi totalmente analisado!')
        onSubmit()
      } else {
        toast.error(err.message || 'Erro ao iniciar análise')
      }
    } finally {
      setIniciandoAnalise(false)
    }
  }

  return (
    <div className="bg-[var(--bg-secondary)] rounded-xl shadow-sm border border-[var(--border-color)] p-6 transition-all">
      <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Revisão e Finalização</h3>
      <p className="text-[var(--text-secondary)] text-sm mb-6">
        Confira os dados do laudo antes de finalizar.
      </p>

      {/* Resumo do Laudo */}
      <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-6 mb-6">
        <h4 className="font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-primary" />
          Resumo do Laudo
        </h4>

        <div className="space-y-4">
          {/* Classificação */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="p-3 bg-[var(--bg-secondary)] rounded-lg">
              <span className="text-[var(--text-secondary)] text-xs block mb-1">Tipo Vistoria</span>
              <strong className="text-[var(--text-primary)]">
                {info.tipoVistoria === 'ENTRADA' ? '📋 Entrada' : info.tipoVistoria === 'SAIDA' ? '📋 Saída' : info.tipoVistoria || 'N/A'}
              </strong>
            </div>
            <div className="p-3 bg-[var(--bg-secondary)] rounded-lg">
              <span className="text-[var(--text-secondary)] text-xs block mb-1">Tipo Uso</span>
              <strong className="text-[var(--text-primary)]">🏢 {info.tipoUso || 'N/A'}</strong>
            </div>
            <div className="p-3 bg-[var(--bg-secondary)] rounded-lg">
              <span className="text-[var(--text-secondary)] text-xs block mb-1">Tipo Imóvel</span>
              <strong className="text-[var(--text-primary)]">🏠 {info.tipoImovel || 'N/A'}</strong>
            </div>
          </div>

          {/* Endereço */}
          <div className="p-3 bg-[var(--bg-secondary)] rounded-lg text-sm">
            <span className="text-[var(--text-secondary)] text-xs flex items-center gap-1 mb-1">
              <MapPin className="w-3 h-3" /> Endereço
            </span>
            <strong className="text-[var(--text-primary)]">
              {info.rua}{info.numero && `, ${info.numero}`}
              {info.complemento && ` - ${info.complemento}`}
            </strong>
            <div className="text-[var(--text-secondary)] text-xs mt-1">
              {info.bairro && <span>{info.bairro}</span>}
              {info.cidade && <span> • {info.cidade}</span>}
              {info.estado && <span> - {info.estado}</span>}
              {info.cep && <span> • CEP: {info.cep}</span>}
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div className="p-3 bg-[var(--bg-secondary)] rounded-lg text-center">
              <FolderOpen className="w-5 h-5 mx-auto mb-1 text-primary" />
              <span className="text-[var(--text-secondary)] text-xs block">Ambientes</span>
              <strong className="text-[var(--text-primary)] text-lg">{ambientes.length}</strong>
            </div>
            <div className="p-3 bg-[var(--bg-secondary)] rounded-lg text-center">
              <Image className="w-5 h-5 mx-auto mb-1 text-primary" />
              <span className="text-[var(--text-secondary)] text-xs block">Fotos</span>
              <strong className="text-[var(--text-primary)] text-lg">{totalImagesUploaded}</strong>
            </div>
            {info.tamanho && (
              <div className="p-3 bg-[var(--bg-secondary)] rounded-lg text-center">
                <span className="text-xl block mb-1">📐</span>
                <span className="text-[var(--text-secondary)] text-xs block">Tamanho</span>
                <strong className="text-[var(--text-primary)] text-sm">{info.tamanho}</strong>
              </div>
            )}
            <div className="p-3 bg-[var(--bg-secondary)] rounded-lg text-center">
              <span className="text-xl block mb-1">📅</span>
              <span className="text-[var(--text-secondary)] text-xs block">Data</span>
              <strong className="text-[var(--text-primary)] text-sm">{info.dataVistoria || 'N/A'}</strong>
            </div>
          </div>

          {/* Ambientes */}
          {ambientes.length > 0 && (
            <div>
              <span className="text-[var(--text-secondary)] text-xs block mb-2">Ambientes cadastrados:</span>
              <div className="flex flex-wrap gap-2">
                {ambientes.map((amb: any) => (
                  <span key={amb.id} className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-lg text-xs font-medium text-[var(--text-primary)]">
                    📁 {amb.nomeAmbiente}
                    <span className="opacity-50 ml-1">({amb.tipoAmbiente})</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmações */}
      <div className="mb-6 space-y-3">
        <h4 className="font-bold text-[var(--text-primary)] mb-2">⚠️ Confirmações Necessárias</h4>
        <label className="flex items-start gap-3 cursor-pointer p-3 border-2 border-[var(--border-color)] rounded-lg hover:border-primary transition-colors bg-[var(--bg-primary)]">
          <input
            type="checkbox"
            checked={confirmacoes.dadosCorretos}
            onChange={(e) => setConfirmacoes({ ...confirmacoes, dadosCorretos: e.target.checked })}
            className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary mt-0.5 accent-[var(--primary)]"
          />
          <span className="text-sm text-[var(--text-secondary)]">
            Confirmo que todas as <strong>informações da vistoria</strong> estão corretas
          </span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer p-3 border-2 border-[var(--border-color)] rounded-lg hover:border-primary transition-colors bg-[var(--bg-primary)]">
          <input
            type="checkbox"
            checked={confirmacoes.ambientesCorretos}
            onChange={(e) => setConfirmacoes({ ...confirmacoes, ambientesCorretos: e.target.checked })}
            className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary mt-0.5 accent-[var(--primary)]"
          />
          <span className="text-sm text-[var(--text-secondary)]">
            Confirmo que todos os <strong>ambientes</strong> foram adicionados corretamente
          </span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer p-3 border-2 border-[var(--border-color)] rounded-lg hover:border-primary transition-colors bg-[var(--bg-primary)]">
          <input
            type="checkbox"
            checked={confirmacoes.imagensCorretas}
            onChange={(e) => setConfirmacoes({ ...confirmacoes, imagensCorretas: e.target.checked })}
            className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary mt-0.5 accent-[var(--primary)]"
          />
          <span className="text-sm text-[var(--text-secondary)]">
            Confirmo que todas as <strong>imagens</strong> foram enviadas e estão corretas
          </span>
        </label>
      </div>

      {/* Aviso */}
      <div className="bg-yellow-500/10 border-2 border-yellow-500/20 rounded-lg p-4 mb-6">
        {unidentifiedCount > 0 ? (
          <p className="text-sm text-yellow-600 dark:text-yellow-500 font-medium flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            Não é possível iniciar a análise por IA com itens "Não identificado". 
            Volte para o passo anterior para nomeá-los, ou finalize sem análise.
          </p>
        ) : (
          <p className="text-sm text-yellow-600 dark:text-yellow-500">
            <strong>⏱️ Estimativa de processamento:</strong> Após finalizar, seu laudo entrará na fila de análise por IA.
            O processamento leva em média 10-30 minutos, dependendo da quantidade de imagens.
          </p>
        )}
      </div>

      {/* Buttons */}
      <div className="flex justify-between pt-6 border-t border-[var(--border-color)]">
        <Button variant="outline" size="lg" onClick={onBack}>
          ← Voltar
        </Button>
        <div className="flex gap-3">
          <Button
            variant="primary"
            size="lg"
            onClick={onSubmit}
            disabled={!podeSubmeter}
          >
            <Rocket className="w-4 h-4 mr-2" />
            Finalizar sem Análise
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={handleIniciarAnalise}
            disabled={!canAnalyzeIA}
            className={`shadow-lg transition-all duration-300 ${canAnalyzeIA ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-purple-500/30' : 'bg-gray-400 text-gray-200 cursor-not-allowed'}`}
          >
            {iniciandoAnalise ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Iniciando...
              </>
            ) : (
              <>
                <Bot className="w-4 h-4 mr-2" />
                Finalizar + Análise IA
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
