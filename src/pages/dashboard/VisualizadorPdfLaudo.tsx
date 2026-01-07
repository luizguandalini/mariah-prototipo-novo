import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { laudosService, Laudo } from '../../services/laudos';
import { pdfService } from '../../services/pdfService';
import { toast } from 'sonner';
import Button from '../../components/ui/Button';

interface ImagemPdf {
  id: string;
  s3Key: string;
  count: number;
  ambiente: string;
  numeroAmbiente: number;
  numeroImagemNoAmbiente: number;
  legenda: string;
  ordem: number;
  categoria: string;
  tipo: string;
}

const METODOLOGIA_TEXTS = [
  "Este documento tem como objetivo garantir às partes da locação o registro do estado de entrega do imóvel, integrando-se como anexo ao contrato formado. Ele concilia as obrigações contratuais e serve como referência para a aferição de eventuais alterações no imóvel ao longo do período de uso.",
  "O laudo de vistoria foi elaborado de maneira técnica por um especialista qualificado, que examinou critérios específicos para avaliar todos os aspectos relevantes, desde apontamentos estruturais aparentes até pequenos detalhes construtivos e acessórios presentes no imóvel. O objetivo foi registrar, de forma clara e objetiva, por meio de textos e imagens, qualquer apontamento ou irregularidade, garantindo uma abordagem sistemática, imparcial e organizada em ordem cronológica, com separação por ambientes e legendas contidas e numerações sequenciais.",
  "O documento inclui fotos de todas as paredes, pisos, tetos, portas, janelas e demais elementos que compõem o imóvel e suas instalações. As imagens foram capturadas com angulação precisa, permitindo análises previstas do estado de conservação atual do imóvel e verificações futuras. Fica reservado o direito, a qualquer tempo, das partes identificadas, por meio das imagens, qualquer ponto que não tenha sido especificado por escrito.",
  "Os registros identificados como irregularidades ou avarias estão destacados neste laudo sob a denominação \"APONTAMENTOS\" e podem ser facilmente localizados utilizando o recurso de busca por palavras.",
  "Este laudo não emprega termos subjetivos, como \"bom\", \"regular\" ou \"ótimo\" estado, nas análises. A descrição foi construída de forma objetiva, baseada exclusivamente em fatos observáveis, com o objetivo de evitar interpretações divergentes que possam surgir de perspectivas pessoais e garantir que as informações registradas sejam precisas e imparciais.",
  "Os elementos adicionais ao imóvel, como acessórios, eletrodomésticos, equipamentos de arcondicionado, dispositivos em geral, lustres ou luminárias, mobília não embutida, entre outros, serão identificados no laudo pela denominação \"ITEM\"."
];

export default function VisualizadorPdfLaudo() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [laudo, setLaudo] = useState<Laudo | null>(null);
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

  const hasCover = laudo?.tipoVistoria?.toLowerCase().includes('entrada') || false;

  useEffect(() => {
    carregarConfiguracoes();
    if (id) {
      carregarLaudo();
    }
  }, [id]);

  useEffect(() => {
    if (id && laudo) {
      carregarImagens();
    }
  }, [id, paginaAtual, laudo]);

  const carregarConfiguracoes = async () => {
    try {
      const config = await laudosService.getConfiguracoesPdf();
      setConfiguracoes(config);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const carregarLaudo = async () => {
    if (!id) return;
    try {
      const data = await laudosService.getLaudo(id);
      setLaudo(data);
    } catch (error) {
      console.error('Erro ao carregar laudo:', error);
      toast.error('Erro ao carregar dados do laudo');
    }
  };

  const carregarImagens = async () => {
    if (!id || !laudo) return;
    
    // Se for página de capa, não carrega imagens
    if (hasCover && paginaAtual === 1) {
      setImagensComUrls([]);
      setLoading(false);
      
      if (totalPaginas === 0) {
        try {
          const response = await laudosService.getImagensPdf(id, 1, 12);
          setTotalPaginas(response.meta.totalPages + 1);
          setTotalImagens(response.meta.totalImages);
        } catch (e) {
          console.error(e);
        }
      }
      return;
    }

    const backendPage = hasCover ? paginaAtual - 1 : paginaAtual;

    if (pagesCache.current[paginaAtual]) {
      setImagensComUrls(pagesCache.current[paginaAtual]);
      return;
    }

    try {
      setLoading(true);
      const response = await laudosService.getImagensPdf(id, backendPage, 12);
      
      setTotalPaginas(hasCover ? response.meta.totalPages + 1 : response.meta.totalPages);
      setTotalImagens(response.meta.totalImages);

      const s3Keys = response.data.map((img: any) => img.s3Key);
      const urls = await laudosService.getSignedUrlsBatch(s3Keys);

      const imagensComUrl = response.data.map((img: any) => ({
        ...img,
        url: urls[img.s3Key],
      }));

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
    if (!id || !laudo) return;

    try {
      setGerandoPdf(true);
      setProgresso(0);
      abortControllerRef.current = new AbortController();

      const getImagensPagina = (page: number) => laudosService.getImagensPdf(id, page, 12);
      const getUrlsBatch = (s3Keys: string[]) => laudosService.getSignedUrlsBatch(s3Keys);

      await pdfService.gerarPdfCompleto(
        id,
        laudo,
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

  const renderCoverPage = () => {
    if (!laudo) return null;

    return (
      <div 
        id="pdf-grid-preview"
        style={{
          width: '210mm',
          height: '297mm',
          boxSizing: 'border-box',
          margin: '0 auto',
          borderTop: '8px solid #6f2f9e',
          padding: '10mm 20mm 20mm 20mm',
          backgroundColor: '#fff',
          overflow: 'hidden',
          fontFamily: '"Roboto", Arial, sans-serif',
          color: 'black',
        }}
      >
        <style>{`
          @import url("https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100..900;1,100..900&display=swap");
          .div-laudo-de-vistoria { background-color: #d9d9d9; margin-bottom: 20px; margin-top: 35px; }
          .div-laudo-de-vistoria h1 { text-align: center; font-size: 25px; margin: 0; padding: 10px 0; font-weight: 700; }
          .div-informacoes-da-vistoria h2 { margin: 0px; font-size: 14px; border-bottom: solid #c0c0c0 1px; padding-bottom: 2px; font-weight: 700; }
          .campos { width: 100%; margin-top: 9px; display: flex; flex-direction: column; gap: 4px; }
          .linha-campos { display: flex; width: 100%; gap: 4px; align-items: stretch; }
          .formatacao-campos { display: flex; background-color: #d9d9d9; border: solid rgb(255, 255, 255) 1px; padding: 2px; align-items: baseline; }
          .formatacao-campos > strong { font-size: 12px; margin-left: 2px; white-space: nowrap; }
          .formatacao-campos > p { margin: 0px; font-size: 12px; margin-left: 3px; word-wrap: break-word; }
          .valor-campo { text-transform: capitalize; }
          .campo-curto { width: 170px; flex-shrink: 0; min-height: 100%; }
          .campo-longo { flex: 1; min-height: 100%; }
          .div-metodologia { margin-top: 17px; }
          .div-metodologia > h1 { font-size: 14px; border-bottom: solid #c0c0c0 1px; margin: 0; padding-bottom: 2px; font-weight: 700; }
          .div-metodologia > p { font-weight: 400; font-size: 16px; text-align: justify; margin: 10px 0; line-height: 1.4; }
        `}</style>
        
        {/* Espaço reservado para o topo (logo removida conforme pedido) */}
        <div style={{ height: '35px' }}></div>
        
        <div className="div-laudo-de-vistoria">
          <h1>LAUDO DE VISTORIA</h1>
        </div>
        
        <div className="div-informacoes-da-vistoria">
          <h2>INFORMAÇÕES DA VISTORIA</h2>

          <div className="campos">
            <div className="linha-campos">
              <div className="formatacao-campos campo-curto">
                <strong>Uso:</strong>
                <p className="valor-campo">{(laudo.tipoUso || 'Industrial').toLowerCase()}</p>
              </div>
              <div className="formatacao-campos campo-longo">
                <strong>Endereço:</strong>
                <p>{laudo.endereco}</p>
              </div>
            </div>

            <div className="linha-campos">
              <div className="formatacao-campos campo-curto">
                <strong>Tipo:</strong>
                <p className="valor-campo">{(laudo.tipoImovel || laudo.tipo || '').toLowerCase()}</p>
              </div>
              <div className="formatacao-campos campo-longo">
                <strong>CEP:</strong>
                <p>{laudo.cep}</p>
              </div>
            </div>

            <div className="linha-campos">
              <div className="formatacao-campos campo-curto">
                <strong>Unidade:</strong>
                <p>{laudo.numero || ''}</p>
              </div>
              <div className="formatacao-campos campo-longo">
                <strong>Tamanho do imóvel:</strong>
                <p>{laudo.tamanho || ''}</p>
              </div>
            </div>

            <div className="linha-campos">
              <div className="formatacao-campos campo-curto">
                <strong>Tipo de Vistoria:</strong>
                <p className="valor-campo">{(laudo.tipoVistoria || '').toLowerCase()}</p>
              </div>
              <div className="formatacao-campos campo-longo">
                <strong>Realizada em:</strong>
                <p></p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="div-metodologia">
          <h1>METODOLOGIA</h1>
          {METODOLOGIA_TEXTS.map((text, index) => (
            <p key={index}>{text}</p>
          ))}
        </div>
      </div>
    );
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
              disabled={gerandoPdf || (loading && !hasCover && imagensComUrls.length === 0)}
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

      {/* Grid de Imagens ou Capa */}
      <div className="flex items-start justify-center min-h-[600px] py-8 relative">
        {loading && (
          <div className="absolute inset-0 flex items-start justify-center pt-20 z-10 bg-gray-50 bg-opacity-50">
             <div className="bg-white p-4 rounded-full shadow-lg">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
             </div>
          </div>
        )}
        
        {hasCover && paginaAtual === 1 ? (
          renderCoverPage()
        ) : (
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
                const ambienteSemNumero = img.ambiente?.replace(/^\d+\s*-\s*/, '') || img.ambiente;
                const isEditing = editingId === img.id;
                
                return (
                <div key={img.id}>
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
        )}
      </div>

      {gerandoPdf && progresso > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Gerando PDF Completo</h3>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all"
                style={{ width: `${progresso}%` }}
              ></div>
            </div>
            <Button variant="outline" onClick={handleCancelar} className="w-full">
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
