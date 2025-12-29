import { useState } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Button from '../../components/ui/Button'

export default function PDFSettings() {
  const [settings, setSettings] = useState({
    margemSuperior: 20,
    margemInferior: 20,
    margemEsquerda: 15,
    margemDireita: 15,
    espacamentoEntreImagens: 10,
    imagensPorPagina: 2,
    qualidadeImagem: 85,
  })

  return (
    <DashboardLayout>
      <div className="max-w-4xl space-y-6">
        <h2 className="text-3xl font-bold text-[var(--text-primary)] transition-colors">Configurações de PDF</h2>

        <div className="bg-[var(--bg-secondary)] rounded-xl shadow-sm border border-[var(--border-color)] p-6 transition-colors duration-300">
          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6">Ajustes de Layout do PDF</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Margem Superior (mm)
              </label>
              <input
                type="number"
                value={settings.margemSuperior}
                onChange={(e) => setSettings({...settings, margemSuperior: parseInt(e.target.value)})}
                className="w-full px-4 py-3 bg-[var(--bg-primary)] border-2 border-[var(--border-color)] text-[var(--text-primary)] rounded-lg focus:border-primary focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Margem Inferior (mm)
              </label>
              <input
                type="number"
                value={settings.margemInferior}
                onChange={(e) => setSettings({...settings, margemInferior: parseInt(e.target.value)})}
                className="w-full px-4 py-3 bg-[var(--bg-primary)] border-2 border-[var(--border-color)] text-[var(--text-primary)] rounded-lg focus:border-primary focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Margem Esquerda (mm)
              </label>
              <input
                type="number"
                value={settings.margemEsquerda}
                onChange={(e) => setSettings({...settings, margemEsquerda: parseInt(e.target.value)})}
                className="w-full px-4 py-3 bg-[var(--bg-primary)] border-2 border-[var(--border-color)] text-[var(--text-primary)] rounded-lg focus:border-primary focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Margem Direita (mm)
              </label>
              <input
                type="number"
                value={settings.margemDireita}
                onChange={(e) => setSettings({...settings, margemDireita: parseInt(e.target.value)})}
                className="w-full px-4 py-3 bg-[var(--bg-primary)] border-2 border-[var(--border-color)] text-[var(--text-primary)] rounded-lg focus:border-primary focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Espaçamento entre Imagens (mm)
              </label>
              <input
                type="number"
                value={settings.espacamentoEntreImagens}
                onChange={(e) => setSettings({...settings, espacamentoEntreImagens: parseInt(e.target.value)})}
                className="w-full px-4 py-3 bg-[var(--bg-primary)] border-2 border-[var(--border-color)] text-[var(--text-primary)] rounded-lg focus:border-primary focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Imagens por Página
              </label>
              <select
                value={settings.imagensPorPagina}
                onChange={(e) => setSettings({...settings, imagensPorPagina: parseInt(e.target.value)})}
                className="w-full px-4 py-3 bg-[var(--bg-primary)] border-2 border-[var(--border-color)] text-[var(--text-primary)] rounded-lg focus:border-primary focus:outline-none transition-all"
              >
                <option value={1}>1 imagem</option>
                <option value={2}>2 imagens</option>
                <option value={3}>3 imagens</option>
                <option value={4}>4 imagens</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Qualidade da Imagem (%)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={settings.qualidadeImagem}
                onChange={(e) => setSettings({...settings, qualidadeImagem: parseInt(e.target.value)})}
                className="w-full px-4 py-3 bg-[var(--bg-primary)] border-2 border-[var(--border-color)] text-[var(--text-primary)] rounded-lg focus:border-primary focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-[var(--border-color)]">
            <Button variant="primary">Salvar Configurações de PDF</Button>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-[var(--bg-secondary)] rounded-xl shadow-sm border border-[var(--border-color)] p-6 transition-colors duration-300">
          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">Preview do Layout</h3>
          <div className="bg-[var(--bg-primary)] p-4 md:p-8 rounded-lg border border-[var(--border-color)] overflow-x-auto">
            <div
              className="bg-white mx-auto shadow-2xl transition-all"
              style={{
                padding: `${settings.margemSuperior}mm ${settings.margemDireita}mm ${settings.margemInferior}mm ${settings.margemEsquerda}mm`,
                width: '180mm', // Reduzi para caber melhor no preview mobile/tablet
                minHeight: '254mm',
                color: '#111', // Garantir texto escuro no preview (papel branco)
              }}
            >
              <div className="text-center mb-8 border-b-2 border-gray-100 pb-4">
                <h4 className="font-bold text-xl uppercase tracking-wider text-gray-800">LAUDO EXEMPLO</h4>
                <p className="text-xs text-gray-400 mt-1">Simulação de visualização impressa</p>
              </div>
              <div className="space-y-4" style={{ gap: `${settings.espacamentoEntreImagens}mm` }}>
                {Array.from({ length: settings.imagensPorPagina }).map((_, i) => (
                  <div key={i} className="bg-gray-100 border border-gray-200 h-40 flex items-center justify-center rounded-lg text-gray-400 font-medium">
                    Imagem {i + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
