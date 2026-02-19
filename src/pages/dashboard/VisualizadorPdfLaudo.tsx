import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { laudosService, Laudo } from '../../services/laudos';
import { pdfService } from '../../services/pdfService';
import { useAuth } from '../../contexts/AuthContext';
import { useQueueSocket } from '../../hooks/useQueueSocket';
import { LaudoSection } from '../../types/laudo-details';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import Button from '../../components/ui/Button';
import { QRCodeSVG } from 'qrcode.react';
import { Save, Check, Loader2 } from 'lucide-react';

// Função auxiliar para normalizar nomes de seções (cópia simplificada de LaudoDetalhes)
const normalizeSectionName = (name: string): string => {
  return name.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "");
};

// Mapeamento de seção -> campo de dados
const SECTION_FIELD_MAP: Record<string, { dataKey: string; fields?: string[] }> = {
  [normalizeSectionName("Atestado da vistoria")]: { dataKey: "atestado" },
  [normalizeSectionName("Análises Hidráulicas")]: { dataKey: "analisesHidraulicas", fields: ["fluxo_agua", "vazamentos"] },
  [normalizeSectionName("Análises Elétricas")]: { dataKey: "analisesEletricas", fields: ["funcionamento", "disjuntores"] },
  [normalizeSectionName("Sistema de ar")]: { dataKey: "sistemaAr", fields: ["ar_condicionado", "aquecimento"] },
  [normalizeSectionName("Mecanismos de abertura")]: { dataKey: "mecanismosAbertura", fields: ["portas", "macanetas", "janelas"] },
  [normalizeSectionName("Revestimentos")]: { dataKey: "revestimentos", fields: ["tetos", "pisos", "bancadas"] },
  [normalizeSectionName("Mobilias")]: { dataKey: "mobilias", fields: ["fixa", "nao_fixa"] },
};

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

const METODOLOGIA_SAIDA_TEXTS = [
  "Este documento traz como condições de devolução do imóvel, o qual será utilizado para averiguação comparativa com a vistoria de entrada, a fim de constatar possíveis divergências que possam ter surgido no decorrer da locação.",
  "Caberá às partes utilizar as análises apresentadas neste laudo como base comparativa com o laudo anterior, considerando o grau de relevância dos apontamentos, a atribuição de responsabilidade e a necessidade de reparo imediato dos danos causados pela locatária durante o período de uso. Conforme estabelece o art. 23, inciso III, da Lei nº 8.245/91, cabe ao locatário a restituição do imóvel no mesmo estado em que o recebeu, de acordo com o laudo de vistoria inicial. Deve-se analisar, em especial, equipamentos elétricos, quadros de distribuição de energia, instalações hidráulicas e elétricas, sistemas de ar condicionado, sistemas de aquecimento em geral ou danos decorrentes do mau uso, tais como: danos ao encanamento provocados pelo descarte de objetos em ralos e vasos sanitários, conservação de móveis, eletrodomésticos ou bens de razão estrutural, como portas, janelas, esquadrias, pias, armários, entre outros.",
  "O método utilizado na vistoria consiste em uma análise meticulosa, baseando-se em procedimentos técnicos para avaliar todos os aspectos relevantes, desde apontamentos estruturais visíveis até pequenos detalhes construtivos e acessórios presentes no imóvel. Todos os aspectos são registrados de forma clara e objetiva, por textos e imagens, incluindo qualquer apontamento ou irregularidade aparente, salvo vício oculto. A abordagem é imparcial, e as fotos de cada ambiente trazem todos os ângulos necessários, como paredes, pisos, tetos, portas e janelas, entre outros que compõem o imóvel e suas instalações. As imagens são agrupadas e numeradas por ambiente, de modo que, mesmo na ausência de texto descrevendo algum apontamento, poderão ser identificadas por meio da interpretação dos registros fotográficos.",
  "Os registros encontrados como irregularidades ou avarias são indicados neste laudo de vistoria pela menção da palavra \"APONTAMENTO\"."
];

// Componente wrapper para escalar o PDF em telas menores
const PdfWrapper = ({ children }: { children: React.ReactNode }) => {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      // Consideramos p-6 (24px * 2) do container pai + margem de segurança
      // Disponível = largura da janela - ~64px
      const availableWidth = window.innerWidth - 64; 
      const pdfBaseWidth = 794; // 210mm em pixels (aprox)

      // Se a área disponível for menor que a largura do PDF, aplica escala
      if (availableWidth < pdfBaseWidth) {
        setScale(availableWidth / pdfBaseWidth);
      } else {
        setScale(1);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div 
      style={{ 
        width: '100%',
        // Ajusta a altura do container baseado na escala
        // 297mm é a altura fixa da página A4
        height: scale < 1 ? `calc(297mm * ${scale})` : '297mm',
        display: 'flex', 
        justifyContent: 'center',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          width: '210mm',
          height: '297mm', // Altura fixa A4
          flexShrink: 0
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default function VisualizadorPdfLaudo() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const handleVoltar = () => {
    const from = (location.state as any)?.from;
    if (from) {
      navigate(from);
    } else {
      // Fallback inteligente baseada no cargo
      const isAdmin = user?.role === 'ADMIN' || user?.role === 'DEV';
      navigate(isAdmin ? '/admin/laudos' : '/dashboard/laudos');
    }
  };

  const [laudo, setLaudo] = useState<Laudo | null>(null);
  const [imagensComUrls, setImagensComUrls] = useState<any[]>([]);
  const [ambientes, setAmbientes] = useState<any[]>([]);
  const [detalhes, setDetalhes] = useState<any>(null); // Armazena o objeto completo com availableSections
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
  const wasTriggeredRef = useRef(false);
  const originalLegendasRef = useRef<Record<string, string>>({});
  const pagesCache = useRef<Record<number, any[]>>({});

  const hasCover = true;

  useEffect(() => {
    carregarConfiguracoes();
    if (id) {
      carregarLaudo();
    }
  }, [id]);

  useEffect(() => {
    if (id && laudo) {
      if (ambientes.length === 0) {
        carregarAmbientes();
      }
      carregarImagens();
    }
  }, [id, paginaAtual, laudo?.id]);

  const carregarAmbientes = async () => {
    if (!id) return;
    try {
      const response = await laudosService.getAmbientes(id, 1, 100);
      
      setAmbientes(response.data);

    } catch (error) {
      console.error('Erro ao carregar ambientes:', error);
    }
  };

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
      
      // Carregar detalhes completos (perguntas e respostas dinâmicas)
      try {
        const details = await laudosService.getLaudoDetalhes(id);
        setDetalhes(details);
      } catch (err) {
        console.error('Erro ao carregar detalhes dinâmicos:', err);
      }

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
      
           const response = await laudosService.getImagensPdf(id, 1, 12);
           const isEntrada = ((response.data?.[0]?.laudo?.tipoVistoria || '') + (laudo?.tipoVistoria || '')).toLowerCase().includes('entrada');
           
           // Se for Entrada: Capa + Termos + Imagens + Relatório + Assinaturas = Total + 4
           // Se não for Entrada: Apenas Imagens = Total (ajustar conforme necessidade)
           const adicional = hasCover ? 4 : 0;
           
           setTotalPaginas(response.meta.totalPages + adicional);
           setTotalImagens(response.meta.totalImages);
      return;
    }

    // Se for página de Termos (Página 2), não carrega imagens
    if (hasCover && paginaAtual === 2) {
      setImagensComUrls([]);
      setLoading(false);
      return;
    }

    // Se for página de Relatório (Penúltima Página), não carrega imagens
    if (hasCover && paginaAtual === totalPaginas - 1) {
      setImagensComUrls([]);
      setLoading(false);
      return;
    }

    // Se for página de Assinaturas (Última Página), não carrega imagens
    if (hasCover && paginaAtual === totalPaginas) {
      setImagensComUrls([]);
      setLoading(false);
      return;
    }

    // Calculo da página do backend (Pagina 1 do backend começa na página 3 do visualizador se tiver capa)
    const backendPage = hasCover ? paginaAtual - 2 : paginaAtual;

    if (pagesCache.current[paginaAtual]) {
      setImagensComUrls(pagesCache.current[paginaAtual]);
      return;
    }

    try {
      setLoading(true);
      const response = await laudosService.getImagensPdf(id, backendPage, 12);
      
      setTotalPaginas(hasCover ? response.meta.totalPages + 4 : response.meta.totalPages);
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

  const [editedFields, setEditedFields] = useState<Partial<Laudo>>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleFieldChange = (field: keyof Laudo | 'dataVistoria', value: any) => {
    setLaudo(prev => prev ? ({ ...prev, [field]: value }) : null);
    setEditedFields(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveChanges = async () => {
    if (!id || Object.keys(editedFields).length === 0) return;
    
    setIsSaving(true);
    try {
      await laudosService.updateLaudo(id, editedFields as any);
      toast.success('Alterações salvas com sucesso!');
      setEditedFields({});
    } catch (error) {
      toast.error('Erro ao salvar alterações');
      console.error(error);
    } finally {
      setIsSaving(false);
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

  // Hook do WebSocket
  const { joinLaudo, leaveLaudo, pdfProgressMap } = useQueueSocket();

  // Entrar na sala do socket
  useEffect(() => {
    if (id) joinLaudo(id);
    return () => { if (id) leaveLaudo(id); };
  }, [id, joinLaudo, leaveLaudo]);

  // Monitorar progresso do PDF via Socket
  useEffect(() => {
    if (!id || !laudo) return;
    
    // Verificar estado inicial do laudo (se já estava processando quando carregou)
    if (laudo.pdfStatus === 'PROCESSING' || laudo.pdfStatus === 'PENDING') {
        setGerandoPdf(true);
        if (laudo.pdfProgress) setProgresso(laudo.pdfProgress);
    } else if (laudo.pdfStatus === 'COMPLETED') {
        setGerandoPdf(false);
        setProgresso(100);
    }

    const update = pdfProgressMap[id];
    if (update) {
        if (update.status === 'PROCESSING' || update.status === 'PENDING') {
            setGerandoPdf(true);
            setProgresso(update.progress);
        } else if (update.status === 'COMPLETED') {
            setGerandoPdf(false);
            setProgresso(100);
            
            const isFirstLoad = !laudo.pdfUrl && update.url;
            const isUpdated = update.url && laudo.pdfUrl !== update.url;

            if (update.url && (isFirstLoad || isUpdated)) {
                toast.success('PDF gerado com sucesso!');
                setLaudo(prev => prev ? ({ ...prev, pdfUrl: update.url, pdfStatus: 'COMPLETED' }) : null);
            }

            // Abre automaticamente se foi acionado pelo usuário nesta sessão
            if (wasTriggeredRef.current && update.url) {
                window.open(update.url, '_blank');
                wasTriggeredRef.current = false;
            }
        } else if (update.status === 'ERROR') {
            setGerandoPdf(false);
            setProgresso(0);
            wasTriggeredRef.current = false;
            toast.error(`Erro na geração do PDF: ${update.error || 'Desconhecido'}`);
            setLaudo(prev => prev ? ({ ...prev, pdfStatus: 'ERROR' }) : null);
        }
    }
  }, [pdfProgressMap, id, laudo?.pdfStatus]); // Dependência cuidadosa para evitar loops


  const handleGerarPdfCompleto = async () => {
    if (!id || !laudo) return;

    // Se já tem PDF pronto e não está processando, abre o link
    if (laudo.pdfUrl && laudo.pdfStatus === 'COMPLETED') {
        window.open(laudo.pdfUrl, '_blank');
        return;
    }

    iniciarGeracao();
  };

  const handleRegenerarPdf = async () => {
      // Força a geração mesmo se já existir
      iniciarGeracao();
  };

  const iniciarGeracao = async () => {
    if (!id) return;
    try {
      setGerandoPdf(true);
      setProgresso(0);
      wasTriggeredRef.current = true;
      
      await laudosService.requestPdfGeneration(id);
      
      toast.info('Geração de PDF iniciada no servidor. Aguarde...');
      
      // O progresso será atualizado pelo useEffect do socket
    } catch (error: any) {
      console.error(error);
      setGerandoPdf(false);
      
      // Se o erro for "já está processando" ou "já está na fila", avisa o usuário
      if (error.response?.status === 400 && 
          (error.response?.data?.message?.includes('processamento') || 
           error.response?.data?.message?.includes('fila'))) {
          toast.warning('O PDF já está sendo gerado ou está na fila. Aguarde.');
      } else {
          toast.error('Não foi possível iniciar a geração do PDF.');
      }
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
          position: 'relative',
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
          .valor-campo-input { 
              font-size: 12px; 
              margin-left: 3px; 
              border: 1px dashed transparent; 
              background: transparent; 
              font-family: inherit;
              padding: 0;
          }
          .valor-campo-input:hover, .valor-campo-input:focus {
              border-bottom: 1px dashed #666;
              outline: none;
          }
          .field-edited {
              border-bottom: 1px dashed #22c55e !important;
              background-color: #f0fdf4 !important;
          }
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
                <input 
                    className={`valor-campo-input ${editedFields.tipoUso ? 'field-edited' : ''}`}
                    style={{ flex: 1 }}
                    value={laudo.tipoUso || ''}
                    onChange={(e) => handleFieldChange('tipoUso', e.target.value)}
                    maxLength={200}
                />
              </div>
              <div className="formatacao-campos campo-longo">
                <strong>Endereço:</strong>
                <input 
                    className={`valor-campo-input ${editedFields.endereco ? 'field-edited' : ''}`}
                    style={{ flex: 1 }}
                    value={laudo.endereco || ''}
                    onChange={(e) => handleFieldChange('endereco', e.target.value)}
                    maxLength={200}
                />
              </div>
            </div>

            <div className="linha-campos">
              <div className="formatacao-campos campo-curto">
                <strong>Tipo:</strong>
                <input 
                    className={`valor-campo-input ${editedFields.tipoImovel ? 'field-edited' : ''}`}
                    style={{ flex: 1 }}
                    value={laudo.tipoImovel || laudo.tipo || ''}
                    onChange={(e) => handleFieldChange('tipoImovel', e.target.value)}
                    maxLength={200}
                />
              </div>
              <div className="formatacao-campos campo-longo">
                <strong>CEP:</strong>
                <input 
                    className={`valor-campo-input ${editedFields.cep ? 'field-edited' : ''}`}
                    style={{ flex: 1 }}
                    value={laudo.cep || ''}
                    onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9-]/g, '');
                        handleFieldChange('cep', val);
                    }}
                    maxLength={9}
                />
              </div>
            </div>

            <div className="linha-campos">
              <div className="formatacao-campos campo-curto">
                <strong>Unidade:</strong>
                <input 
                    className={`valor-campo-input ${editedFields.unidade ? 'field-edited' : ''}`}
                    style={{ flex: 1 }}
                    value={laudo.unidade || laudo.numero || ''}
                    onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        handleFieldChange('unidade', val);
                    }}
                    maxLength={20}
                />
              </div>
              <div className="formatacao-campos campo-longo">
                <strong>Tamanho do imóvel:</strong>
                <input 
                    className={`valor-campo-input ${editedFields.tamanho ? 'field-edited' : ''}`}
                    style={{ 
                        width: `${Math.max(20, (laudo.tamanho ? laudo.tamanho.replace(' m²', '').length : 1) * 8)}px`,
                        marginLeft: '4px',
                        flex: 'none'
                    }}
                    value={laudo.tamanho ? laudo.tamanho.replace(' m²', '') : ''}
                    onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '').substring(0, 10);
                        const finalVal = val ? `${val} m²` : '';
                        handleFieldChange('tamanho', finalVal);
                    }}
                    maxLength={10}
                />
                <span style={{ fontSize: '12px' }}>m²</span>
              </div>
            </div>

            <div className="linha-campos">
              <div className="formatacao-campos campo-curto">
                <strong>Tipo de Vistoria:</strong>
                <select 
                    className={`valor-campo-input ${editedFields.tipoVistoria ? 'field-edited' : ''}`}
                    value={(laudo.tipoVistoria || '').toUpperCase()}
                    onChange={(e) => handleFieldChange('tipoVistoria', e.target.value)}
                    style={{ background: 'transparent', border: 'none', flex: 1 }}
                >
                    <option value="ENTRADA">Entrada</option>
                    <option value="SAIDA">Saída</option>
                </select>
              </div>
              <div className="formatacao-campos campo-longo">
                <strong>Realizada em:</strong>
                <input 
                    type="date"
                    className={`valor-campo-input ${editedFields.dataVistoria ? 'field-edited' : ''}`}
                    style={{ flex: 1 }}
                    value={laudo.dataVistoria ? new Date(laudo.dataVistoria).toISOString().split('T')[0] : (laudo.createdAt ? new Date(laudo.createdAt).toISOString().split('T')[0] : '')}
                    onChange={(e) => handleFieldChange('dataVistoria', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="div-metodologia">
          <h1>METODOLOGIA</h1>
          {(laudo.tipoVistoria?.toLowerCase() === 'saída' || laudo.tipoVistoria?.toLowerCase() === 'saida' ? METODOLOGIA_SAIDA_TEXTS : METODOLOGIA_TEXTS).map((text, index) => (
            <p key={index}>{text}</p>
          ))}
        </div>

        {/* Número de página */}
        <div style={{
          position: 'absolute',
          bottom: '10mm',
          right: '15mm',
          fontFamily: '"Roboto", Arial, sans-serif',
          fontSize: '10px',
          color: '#555',
        }}>
          {paginaAtual}
        </div>
      </div>
    );
  };

  const renderInfoPage = () => {
    // Organizar ambientes em 4 colunas com máximo de 18 itens por coluna
    // Ajuste fino: 18 itens preenchem melhor a altura disponível sem estourar facilmente com textos de 2 linhas.
    const itemsPerColumn = 18;
    const columns = [[], [], [], []] as any[][];
    
    ambientes.forEach((amb, index) => {
      const colIndex = Math.floor(index / itemsPerColumn);
      if (colIndex < 4) {
        columns[colIndex].push({ ...amb, originalIndex: index + 1 });
      }
    });

    return (
      <div 
        id="pdf-grid-preview"
        style={{
          width: '210mm',
          height: '297mm',
          boxSizing: 'border-box',
          margin: '0 auto',
          padding: '20mm',
          backgroundColor: '#fff',
          overflow: 'hidden',
          position: 'relative',
          fontFamily: '"Roboto", Arial, sans-serif',
          color: 'black',
        }}
      >
        <style>{`
          .termos-gerais h2 { font-size: 14px; font-weight: 700; border-bottom: 1px solid #c0c0c0; padding-bottom: 4px; margin-bottom: 15px; text-transform: uppercase; }
          .termos-gerais p { font-size: 12px; text-align: justify; line-height: 1.5; margin-bottom: 15px; }
          .ambientes-section { margin-top: 30px; }
          .ambientes-section h2 { font-size: 14px; font-weight: 700; border-bottom: 1px solid #c0c0c0; padding-bottom: 4px; margin-bottom: 15px; text-transform: uppercase; }
          .ambientes-container { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 4px; }
          .ambiente-col { background-color: #d9d9d9; padding: 8px; min-height: 480px; display: flex; flex-direction: column; gap: 8px; }
          .ambiente-item { font-size: 11px; line-height: 1.2; word-wrap: break-word; }
        `}</style>
        
        <div style={{ height: '35px' }}></div>

        <div className="termos-gerais">
          <h2>Termos Gerais</h2>
          <p>
            É obrigação do locatário o reparo imediato dos danos causados por si mesmo ou por
            terceiros durante a vigência do contrato de locação, cabendo ao locatário restituir o
            imóvel no mesmo estado em que o recebeu, de acordo com este laudo de vistoria,
            comprometendo-se com o zelo e promovendo a manutenção preventiva do mesmo e de
            seus equipamentos porventura existentes, em especial, equipamentos elétricos, quadros
            de distribuição de energia, instalações hidráulicas, elétricas, sistemas de ar, sistema de
            aquecimento em geral ou danos decorrentes do mau uso, tais como: danos ao
            encanamento provocados pelo descarte de objetos em ralos, em vasos sanitários,
            conservação dos móveis ou de bens de razão estrutural, como portas, janelas, esquadrias,
            pias, gabinetes, entre outros.
          </p>
          <p>
            O locatário será isento de responsabilidade quanto aos desgastes naturais decorrentes do
            uso normal e zeloso do imóvel, desde que tais condições sejam compatíveis com o
            período de locação e não decorram de negligência, mau uso ou ausência de manutenção
            regular. Eventuais danos que ultrapassem o desgaste esperado ou sejam causados por
            uso inadequado serão de responsabilidade do locatário, firmando compromisso do uso
            zeloso pelo período em que se der início a locação até a efetiva devolução das chaves.
          </p>
        </div>

        <div className="ambientes-section">
          <h2>Ambientes</h2>
          <div className="ambientes-container">
            {columns.map((col, colIndex) => (
              <div key={colIndex} className="ambiente-col">
                {col.map((amb) => (
                  <div key={amb.ambiente} className="ambiente-item">
                    {amb.originalIndex}. {amb.ambiente.replace(/^\d+\s*-\s*/, '')}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Número de página */}
        <div style={{
          position: 'absolute',
          bottom: '10mm',
          right: '15mm',
          fontFamily: '"Roboto", Arial, sans-serif',
          fontSize: '10px',
          color: '#555',
        }}>
          {paginaAtual}
        </div>
      </div>
    );
  };




  // Renderiza uma pergunta e sua resposta, encapsulando a lógica de busca do valor
  const renderItemDinamico = (sectionName: string, questionText: string, questionId: string, index: number) => {
    if (!detalhes) return null;

    const normalizedKey = normalizeSectionName(sectionName);
    const mapping = SECTION_FIELD_MAP[normalizedKey];
    
    // Identificar a chave de dados (ex: analisesHidraulicas, dadosExtra, etc)
    let dataKey = mapping?.dataKey || normalizedKey;
    let fieldKey = mapping?.fields?.[index];

    // Buscar o objeto de dados da seção
    let sectionData = detalhes[dataKey];
    
    // Fallback: tentar buscar em dadosExtra
    // Importante: para seções órfãs, o nome da seção DEVE ser usado para buscar em dadosExtra
    if (!sectionData && detalhes.dadosExtra) {
         // Tenta pelo nome exato ou normalizado
         sectionData = detalhes.dadosExtra[sectionName] || detalhes.dadosExtra[normalizedKey];
    }
    
    // Parsing se for string JSON
    if (typeof sectionData === 'string' && sectionData.startsWith('{')) {
      try { sectionData = JSON.parse(sectionData); } catch {}
    }

    // Buscar o valor da resposta
    let value = '-';
    if (sectionData) {
      if (fieldKey && sectionData[fieldKey] !== undefined) {
         value = sectionData[fieldKey];
      } else if (typeof sectionData === 'string' && !fieldKey) {
         // CASO CRÍTICO: Se a seção é apenas uma string (ex: Atestado), retorna ela mesma
         value = sectionData;
      } else if (sectionData[questionText] !== undefined) {
         value = sectionData[questionText];
      } else if (sectionData[questionId] !== undefined) {
         value = sectionData[questionId];
      }
    }

    if (value === null || value === undefined || value === '') value = '-';
    if (typeof value === 'object') value = JSON.stringify(value);

    return (
      <div className="item-row" key={questionId || index}>
        <span className="item-label">{questionText}</span>
        <span className="item-valor">{String(value)}</span>
      </div>
    );
  };

  const renderRelatorioPage = () => {
    if (!laudo) return null;

    // 1. Preparar lista de seções oficiais
    const sections: any[] = [...(detalhes?.availableSections || [])];
    
    // Mapeamento de IDs para textos (para evitar UUIDs em labels extras na prévia)
    const questionIdToText = new Map<string, string>();
    sections.forEach(s => {
       s.questions?.forEach((q: any) => {
          if (q.id && q.questionText) {
             questionIdToText.set(q.id, q.questionText);
          }
       });
    });

    // 2. Identificar e adicionar seções órfãs (Dados Legados/Extras)
    if (detalhes?.dadosExtra) {
       Object.entries(detalhes.dadosExtra).forEach(([key, value]) => {
          const normalizedKey = normalizeSectionName(key);
          
          // Verifica se essa chave já existe nas seções oficiais (normalizando nomes)
          // Também checa se a chave do dadosExtra corresponde a algum dataKey oficial
          const isOfficial = sections.some(s => normalizeSectionName(s.name) === normalizedKey) ||
                           Object.values(SECTION_FIELD_MAP).some(m => m.dataKey === key);
          
          if (!isOfficial) {
             // Criar uma estrutura de seção compatível para renderização
             const questions = typeof value === 'object' && value !== null
                ? Object.keys(value).map(k => ({ id: k, questionText: questionIdToText.get(k) || k }))
                : [{ id: 'val', questionText: 'Descrição' }]; // Para strings simples

             sections.push({
                id: `extra-${key}`,
                name: key,
                questions: questions,
                isExtra: true
             });
          }
       });
    }

    // Distribuição em 2 colunas
    const mid = Math.ceil(sections.length / 2);
    const col1 = sections.slice(0, mid);
    const col2 = sections.slice(mid);

    return (
      <div 
        id="pdf-grid-preview"
        style={{
          width: '210mm',
          height: '297mm',
          boxSizing: 'border-box',
          margin: '0 auto',
          padding: '20mm',
          backgroundColor: '#fff',
          overflow: 'hidden',
          position: 'relative',
          fontFamily: '"Roboto", Arial, sans-serif',
          color: 'black',
        }}
      >
        <style>{`
           .relatorio-titulo { font-size: 14px; font-weight: 700; border-bottom: 2px solid #000; padding-bottom: 4px; margin-bottom: 20px; text-transform: uppercase; }
           .relatorio-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: start; }
           .relatorio-coluna { display: flex; flex-direction: column; gap: 10px; }
           .categoria-box { background-color: #999; color: #fff; padding: 5px 10px; font-weight: 700; margin-bottom: 2px; font-size: 11px; text-transform: uppercase; }
           .item-row { display: flex; align-items: center; justify-content: space-between; background-color: #d9d9d9; padding: 5px 10px; margin-bottom: 2px; font-size: 11px; }
           .item-label { font-weight: 500; }
           .item-valor { font-weight: 700; text-transform: uppercase; }
           .download-fotos-section { margin-top: 24px; border-top: 2px solid #000; padding-top: 10px; }
           .download-fotos-titulo { font-size: 13px; font-weight: 700; text-transform: uppercase; margin-bottom: 10px; }
           .download-fotos-content { display: flex; align-items: flex-start; gap: 20px; }
           .download-fotos-text { flex: 1; font-size: 11px; line-height: 1.6; text-align: justify; color: #000; margin: 0; }
           .download-fotos-qrcode img { width: 100px; height: 100px; display: block; }
           .encerramento-section { margin-top: 20px; padding-top: 0; }
           .encerramento-titulo { font-size: 13px; font-weight: 700; text-transform: uppercase; margin: 0 0 4px 0; }
           .encerramento-divisor { border: none; border-top: 2px solid #000; margin: 0 0 10px 0; }
           .encerramento-text { font-size: 11px; line-height: 1.6; text-align: justify; color: #000; margin: 0 0 8px 0; }
           .encerramento-fechamento { font-size: 11px; color: #000; margin: 0 0 20px 0; }
           .encerramento-rodape { position: absolute; bottom: 15mm; left: 20mm; right: 20mm; display: flex; align-items: flex-end; justify-content: space-between; }
           .encerramento-responsavel { font-size: 10px; font-weight: 700; line-height: 1.6; color: #000; }
           .encerramento-logo-bloco { display: flex; flex-direction: column; align-items: center; width: 170px; }
           .encerramento-logo-bloco img { width: 100%; height: auto; display: block; margin-bottom: 4px; }
           .encerramento-logo-nome { font-size: 9px; font-weight: 700; text-transform: uppercase; text-align: center; color: #000; width: 100%; letter-spacing: 0.5px; }
        `}</style>
        
        <div style={{ height: '35px' }}></div>

        <h2 className="relatorio-titulo">RELATÓRIO GERAL DE APONTAMENTO</h2>

        <div className="relatorio-grid">
          <div className="relatorio-coluna">
            {col1.map((section) => (
              <div key={section.id} className="grupo">
                <div className="categoria-box">{section.name}</div>
                {section.questions?.map((q: { questionText?: string; id: string }, idx: number) => 
                  renderItemDinamico(section.name, q.questionText || '', q.id, idx)
                )}
              </div>
            ))}
          </div>

          <div className="relatorio-coluna">
            {col2.map((section) => (
              <div key={section.id} className="grupo">
                <div className="categoria-box">{section.name}</div>
                {section.questions?.map((q: { questionText?: string; id: string }, idx: number) => 
                  renderItemDinamico(section.name, q.questionText || '', q.id, idx)
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Seção Download de Fotos com QR Code */}
        {(() => {
          const galeriaUrl = `${window.location.origin}/dashboard/laudos/${id}/galeria`;
          return (
            <div className="download-fotos-section">
              <div className="download-fotos-titulo">DOWNLOAD DE FOTOS</div>
              <div className="download-fotos-content">
                <p className="download-fotos-text">
                  Para maior conveniência e acessibilidade, as fotos poderão ser baixadas diretamente através do
                  QR Code fornecido neste documento. Ressaltamos que as imagens obtidas são adequadas para outras
                  análises e avaliações, independentemente do que estiver registrado em texto neste laudo. Esta
                  abordagem garante uma verificação visual completa e transparente das condições do imóvel.
                </p>
                <div className="download-fotos-qrcode">
                  <QRCodeSVG value={galeriaUrl} size={100} />
                </div>
              </div>
            </div>
          );
        })()}

        {/* Seção Encerramento */}
        <div className="encerramento-section">
          <div className="encerramento-titulo">ENCERRAMENTO</div>
          <hr className="encerramento-divisor" />
          <p className="encerramento-text">
            Encerra o presente termo, o qual certifica e dá fé dos registros apresentados.
          </p>
            <div className="encerramento-rodape">
            </div>
          </div>

        {/* Número de página */}
        <div style={{
          position: 'absolute',
          bottom: '10mm',
          right: '15mm',
          fontFamily: '"Roboto", Arial, sans-serif',
          fontSize: '10px',
          color: '#555',
        }}>
          {paginaAtual}
        </div>
      </div>
    );
  };

  const renderAssinaturasPage = () => {
    if (!laudo) return null;

    const dataRef = laudo.dataRelatorio || laudo.dataVistoria || laudo.createdAt || new Date().toISOString();
    const dataFull = new Date(dataRef);
    const dia = dataFull.getDate().toString().padStart(2, '0');
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const mes = meses[dataFull.getMonth()];
    const ano = dataFull.getFullYear();
    const cidadeDb = laudo.cidade || '';
    const cidade = (cidadeDb === '' || cidadeDb.toUpperCase() === 'SP') ? 'São Paulo' : cidadeDb;

    return (
      <div 
        id="pdf-grid-preview"
        style={{
          width: '210mm',
          height: '297mm',
          boxSizing: 'border-box',
          margin: '0 auto',
          padding: '20mm',
          backgroundColor: '#fff',
          overflow: 'hidden',
          position: 'relative',
          fontFamily: '"Roboto", Arial, sans-serif',
          color: 'black',
        }}
      >
        <style>{`
           .assinaturas-titulo { font-size: 14px; font-weight: 700; text-transform: uppercase; border-bottom: 1px solid #c0c0c0; padding-bottom: 4px; margin-bottom: 20px; }
           .assinaturas-texto { font-size: 11px; line-height: 1.6; text-align: justify; margin-bottom: 40px; }
           .assinaturas-data { text-align: center; font-size: 12px; margin-bottom: 60px; }
           
           .assinaturas-box-wrapper { position: relative; width: 100%; margin-bottom: 40px; }
           .assinaturas-box { display: flex; flex-direction: column; width: 100%; border: 1px solid #000; height: 120px; }
           .assinaturas-box-header { font-size: 11px; margin-bottom: 2px; text-transform: uppercase; position: absolute; top: -18px; left: 0; background: #fff; padding-right: 5px; z-index: 10; font-weight: 700; }
           .assinaturas-box-content { display: flex; height: 100%; }
           .assinaturas-box-col { flex: 1; display: flex; flex-direction: column; justify-content: flex-end; padding: 10px; position: relative; }
           .assinaturas-box-col:first-child { border-right: 1px solid #000; }
           .assinaturas-label { border-top: 1px solid #000; padding-top: 2px; font-size: 10px; width: 100%; }
           
           .testemunhas-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 20px; }
           .testemunha-item { display: flex; flex-direction: column; gap: 5px; }
           .testemunha-linha { display: flex; align-items: baseline; border-bottom: 1px solid #000; font-size: 11px; padding-bottom: 2px; }
           .testemunha-linha strong { margin-right: 5px; min-width: 40px; }
           
           .campo-input-assinatura {
             border: 1px dashed transparent;
             width: 100%;
             background: transparent;
             font-family: inherit;
             font-size: 10px;
             text-align: center;
             margin-bottom: 5px;
           }
           .campo-input-assinatura:hover, .campo-input-assinatura:focus {
             border-bottom: 1px dashed #666;
             outline: none;
           }
           .field-edited {
               border-bottom: 1px dashed #22c55e !important;
               background-color: #f0fdf4 !important;
           }
        `}</style>
        
        <div style={{ height: '35px' }}></div>
        
        <h2 className="assinaturas-titulo">ASSINATURAS</h2>
        
        <p className="assinaturas-texto">
          Declaram as partes estarem cientes das imagens e textos apresentados no presente
          termo, estando em conformidade com a vontade dos contratantes que, "As Partes e as
          testemunhas envolvidas neste instrumento afirmam e declaram que esse poderá ser
          assinado presencialmente ou eletronicamente, sendo as assinaturas consideradas
          válidas, vinculantes e executáveis, desde que firmadas pelos representantes legais das
          Partes. e pôr estarem justos e contratados, assinam o presente, para um só efeito, diante
          de 02 (duas) testemunhas.
        </p>

        <div className="assinaturas-data" style={{ textAlign: 'center', fontSize: '12px', marginBottom: '60px' }}>
          <span 
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => handleFieldChange('cidade', e.currentTarget.innerText)}
            className={`${editedFields.cidade ? 'bg-green-50 border-b border-dashed border-green-500' : ''}`}
            style={{ outline: 'none', cursor: 'text', minWidth: '10px', display: 'inline-block' }}
          >
            {cidade}
          </span>
          <span>, </span>
          <span
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => handleFieldChange('dataRelatorio', e.currentTarget.innerText)}
            className={`${editedFields.dataRelatorio ? 'bg-green-50 border-b border-dashed border-green-500' : ''}`}
            style={{ outline: 'none', cursor: 'text', minWidth: '10px', display: 'inline-block' }}
          >
            {laudo.dataRelatorio || `${dia} de ${mes} de ${ano}`}
          </span>
        </div>

        {/* LOCADOR */}
        <div className="assinaturas-box-wrapper">
            <div className="assinaturas-box-header">LOCADOR(A)</div>
            <div className="assinaturas-box">
            <div className="assinaturas-box-content">
                <div className="assinaturas-box-col">
                    <input 
                        className={`campo-input-assinatura ${editedFields.locadorNome ? 'field-edited' : ''}`}
                        placeholder="Nome do Locador"
                        value={laudo.locadorNome || ''}
                        onChange={(e) => handleFieldChange('locadorNome', e.target.value)}
                    />
                    <div className="assinaturas-label">Qualificação / Nome</div>
                </div>
                <div className="assinaturas-box-col">
                    <input 
                        className={`campo-input-assinatura ${editedFields.locadorAssinatura ? 'field-edited' : ''}`}
                        placeholder="Assinatura locador"
                        value={laudo.locadorAssinatura || ''}
                        onChange={(e) => handleFieldChange('locadorAssinatura', e.target.value)}
                    />
                    <div className="assinaturas-label">Assinatura</div>
                </div>
            </div>
            </div>
        </div>

        {/* LOCATÁRIO */}
        <div className="assinaturas-box-wrapper">
            <div className="assinaturas-box-header">LOCATÁRIO(A)</div>
            <div className="assinaturas-box">
            <div className="assinaturas-box-content">
                <div className="assinaturas-box-col">
                    <input 
                        className={`campo-input-assinatura ${editedFields.locatarioNome ? 'field-edited' : ''}`}
                        placeholder="Nome do Locatário"
                        value={laudo.locatarioNome || ''}
                        onChange={(e) => handleFieldChange('locatarioNome', e.target.value)}
                    />
                    <div className="assinaturas-label">Qualificação / Nome</div>
                </div>
                <div className="assinaturas-box-col">
                    <input 
                        className={`campo-input-assinatura ${editedFields.locatarioAssinatura ? 'field-edited' : ''}`}
                        placeholder="Assinatura locatário"
                        value={laudo.locatarioAssinatura || ''}
                        onChange={(e) => handleFieldChange('locatarioAssinatura', e.target.value)}
                    />
                    <div className="assinaturas-label">Assinatura</div>
                </div>
            </div>
            </div>
        </div>

        {/* TESTEMUNHAS */}
        <div className="testemunhas-grid">
            <div className="testemunha-item">
                <div className="testemunha-linha">
                    <strong>Nome:</strong>
                    <input 
                        style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', borderBottom: '1px dashed transparent' }}
                        className={`${editedFields.testemunha1Nome ? 'field-edited' : ''}`}
                        value={laudo.testemunha1Nome || ''}
                        onChange={(e) => handleFieldChange('testemunha1Nome', e.target.value)}
                        placeholder="Nome Testemunha 1"
                    />
                </div>
                <div className="testemunha-linha">
                    <strong>RG:</strong>
                    <input 
                        style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', borderBottom: '1px dashed transparent' }}
                        className={`${editedFields.testemunha1Rg ? 'field-edited' : ''}`}
                        value={laudo.testemunha1Rg || ''}
                        onChange={(e) => handleFieldChange('testemunha1Rg', e.target.value)}
                        placeholder="RG Testemunha 1"
                    />
                </div>
            </div>

            <div className="testemunha-item">
                <div className="testemunha-linha">
                    <strong>Nome:</strong>
                    <input 
                        style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', borderBottom: '1px dashed transparent' }}
                        className={`${editedFields.testemunha2Nome ? 'field-edited' : ''}`}
                        value={laudo.testemunha2Nome || ''}
                        onChange={(e) => handleFieldChange('testemunha2Nome', e.target.value)}
                        placeholder="Nome Testemunha 2"
                    />
                </div>
                <div className="testemunha-linha">
                    <strong>RG:</strong>
                    <input 
                        style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', borderBottom: '1px dashed transparent' }}
                        className={`${editedFields.testemunha2Rg ? 'field-edited' : ''}`}
                        value={laudo.testemunha2Rg || ''}
                        onChange={(e) => handleFieldChange('testemunha2Rg', e.target.value)}
                        placeholder="RG Testemunha 2"
                    />
                </div>
            </div>

            {/* Número de página */}
            <div style={{
              position: 'absolute',
              bottom: '10mm',
              right: '15mm',
              fontFamily: '"Roboto", Arial, sans-serif',
              fontSize: '10px',
              color: '#555',
            }}>
              {paginaAtual}
            </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4 md:gap-0">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <button
              onClick={handleVoltar}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Voltar
            </button>
            <h1 className="text-xl md:text-2xl font-bold truncate">Visualizador de PDF</h1>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
            {/* Botão Salvar (Apenas se houver alterações) */}
            {Object.keys(editedFields).length > 0 && (
                <Button
                    onClick={handleSaveChanges}
                    disabled={isSaving}
                    variant="primary"
                    className="w-full sm:w-auto justify-center bg-green-600 hover:bg-green-700 text-white border-0 shadow-lg shadow-green-900/20"
                >
                    {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                        <Save className="w-4 h-4 mr-2" />
                    )}
                    Salvar Alterações
                </Button>
            )}

            {/* Botão Secundário: Gerar Novamente (Apenas se já concluído) */}
            {laudo?.pdfStatus === 'COMPLETED' && !gerandoPdf && (
                <Button
                    variant="secondary"
                    onClick={handleRegenerarPdf}
                    disabled={gerandoPdf}
                    className="w-full sm:w-auto justify-center bg-slate-800 hover:bg-slate-700 text-white border-0 shadow-lg shadow-black/20"
                >
                    Gerar Novamente
                </Button>
            )}

            <Button
              variant="primary"
              onClick={handleGerarPdfCompleto}
              disabled={gerandoPdf || totalPaginas === 0}
              className={`w-full sm:w-auto justify-center ${gerandoPdf ? 'opacity-80 cursor-wait' : ''}`}
            >
               {gerandoPdf ? (
                 <>
                   <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                   {progresso > 0 ? `Processando ${progresso}%` : 'Solicitando...'}
                 </>
               ) : (
                 'Baixar PDF' // Ajustado texto para consistência
               )}
            </Button>
          </div>
        </div>

        {/* Paginação */}
        <div className="flex flex-col md:flex-row items-center justify-between bg-white rounded-lg shadow-sm p-4 gap-4 md:gap-0">
          <div className="text-sm text-gray-600 text-center md:text-left">
            Página {paginaAtual} de {totalPaginas} • {totalImagens} imagens no total
          </div>

          <div className="flex items-center justify-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
              disabled={paginaAtual === 1 || loading}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex-1 sm:flex-none justify-center"
            >
              ← Anterior
            </button>
            
            <span className="px-4 py-2 text-gray-700 whitespace-nowrap">
              {paginaAtual} / {totalPaginas}
            </span>

            <button
              onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
              disabled={paginaAtual === totalPaginas || loading}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex-1 sm:flex-none justify-center"
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
        
        <PdfWrapper>
          {hasCover && paginaAtual === 1 ? (
            renderCoverPage()
          ) : hasCover && paginaAtual === 2 ? (
            renderInfoPage()
          ) : hasCover && paginaAtual === totalPaginas - 1 ? (
            renderRelatorioPage()
          ) : hasCover && paginaAtual === totalPaginas ? (
            renderAssinaturasPage()
          ) : (
            <div
              id="pdf-grid-preview"
              className={`bg-white transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'}`}
              style={{
                width: '210mm',
                padding: `${configuracoes.margemPagina}px`,
                height: '297mm',
                color: 'black',
                position: 'relative',
                fontFamily: '"Roboto", Arial, sans-serif',
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
                          <span className="font-bold mr-1">
                            {img.numeroAmbiente} ({img.numeroImagemNoAmbiente})
                          </span>
                          {img.legenda || <span className="text-gray-400 italic">Sem legenda</span>}
                        </div>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>

              {/* Número de página */}
              <div style={{
                position: 'absolute',
                bottom: '10mm',
                right: '15mm',
                fontFamily: '"Roboto", Arial, sans-serif',
                fontSize: '10px',
                color: '#555',
              }}>
                {paginaAtual}
              </div>
            </div>
          )}
        </PdfWrapper>
      </div>

      {gerandoPdf && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 max-w-md w-full border border-white/20 dark:border-slate-800"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              </div>
              
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Gerando PDF
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm">
                Estamos processando as imagens e organizando o laudo completo...
              </p>

              <div className="w-full mb-2">
                <div className="flex justify-between text-sm font-medium mb-2">
                  <span className="text-slate-600 dark:text-slate-300">Progresso</span>
                  <span className="text-primary">{progresso}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                  <motion.div
                    className="bg-gradient-to-r from-primary to-purple-600 h-full transition-all duration-300"
                    initial={{ width: 0 }}
                    animate={{ width: `${progresso}%` }}
                  />
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
