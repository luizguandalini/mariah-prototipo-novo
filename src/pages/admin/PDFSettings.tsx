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
        <h2 className="text-3xl font-bold text-gray-900">Configurações de PDF</h2>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Ajustes de Layout do PDF</h3>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Margem Superior (mm)
              </label>
              <input
                type="number"
                value={settings.margemSuperior}
                onChange={(e) => setSettings({...settings, margemSuperior: parseInt(e.target.value)})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Margem Inferior (mm)
              </label>
              <input
                type="number"
                value={settings.margemInferior}
                onChange={(e) => setSettings({...settings, margemInferior: parseInt(e.target.value)})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Margem Esquerda (mm)
              </label>
              <input
                type="number"
                value={settings.margemEsquerda}
                onChange={(e) => setSettings({...settings, margemEsquerda: parseInt(e.target.value)})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Margem Direita (mm)
              </label>
              <input
                type="number"
                value={settings.margemDireita}
                onChange={(e) => setSettings({...settings, margemDireita: parseInt(e.target.value)})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Espaçamento entre Imagens (mm)
              </label>
              <input
                type="number"
                value={settings.espacamentoEntreImagens}
                onChange={(e) => setSettings({...settings, espacamentoEntreImagens: parseInt(e.target.value)})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imagens por Página
              </label>
              <select
                value={settings.imagensPorPagina}
                onChange={(e) => setSettings({...settings, imagensPorPagina: parseInt(e.target.value)})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
              >
                <option value={1}>1 imagem</option>
                <option value={2}>2 imagens</option>
                <option value={3}>3 imagens</option>
                <option value={4}>4 imagens</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Qualidade da Imagem (%)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={settings.qualidadeImagem}
                onChange={(e) => setSettings({...settings, qualidadeImagem: parseInt(e.target.value)})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-gray-200">
            <Button variant="primary">Salvar Configurações de PDF</Button>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Preview do Layout</h3>
          <div className="bg-gray-100 p-8 rounded-lg">
            <div
              className="bg-white mx-auto shadow-lg"
              style={{
                padding: `${settings.margemSuperior}mm ${settings.margemDireita}mm ${settings.margemInferior}mm ${settings.margemEsquerda}mm`,
                width: '210mm',
                minHeight: '297mm',
              }}
            >
              <div className="text-center mb-4">
                <h4 className="font-bold text-lg">LAUDO EXEMPLO</h4>
              </div>
              <div className="space-y-4" style={{ gap: `${settings.espacamentoEntreImagens}mm` }}>
                {Array.from({ length: settings.imagensPorPagina }).map((_, i) => (
                  <div key={i} className="bg-gray-200 h-32 flex items-center justify-center rounded">
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
