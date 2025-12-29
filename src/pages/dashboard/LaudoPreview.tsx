import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Button from '../../components/ui/Button'

interface ImagemLaudo {
  src: string
  legenda: string
  ambiente: string
}

export default function LaudoPreview() {
  const [currentPage, setCurrentPage] = useState(0)
  const [imagens, setImagens] = useState<ImagemLaudo[]>([])

  // Legendas de exemplo
  const legendasExemplo = [
    { ambiente: 'ÁREA EXTERNA', legenda: '1 (1) Vista para empreendimento do imóvel vistoriado' },
    { ambiente: 'SALA DE ESTAR', legenda: '2 (1) Porta de madeira, sem manchas ou avarias aparente' },
    { ambiente: 'SALA DE ESTAR', legenda: '2 (2) Placa de identificação, sem avarias aparente' },
    { ambiente: 'SALA DE ESTAR', legenda: '2 (3) Fechadura com maçaneta instalada, sem manchas ou avarias' },
    { ambiente: 'SALA DE ESTAR', legenda: '2 (4) Vista para o geral da sala, em ótima conservação do ambiente' },
    { ambiente: 'SALA DE ESTAR', legenda: '2 (5) Parede com pintura sem manchas ou avarias' },
    { ambiente: 'SALA DE ESTAR', legenda: '2 (6) Painel de madeira, com detalhe à esquerda aparente' },
    { ambiente: 'SALA DE ESTAR', legenda: '2 (7) APONTAMENTO para leve descascamento na pintura aparente' },
    { ambiente: 'SALA DE ESTAR', legenda: '2 (8) ITEM - Quadros decorativo (2 peças)' },
    { ambiente: 'SALA DE ESTAR', legenda: '2 (9) ITEM - SmartTV LG, sem avarias aparente' },
    { ambiente: 'SALA DE ESTAR', legenda: '2 (10) Vista para marca da SmartTV' },
    { ambiente: 'SALA DE ESTAR', legenda: '2 (11) SmartTV sem irregularidade aparente' },
  ]

  // Simular carregamento de imagens
  useEffect(() => {
    const imagensExemplo: ImagemLaudo[] = legendasExemplo.map((item, index) => {
      const numero = index + 1
      // Imagens 1-5 têm extensão .jpg.jpg, imagens 6-12 têm .jpg.png
      const extensao = numero <= 5 ? '.jpg.jpg' : '.jpg.png'
      return {
        src: `/exemplos-laudos/imagem-${numero}${extensao}`,
        legenda: item.legenda,
        ambiente: item.ambiente
      }
    })
    setImagens(imagensExemplo)
  }, [])

  // Dividir imagens em páginas (12 imagens por página = 3 colunas x 4 linhas)
  const imagensPorPagina = 12
  const totalPaginas = Math.ceil(imagens.length / imagensPorPagina)
  const imagensPaginaAtual = imagens.slice(
    currentPage * imagensPorPagina,
    (currentPage + 1) * imagensPorPagina
  )

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl md:text-3xl font-bold text-[var(--text-primary)] transition-colors">Preview do Laudo</h2>
            <p className="text-sm md:text-base text-[var(--text-secondary)]">Av. José Galante, 671 - Apto 161</p>
          </div>
          <div className="flex gap-2 md:gap-3">
            <Button variant="outline" size="sm" className="flex-1 sm:flex-none text-xs md:text-sm">✏️ Editar</Button>
            <Button variant="primary" size="sm" className="flex-1 sm:flex-none text-xs md:text-sm">⬇ Baixar PDF</Button>
          </div>
        </div>

        {/* Preview Area - Formato A4 */}
        <div className="bg-gray-800 rounded-lg md:rounded-xl p-2 md:p-8">
          <div className="max-w-[210mm] mx-auto bg-white rounded-lg shadow-2xl p-3 md:p-8 min-h-[297mm] flex flex-col">
            {/* Page Header */}
            <div className="text-center mb-3 md:mb-6 pb-2 md:pb-4 border-b-2 border-gray-300">
              <h1 className="text-base md:text-2xl font-bold text-gray-900">VISTORIA DE ENTRADA</h1>
              <p className="text-[10px] md:text-sm text-gray-600 mt-1">Av. José Galante, 671 - Apto 161 - Vila Andrade, São Paulo - SP</p>
            </div>

            {/* Grid de Imagens - 2 colunas mobile, 3 desktop */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-0.5 md:gap-1 flex-1">
              {imagensPaginaAtual.map((img, index) => (
                <div key={index} className="flex flex-col">
                  {/* Imagem */}
                  <div className="bg-gray-200 aspect-[4/3] rounded-sm overflow-hidden flex items-center justify-center border border-gray-300">
                    <img
                      src={img.src}
                      alt={img.legenda}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.currentTarget
                        target.style.display = 'none'
                        const parent = target.parentElement
                        if (parent) {
                          parent.innerHTML = `
                            <div class="w-full h-full flex items-center justify-center text-gray-400 text-[10px] md:text-xs p-1 md:p-2 text-center">
                              📸<br/>Imagem ${index + 1}
                            </div>
                          `
                        }
                      }}
                    />
                  </div>

                  {/* Legenda - bem próxima da imagem */}
                  <div className="mt-0.5 px-0.5">
                    <p className="text-[7px] md:text-[9px] font-bold text-gray-900 leading-tight uppercase">
                      {img.ambiente}
                    </p>
                    <p className="text-[6px] md:text-[8px] text-gray-700 leading-tight">
                      {img.legenda}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Page Number */}
            <div className="mt-2 md:mt-4 pt-2 md:pt-3 border-t border-gray-300 text-center">
              <p className="text-[10px] md:text-xs text-gray-500">
                Página {currentPage + 1} de {totalPaginas}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="text-xs md:text-sm px-2 md:px-4"
          >
            <span className="hidden sm:inline">← Página Anterior</span>
            <span className="sm:hidden">← Anterior</span>
          </Button>

          <span className="text-xs md:text-sm text-[var(--text-secondary)] whitespace-nowrap">
            Página {currentPage + 1} de {totalPaginas}
          </span>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPaginas - 1, currentPage + 1))}
            disabled={currentPage === totalPaginas - 1}
            className="text-xs md:text-sm px-2 md:px-4"
          >
            <span className="hidden sm:inline">Próxima Página →</span>
            <span className="sm:hidden">Próxima →</span>
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
