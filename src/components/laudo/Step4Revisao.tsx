import { useState } from 'react'
import Button from '../ui/Button'

interface Step4Props {
  onSubmit: (data?: any) => void
  onBack: () => void
  laudoData: any
}

const checklistItems = [
  'Testes Eletroeletrônicos',
  'Teste de tomadas e interruptores',
  'Luminárias e Spots',
  'Fluxo e escoamento de água',
  'Vazamentos de sifões e flexíveis',
  'Torneiras e Descargas',
  'Box de Banheiro',
  'Bancadas e Pias de pedra',
  'Abertura de portas e janelas',
  'Maçanetas, fechaduras e trincos',
  'Pisos e Revestimentos',
  'Pintura Geral',
  'Esquadrias',
  'Sistema de ar-condicionado',
  'Sistema de aquecimento',
  'Persianas e Cortinas',
  'Vidros e Vidraria',
  'Móbilia Fixa e Móbilia Planejada',
  'Caixa de Disjuntores',
  'Fogão',
  'Móbilia Fixa e Móbilia Móvel',
  'Sistema de Monitoramento',
]

export default function Step4Revisao({ onSubmit, onBack, laudoData }: Step4Props) {
  const [checklist, setChecklist] = useState<{[key: string]: boolean}>({})
  const [confirmacoes, setConfirmacoes] = useState({
    dadosCorretos: false,
    ambientesCorretos: false,
    imagensCorretas: false,
  })

  const handleChecklistToggle = (item: string) => {
    setChecklist({ ...checklist, [item]: !checklist[item] })
  }

  const podeSubmeter = confirmacoes.dadosCorretos && confirmacoes.ambientesCorretos && confirmacoes.imagensCorretas

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">Revisão e Finalização</h3>

      {/* Resumo */}
      <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6 mb-6">
        <h4 className="font-bold text-gray-900 mb-4">📋 Resumo do Laudo</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Tipo:</span> <strong>{laudoData.vistoriaInfo?.tipo || 'N/A'}</strong>
          </div>
          <div>
            <span className="text-[var(--text-secondary)]">Uso:</span> <strong className="text-[var(--text-primary)]">{laudoData.vistoriaInfo?.uso || 'N/A'}</strong>
          </div>
          <div className="col-span-2">
            <span className="text-[var(--text-secondary)]">Endereço:</span> <strong className="text-[var(--text-primary)]">{laudoData.vistoriaInfo?.endereco || 'N/A'}</strong>
          </div>
          <div>
            <span className="text-[var(--text-secondary)]">Ambientes:</span> <strong className="text-[var(--text-primary)]">{laudoData.ambientes?.length || 0}</strong>
          </div>
          <div>
            <span className="text-[var(--text-secondary)]">Data:</span> <strong className="text-[var(--text-primary)]">{laudoData.vistoriaInfo?.realizadaEm || 'N/A'}</strong>
          </div>
        </div>
      </div>

      {/* Checklist Opcional */}
      <div className="mb-6">
        <h4 className="font-bold text-gray-900 mb-4">✅ Checklist do Relatório Geral (Opcional)</h4>
        <p className="text-sm text-gray-600 mb-4">
          Marque os itens que foram verificados na vistoria:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-y-auto p-4 bg-gray-50 rounded-lg">
          {checklistItems.map((item) => (
            <label key={item} className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded transition-colors">
              <input
                type="checkbox"
                checked={checklist[item] || false}
                onChange={() => handleChecklistToggle(item)}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <span className="text-sm text-[var(--text-secondary)]">{item}</span>
            </label>
          ))}
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
            className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary mt-0.5"
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
            className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary mt-0.5"
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
            className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary mt-0.5"
          />
          <span className="text-sm text-[var(--text-secondary)]">
            Confirmo que todas as <strong>imagens</strong> foram enviadas e estão corretas
          </span>
        </label>
      </div>

      {/* Aviso */}
      <div className="bg-yellow-500/10 border-2 border-yellow-500/20 rounded-lg p-4 mb-6">
        <p className="text-sm text-yellow-500">
          <strong>⏱️ Estimativa de processamento:</strong> Após finalizar, seu laudo entrará na fila de processamento.
          Você receberá uma notificação por email quando estiver pronto (estimativa: 10-30 minutos).
        </p>
      </div>

      {/* Buttons */}
      <div className="flex justify-between pt-6 border-t border-[var(--border-color)]">
        <Button variant="outline" size="lg" onClick={onBack}>
          ← Voltar
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={onSubmit}
          disabled={!podeSubmeter}
        >
          🚀 Processar Laudo
        </Button>
      </div>
    </div>
  )
}
