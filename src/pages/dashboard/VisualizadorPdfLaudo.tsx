import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { laudosService } from '../../services/laudos';
import { pdfService } from '../../services/pdfService';
import { toast } from 'sonner';
import Button from '../../components/ui/Button';

interface ImagemPdf {
  id: string;
  s3Key: string;
  ambiente: string;
  numeroAmbiente: number;
  numeroImagemNoAmbiente: number;
  legenda: string;
  ordem: number;
  categoria: string;
  tipo: string;
}

export default function VisualizadorPdfLaudo() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [imagens, setImagens] = useState<ImagemPdf[]>([]);
  const [imagensComUrls, setImagensComUrls] = useState<any[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [totalImagens, setTotalImagens] = useState(0);
  const [loading, setLoading] = useState(true);
  const [configuracoes, setConfiguracoes] = useState<any>({
    espacamentoHorizontal: 10,
    espacamentoVertical: 15,
    margemPagina: 20,
  });
  const [gerandoPdf, setGerandoPdf] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const originalLegendasRef = useRef<Record<string, string>>({});
  const pagesCache = useRef<Record<number, any[]>>({});

  useEffect(() => {
    carregarConfiguracoes();
  }, []);

  useEffect(() => {
    if (id) {
      carregarImagens();
    }
  }, [id, paginaAtual]);

  const carregarConfiguracoes = async () => {
    try {
      const config = await laudosService.getConfiguracoesPdf();
      setConfiguracoes(config);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const carregarImagens = async () => {
    if (!id) return;
    
    // Se já estiver em cache, usa o cache e não ativa o loading visualmente (ou ativa bem rápido)
    if (pagesCache.current[paginaAtual]) {
      setImagensComUrls(pagesCache.current[paginaAtual]);
      // Mantemos os totais atualizados caso tenha mudado algo globalmente, 
      // mas para performance de navegação, assumimos que totalPaginas não muda drasticamente
      return;
    }

    try {
      setLoading(true);
      const response = await laudosService.getImagensPdf(id, paginaAtual, 12);
      
      setImagens(response.data);
      setTotalPaginas(response.meta.totalPages);
      setTotalImagens(response.meta.totalImages);

      // Buscar URLs em batch
      const s3Keys = response.data.map((img: any) => img.s3Key);
      const urls = await laudosService.getSignedUrlsBatch(s3Keys);

      const imagensComUrl = response.data.map((img: any) => ({
        ...img,
        url: urls[img.s3Key],
      }));

      // Salvar no cache
      pagesCache.current[paginaAtual] = imagensComUrl;
      setImagensComUrls(imagensComUrl);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao carregar imagens');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLegendaChange = async (imagemId: string, novaLegenda: string) => {
    try {
      await laudosService.updateLegenda(imagemId, novaLegenda);
      
      // Atualizar localmente
      setImagensComUrls(prev =>
        prev.map(img => img.id === imagemId ? { ...img, legenda: novaLegenda } : img)
      );
    } catch (error: any) {
      toast.error('Erro ao salvar legenda');
      console.error(error);
    }
  };

  const handleGerarPdfPagina = async () => {
    try {
      setGerandoPdf(true);
      await pdfService.gerarPdfPaginaUnica('pdf-grid-preview', `laudo-pagina-${paginaAtual}.pdf`);
      toast.success('PDF gerado com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao gerar PDF');
      console.error(error);
    } finally {
      setGerandoPdf(false);
    }
  };

  const handleGerarPdfCompleto = async () => {
    if (!id) return;

    try {
      setGerandoPdf(true);
      setProgresso(0);
      abortControllerRef.current = new AbortController();

      const getImagensPagina = (page: number) => laudosService.getImagensPdf(id, page, 12);
      const getUrlsBatch = (s3Keys: string[]) => laudosService.getSignedUrlsBatch(s3Keys);

      await pdfService.gerarPdfCompleto(
        id,
        totalPaginas,
        getImagensPagina,
        getUrlsBatch,
        configuracoes,
        setProgresso,
        abortControllerRef.current.signal
      );

      toast.success('PDF completo gerado com sucesso!');
    } catch (error: any) {
      if (error.message === 'Geração cancelada') {
        toast.info('Geração cancelada');
      } else {
        toast.error('Erro ao gerar PDF');
        console.error(error);
      }
    } finally {
      setGerandoPdf(false);
      setProgresso(0);
      abortControllerRef.current = null;
    }
  };

  const handleCancelar = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard/laudos')}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Voltar
            </button>
            <h1 className="text-2xl font-bold">Visualizador de PDF</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleGerarPdfPagina}
              disabled={gerandoPdf || imagensComUrls.length === 0}
            >
              📄 Baixar Esta Página
            </Button>
            <Button
              variant="primary"
              onClick={handleGerarPdfCompleto}
              disabled={gerandoPdf || totalPaginas === 0}
            >
              📚 Baixar Todas as Páginas
            </Button>
          </div>
        </div>

        {/* Paginação */}
        <div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-gray-600">
            Página {paginaAtual} de {totalPaginas} • {totalImagens} imagens no total
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
              disabled={paginaAtual === 1 || loading}
              className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              ← Anterior
            </button>
            
            <span className="px-4 py-2">
              {paginaAtual} / {totalPaginas}
            </span>

            <button
              onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
              disabled={paginaAtual === totalPaginas || loading}
              className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Próxima →
            </button>
          </div>
        </div>
      </div>

      {/* Grid de Imagens - Layout Tradicional */}
      <div className="flex items-start justify-center min-h-[600px] py-8 relative">
        {loading && (
          <div className="absolute inset-0 flex items-start justify-center pt-20 z-10 bg-gray-50 bg-opacity-50">
             <div className="bg-white p-4 rounded-full shadow-lg">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
             </div>
          </div>
        )}
        <div
          id="pdf-grid-preview"
          className={`bg-white transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'}`}
          style={{
            width: '210mm',
            padding: `${configuracoes.margemPagina}px`,
            minHeight: '297mm',
          }}
        >
          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: `${configuracoes.espacamentoVertical}px ${configuracoes.espacamentoHorizontal}px`,
            }}
          >
            {imagensComUrls.map((img) => {
              // Remover número e traço do início do ambiente (ex: "1 - COZINHA" -> "COZINHA")
              const ambienteSemNumero = img.ambiente?.replace(/^\d+\s*-\s*/, '') || img.ambiente;
              const isEditing = editingId === img.id;
              
              return (
              <div key={img.id}>
                {/* Imagem PRIMEIRO */}
                <div className="border border-gray-400 mb-1">
                  <img
                    src={img.url}
                    alt={`${img.ambiente} - ${img.numeroImagemNoAmbiente}`}
                    className="w-full object-cover"
                    style={{ 
                      height: '200px',
                      display: 'block',
                    }}
                    crossOrigin="anonymous"
                  />
                </div>
                
                {/* Ambiente ABAIXO da imagem */}
                <div 
                  className="font-bold uppercase"
                  style={{ 
                    fontSize: '10px',
                    lineHeight: '1.2',
                    textAlign: 'left',
                  }}
                >
                  {ambienteSemNumero}
                </div>
                
                {/* Legenda - número inline com texto */}
                <div 
                  className="text-left"
                  style={{ 
                    fontSize: '9px',
                    lineHeight: '1.4',
                  }}
                >
                  {isEditing ? (
                    <div>
                      <div className="flex flex-wrap">
                        <span className="font-bold mr-1">
                          {img.numeroAmbiente} ({img.numeroImagemNoAmbiente})
                        </span>
                      </div>
                      <textarea
                        value={img.legenda}
                        maxLength={200}
                        onChange={(e) => {
                          setImagensComUrls(prev =>
                            prev.map(i => i.id === img.id ? { ...i, legenda: e.target.value } : i)
                          );
                        }}
                        className="w-full border border-blue-400 outline-none resize-none bg-yellow-50 p-1 rounded mt-1"
                        style={{
                          fontSize: '9px',
                          lineHeight: '1.4',
                          fontFamily: 'inherit',
                          minHeight: '40px',
                        }}
                        rows={2}
                        autoFocus
                      />
                      <div className="flex justify-between items-center mt-1">
                        <span className={`text-xs ${(img.legenda?.length || 0) > 180 ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
                          {img.legenda?.length || 0}/200
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={async () => {
                              await handleLegendaChange(img.id, img.legenda);
                              setEditingId(null);
                            }}
                            className="px-2 py-0.5 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                          >
                            Salvar
                          </button>
                          <button
                            onClick={() => {
                              // Reverter para valor original sem recarregar
                              setImagensComUrls(prev =>
                                prev.map(i => i.id === img.id ? { ...i, legenda: originalLegendasRef.current[img.id] || '' } : i)
                              );
                              setEditingId(null);
                            }}
                            className="px-2 py-0.5 bg-gray-300 rounded text-xs hover:bg-gray-400"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => {
                        // Salvar legenda original antes de editar
                        originalLegendasRef.current[img.id] = img.legenda;
                        setEditingId(img.id);
                      }}
                      className="cursor-pointer hover:bg-yellow-50 rounded px-1 -mx-1"
                      title="Clique para editar"
                    >
                      <span className="font-bold">{img.numeroAmbiente} ({img.numeroImagemNoAmbiente})</span>{' '}
                      {img.legenda || 'sem legenda'}
                    </div>
                  )}
                </div>
              </div>
            );})}
          </div>
        </div>
      </div>

      {/* Modal de Progresso */}
      {gerandoPdf && progresso > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Gerando PDF Completo</h3>
            <p className="text-sm text-gray-600 mb-4">
              Processando... {Math.round(progresso)}%
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all"
                style={{ width: `${progresso}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Isso pode levar alguns minutos dependendo da quantidade de imagens.
            </p>
            <Button variant="outline" onClick={handleCancelar} className="w-full">
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
