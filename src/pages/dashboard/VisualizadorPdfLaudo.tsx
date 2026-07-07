import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  laudosService,
  Laudo,
  Contestacao,
  ApontamentoImagem,
} from "../../services/laudos";
import { pdfService } from "../../services/pdfService";
import { useAuth } from "../../contexts/AuthContext";
import { useQueueSocket } from "../../hooks/useQueueSocket";
import { LaudoSection } from "../../types/laudo-details";
import { toast } from "sonner";
import { motion } from "framer-motion";
import Button from "../../components/ui/Button";
import { DamageMarkerOverlay } from "../../components/laudo/DamageMarkerOverlay";
import { QRCodeSVG } from "qrcode.react";
import { Save, Check, Loader2, Type, X, Pencil } from "lucide-react";
import LogoCapaEditavel, {
  LogoCapaValue,
} from "../../components/laudo/LogoCapaEditavel";
import RodapeEditor from "../../components/laudo/RodapeEditor";
import EditImagemModal from "../../components/laudo/EditImagemModal";
import PhotoCardActionsOverlay from "../../components/laudo/PhotoCardActionsOverlay";
import ConfirmModal from "../../components/ui/ConfirmModal";

// Função auxiliar para normalizar nomes de seções (cópia simplificada de LaudoDetalhes)
const normalizeSectionName = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "");
};

// Mapeamento de seção -> campo de dados
const SECTION_FIELD_MAP: Record<
  string,
  { dataKey: string; fields?: string[] }
> = {
  [normalizeSectionName("Atestado da vistoria")]: { dataKey: "atestado" },
  [normalizeSectionName("Análises Hidráulicas")]: {
    dataKey: "analisesHidraulicas",
    fields: ["fluxo_agua", "vazamentos"],
  },
  [normalizeSectionName("Análises Elétricas")]: {
    dataKey: "analisesEletricas",
    fields: ["funcionamento", "disjuntores"],
  },
  [normalizeSectionName("Sistema de ar")]: {
    dataKey: "sistemaAr",
    fields: ["ar_condicionado", "aquecimento"],
  },
  [normalizeSectionName("Mecanismos de abertura")]: {
    dataKey: "mecanismosAbertura",
    fields: ["portas", "macanetas", "janelas"],
  },
  [normalizeSectionName("Revestimentos")]: {
    dataKey: "revestimentos",
    fields: ["tetos", "pisos", "bancadas"],
  },
  [normalizeSectionName("Mobilias")]: {
    dataKey: "mobilias",
    fields: ["fixa", "nao_fixa"],
  },
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
  // Flag per-imagem: quando true, esta foto foi enviada com a opção
  // "Usar nome do arquivo como legenda" ativa. O PDF preview suprime o
  // prefixo "Nº amb (Nº foto)" e mostra apenas a legenda.
  usarNomeArquivoComoLegenda?: boolean;
  // Coordenadas normalizadas (0..1) do círculo de avaria. Mesmo
  // formato da `DamageMarker` da galeria (coords da imagem original,
  // não do container).
  damageMarker?: { x: number; y: number; r: number } | null;
}

const METODOLOGIA_TEXTS = [
  "Este documento tem como objetivo garantir às partes da locação o registro do estado de entrega do imóvel, integrando-se como anexo ao contrato formado. Ele concilia as obrigações contratuais e serve como referência para a aferição de eventuais alterações no imóvel ao longo do período de uso.",
  "O laudo de vistoria foi elaborado de maneira técnica por um especialista qualificado, que examinou critérios específicos para avaliar todos os aspectos relevantes, desde apontamentos estruturais aparentes até pequenos detalhes construtivos e acessórios presentes no imóvel. O objetivo foi registrar, de forma clara e objetiva, por meio de textos e imagens, qualquer apontamento ou irregularidade, garantindo uma abordagem sistemática, imparcial e organizada em ordem cronológica, com separação por ambientes e legendas contidas e numerações sequenciais.",
  "O documento inclui fotos de todas as paredes, pisos, tetos, portas, janelas e demais elementos que compõem o imóvel e suas instalações. As imagens foram capturadas com angulação precisa, permitindo análises previstas do estado de conservação atual do imóvel e verificações futuras. Fica reservado o direito, a qualquer tempo, das partes identificadas, por meio das imagens, qualquer ponto que não tenha sido especificado por escrito.",
  'Os registros identificados como irregularidades ou avarias estão destacados neste laudo sob a denominação "APONTAMENTOS" e podem ser facilmente localizados utilizando o recurso de busca por palavras.',
  'Este laudo não emprega termos subjetivos, como "bom", "regular" ou "ótimo" estado, nas análises. A descrição foi construída de forma objetiva, baseada exclusivamente em fatos observáveis, com o objetivo de evitar interpretações divergentes que possam surgir de perspectivas pessoais e garantir que as informações registradas sejam precisas e imparciais.',
  'Os elementos adicionais ao imóvel, como acessórios, eletrodomésticos, equipamentos de arcondicionado, dispositivos em geral, lustres ou luminárias, mobília não embutida, entre outros, serão identificados no laudo pela denominação "ITEM".',
];

const METODOLOGIA_SAIDA_TEXTS = [
  "Este documento traz como condições de devolução do imóvel, o qual será utilizado para averiguação comparativa com a vistoria de entrada, a fim de constatar possíveis divergências que possam ter surgido no decorrer da locação.",
  "Caberá às partes utilizar as análises apresentadas neste laudo como base comparativa com o laudo anterior, considerando o grau de relevância dos apontamentos, a atribuição de responsabilidade e a necessidade de reparo imediato dos danos causados pela locatária durante o período de uso. Conforme estabelece o art. 23, inciso III, da Lei nº 8.245/91, cabe ao locatário a restituição do imóvel no mesmo estado em que o recebeu, de acordo com o laudo de vistoria inicial. Deve-se analisar, em especial, equipamentos elétricos, quadros de distribuição de energia, instalações hidráulicas e elétricas, sistemas de ar condicionado, sistemas de aquecimento em geral ou danos decorrentes do mau uso, tais como: danos ao encanamento provocados pelo descarte de objetos em ralos e vasos sanitários, conservação de móveis, eletrodomésticos ou bens de razão estrutural, como portas, janelas, esquadrias, pias, armários, entre outros.",
  "O método utilizado na vistoria consiste em uma análise meticulosa, baseando-se em procedimentos técnicos para avaliar todos os aspectos relevantes, desde apontamentos estruturais visíveis até pequenos detalhes construtivos e acessórios presentes no imóvel. Todos os aspectos são registrados de forma clara e objetiva, por textos e imagens, incluindo qualquer apontamento ou irregularidade aparente, salvo vício oculto. A abordagem é imparcial, e as fotos de cada ambiente trazem todos os ângulos necessários, como paredes, pisos, tetos, portas e janelas, entre outros que compõem o imóvel e suas instalações. As imagens são agrupadas e numeradas por ambiente, de modo que, mesmo na ausência de texto descrevendo algum apontamento, poderão ser identificadas por meio da interpretação dos registros fotográficos.",
  'Os registros encontrados como irregularidades ou avarias são indicados neste laudo de vistoria pela menção da palavra "APONTAMENTO".',
];

const METODOLOGIA_CONSTATACAO_TEXTS = [
  "As partes recebem o laudo para averiguação de diferenças que possam ter surgido no curso da locação, cabendo ao LOCADOR e LOCATÁRIO avaliarem e ajustarem possíveis acertos apontados pelos registros fotográficos, seja de benfeitorias ou irregularidades.",
  "A vistoria foi realizada através de uma análise meticulosa baseando-se em procedimentos técnicos específicos, onde a equipe responsável pela vistoria empregou critérios rigorosos para avaliar todos os aspectos relevantes, desde apontamentos estruturais visíveis, até pequenos detalhes construtivos, buscando registrar, de forma clara e objetiva, por textos e imagens, qualquer apontamento ou irregularidade, garantindo uma abordagem sistemática e imparcial, onde as fotos de cada ambiente trazem todos os ângulos necessários de paredes, chãos, tetos, portas, janelas entre outros que componham o imóvel e suas instalações, sendo agrupadas e numeradas por ambientes, o qual, mesmo não estando relacionado algum apontamento em forma de texto poderá ser identificado através da interpretação dos registros fotográficos.",
  "Este relatório visa fornecer um documento fiel e imparcial para dirimir eventuais dúvidas entre as partes interessadas.",
];

const METODOLOGIA_PERIODICA_TEXTS = [
  "O presente laudo foi elaborado com a finalidade de verificar eventuais ocorrências surgidas durante o período de locação, especialmente aquelas que apresentem divergências em relação às condições originalmente pactuadas ou ao estado de conservação constatado no ato da entrega do imóvel. Tais divergências podem envolver benfeitorias executadas ou irregularidades identificadas, devidamente registradas neste documento, o qual caberá ao LOCADOR avaliar referências para atribui-la a preexistente ou pós-ocupação.",
  "A metodologia aplicada fundamentou-se em uma inspeção técnica detalhada de todos os ambientes do imóvel, acompanhada de registro fotográfico sistemático, realizada em ordem cronológica, assegurando rastreabilidade e fidedignidade das informações e foi elaborado de maneira técnica por um especialista qualificado, que examinou critérios específicos para avaliar todos os aspectos relevantes, desde apontamentos estruturais aparentes até pequenos detalhes construtivos e acessórios presentes no imóvel registrando de forma clara e objetiva, por meio de textos e imagens, qualquer apontamento ou irregularidade.",
  "Este relatório tem como finalidade servir como instrumento imparcial e documental, proporcionando segurança jurídica às partes e auxiliando na solução de eventuais controvérsias.",
  "O material fotográfico está organizado da seguinte forma:",
  "· Registros fotográficos de todos os ambientes, em ordem cronológica dos pontos mais representativos dos ambientes que compõem o imóvel.",
  "· Fotobook: As fotografias contemplam múltiplos ângulos de cada ambiente, de modo a garantir uma visão abrangente e técnica do imóvel. Além disso, todas as imagens encontram-se disponíveis para download por meio do QR Code inserido neste documento.",
  "· Descrição foto a foto, indicando o ponto avaliado e apontando eventuais divergências;",
  "Este laudo não emprega termos subjetivos, como \"bom\", \"regular\" ou \"ótimo\" estado, nas análises. A descrição foi construída de forma objetiva, baseada exclusivamente em fatos observáveis, com o objetivo de evitar interpretações divergentes que possam surgir de perspectivas pessoais e garantir que as informações registradas sejam precisas e imparciais.",
];

const TERMOS_GERAIS_TEXTS = [
  "É obrigação do locatário o reparo imediato dos danos causados por si mesmo ou por terceiros durante a vigência do contrato de locação, cabendo ao locatário restituir o imóvel no mesmo estado em que o recebeu, de acordo com este laudo de vistoria, comprometendo-se com o zelo e promovendo a manutenção preventiva do mesmo e de seus equipamentos porventura existentes, em especial, equipamentos elétricos, quadros de distribuição de energia, instalações hidráulicas, elétricas, sistemas de ar, sistema de aquecimento em geral ou danos decorrentes do mau uso, tais como: danos ao encanamento provocados pelo descarte de objetos em ralos, em vasos sanitários, conservação dos móveis ou de bens de razão estrutural, como portas, janelas, esquadrias, pias, gabinetes, entre outros.",
  "O locatário será isento de responsabilidade quanto aos desgastes naturais decorrentes do uso normal e zeloso do imóvel, desde que tais condições sejam compatíveis com o período de locação e não decorram de negligência, mau uso ou ausência de manutenção regular. Eventuais danos que ultrapassem o desgaste esperado ou sejam causados por uso inadequado serão de responsabilidade do locatário, firmando compromisso do uso zeloso pelo período em que se der início a locação até a efetiva devolução das chaves.",
];

const ASSINATURA_TEXTO = `Declaram as partes estarem cientes das imagens e textos apresentados no presente termo, estando em conformidade com a vontade dos contratantes que, "As Partes e as testemunhas envolvidas neste instrumento afirmam e declaram que esse poderá ser assinado presencialmente ou eletronicamente, sendo as assinaturas consideradas válidas, vinculantes e executáveis, desde que firmadas pelos representantes legais das Partes. e pôr estarem justos e contratados, assinam o presente, para um só efeito, diante de 02 (duas) testemunhas.`;

interface ConfiguracoesPdf {
  espacamentoHorizontal: number;
  espacamentoVertical: number;
  margemPagina: number;
  metodologiaTexto: string | null;
  // Texto de METODOLOGIA customizado por tipo de vistoria. Tem prioridade sobre
  // o legado `metodologiaTexto` quando definido.
  metodologiaEntradaTexto: string | null;
  metodologiaSaidaTexto: string | null;
  metodologiaConstatacaoTexto: string | null;
  metodologiaPeriodicaTexto: string | null;
  termosGeraisTexto: string | null;
  assinaturaTexto: string | null;
  mostrarLogoCapa: boolean;
  logoCapaX: number | null;
  logoCapaY: number | null;
  logoCapaLargura: number | null;
  logoCapaAltura: number | null;
}

// Campos de texto editáveis. `metodologiaTexto` é o legado compartilhado
// (mantido para compatibilidade); os 4 `metodologia<Tipo>Texto` são os
// overrides atuais, um por tipo de vistoria.
type CampoTextoEditavel =
  | "metodologiaTexto"
  | "metodologiaEntradaTexto"
  | "metodologiaSaidaTexto"
  | "metodologiaConstatacaoTexto"
  | "metodologiaPeriodicaTexto"
  | "termosGeraisTexto"
  | "assinaturaTexto";

// Mapeia o tipoVistoria atual para o campo do override de METODOLOGIA.
const getCampoMetodologiaPorTipo = (tipoVistoria?: string): CampoTextoEditavel => {
  const norm = (tipoVistoria || "").toLowerCase();
  if (norm === "saída" || norm === "saida") return "metodologiaSaidaTexto";
  if (norm === "constatação" || norm === "constatacao")
    return "metodologiaConstatacaoTexto";
  if (norm === "periódica" || norm === "periodica")
    return "metodologiaPeriodicaTexto";
  return "metodologiaEntradaTexto";
};

type ModoPreview = "detalhado" | "compacto";

const PREVIEW_LAYOUTS: Record<
  ModoPreview,
  { label: string; imagensPorPagina: number }
> = {
  detalhado: {
    label: "Padrão",
    imagensPorPagina: 12,
  },
  compacto: {
    label: "Galeria compacta",
    imagensPorPagina: 15,
  },
};

const getPdfProgressMessage = (progress: number) => {
  if (progress >= 95) return "Enviando o PDF finalizado...";
  if (progress >= 94) return "Compondo o arquivo PDF. Em laudos grandes isso pode levar alguns minutos...";
  if (progress >= 90) return "Preparando o layout de impressão...";
  if (progress >= 80) return "Abrindo o renderizador do PDF...";
  if (progress >= 60) return "Montando as páginas do laudo...";
  if (progress >= 10) return "Otimizando imagens para deixar o PDF mais leve...";
  return "Colocando a geração do PDF na fila...";
};

const isModoPreviewValido = (modo: unknown): modo is ModoPreview =>
  modo === "detalhado" || modo === "compacto";

const getMetodologiaPadrao = (tipoVistoria?: string) => {
  const normalized = (tipoVistoria || "").toLowerCase();
  if (normalized === "saída" || normalized === "saida") {
    return METODOLOGIA_SAIDA_TEXTS.join("\n\n");
  }
  if (normalized === "constatação" || normalized === "constatacao") {
    return METODOLOGIA_CONSTATACAO_TEXTS.join("\n\n");
  }
  if (normalized === "periódica" || normalized === "periodica") {
    return METODOLOGIA_PERIODICA_TEXTS.join("\n\n");
  }
  return METODOLOGIA_TEXTS.join("\n\n");
};

const splitParagrafos = (texto: string) =>
  texto
    .split(/\n\s*\n/g)
    .map((item) => item.trim())
    .filter(Boolean);

// Componente para edição de texto sem o bug de re-render
const EditableText = ({
  value,
  onSave,
  className,
  style,
  tag: Tag = "p",
}: {
  value: string;
  onSave: (val: string) => void;
  className?: string;
  style?: React.CSSProperties;
  tag?: any;
}) => {
  const ref = useRef<HTMLElement>(null);

  // Sincroniza o valor inicial e mudanças externas (como restaurar original)
  useEffect(() => {
    if (ref.current && ref.current.textContent !== value) {
      ref.current.textContent = value;
    }
  }, [value]);

  return (
    <Tag
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onBlur={(e: React.FocusEvent<HTMLElement>) => {
        const newValue = e.currentTarget.textContent || "";
        if (newValue !== value) {
          onSave(newValue);
        }
      }}
      className={className}
      style={{
        outline: "none",
        cursor: "text",
        whiteSpace: "pre-wrap",
        ...style,
      }}
    />
  );
};

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
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      style={{
        width: "100%",
        // Ajusta a altura do container baseado na escala
        // 297mm é a altura fixa da página A4
        height: scale < 1 ? `calc(297mm * ${scale})` : "297mm",
        display: "flex",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top center",
          width: "210mm",
          height: "297mm", // Altura fixa A4
          flexShrink: 0,
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
      const isAdmin = user?.role === "ADMIN" || user?.role === "DEV";
      navigate(isAdmin ? "/admin/laudos" : "/dashboard/laudos");
    }
  };

  const [laudo, setLaudo] = useState<Laudo | null>(null);
  const [imagensComUrls, setImagensComUrls] = useState<any[]>([]);
  const [ambientes, setAmbientes] = useState<any[]>([]);
  const [detalhes, setDetalhes] = useState<any>(null); // Armazena o objeto completo com availableSections
  // Registros Complementares (carregado junto com o laudo). Quando
  // contestacaoRealizada=true com imagens, adicionamos 1+ páginas dedicadas
  // ao totalPaginas, ANTES do relatório.
  const [contestacao, setContestacao] = useState<Contestacao | null>(null);
  // "Registro de Apontamentos" (carregado junto com o laudo). Quando há
  // imagens marcadas como AVARIA, alocamos 1+ páginas dedicadas entre a
  // Info Page e as páginas de Fotos (a galeria principal continua
  // exibindo TODAS as imagens — nenhuma foto de avaria some daí).
  const [apontamentos, setApontamentos] = useState<ApontamentoImagem[] | null>(
    null,
  );
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [paginaInput, setPaginaInput] = useState("1");
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [totalImagens, setTotalImagens] = useState(0);
  const [modoPreview, setModoPreview] = useState<ModoPreview>("detalhado");
  const [loading, setLoading] = useState(true);
  const isModoCompacto = modoPreview === "compacto";

  // === Ações rápidas de foto no preview (reutiliza lógica da galeria) ===
  // `hoverSupportedRef.current` reflete o estado de
  // `matchMedia("(hover: hover)")` e é atualizado pelo effect abaixo.
  // Usamos um ref (e não state) para evitar re-render dos cards a cada
  // mudança de capacidade de hover.
  const hoverSupportedRef = useRef<boolean>(true);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(hover: hover)");
    hoverSupportedRef.current = mq.matches;
    const handler = (e: MediaQueryListEvent) => {
      hoverSupportedRef.current = e.matches;
    };
    if (mq.addEventListener) {
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
    mq.addListener(handler); // fallback Safari antigo
    return () => mq.removeListener(handler);
  }, []);
  // ID da imagem com overlay de ações mobile aberto (touch-only).
  const [mobileActionsImageId, setMobileActionsImageId] = useState<string | null>(
    null,
  );
  // Spinners durante as mutations. Quando === img.id, o botão exibe
  // `Loader2` em vez do ícone normal.
  const [loadingCategoriaChange, setLoadingCategoriaChange] = useState<
    string | null
  >(null);
  const [loadingItemFlagChange, setLoadingItemFlagChange] = useState<
    string | null
  >(null);
  // Confirmação de exclusão via `ConfirmModal` (mesma UX da galeria).
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Dismiss do overlay de ações mobile (touch-only) quando o usuário
  // toca fora do card ativo. Mesmo padrão da `GaleriaImagens`.
  useEffect(() => {
    if (!mobileActionsImageId) return;
    const selector = `[data-image-actions-trigger="${mobileActionsImageId}"]`;
    const isInside = (target: EventTarget | null): boolean => {
      if (!(target instanceof Element)) return false;
      return !!target.closest(selector);
    };
    const handleMouseDown = (e: MouseEvent) => {
      if (!isInside(e.target)) setMobileActionsImageId(null);
    };
    const handleTouchStart = (e: TouchEvent) => {
      if (!isInside(e.target)) setMobileActionsImageId(null);
    };
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("touchstart", handleTouchStart);
    };
  }, [mobileActionsImageId]);
  const imagensPorPagina = PREVIEW_LAYOUTS[modoPreview].imagensPorPagina;
  const LOGO_DEFAULTS = {
    mostrarLogoCapa: true,
    logoCapaX: null,
    logoCapaY: null,
    logoCapaLargura: null,
    logoCapaAltura: null,
  };
  const [configuracoes, setConfiguracoes] = useState<ConfiguracoesPdf>(() => {
    const base: ConfiguracoesPdf = {
      espacamentoHorizontal: 10,
      espacamentoVertical: 15,
      margemPagina: 20,
      metodologiaTexto: null,
      metodologiaEntradaTexto: null,
      metodologiaSaidaTexto: null,
      metodologiaConstatacaoTexto: null,
      metodologiaPeriodicaTexto: null,
      termosGeraisTexto: null,
      assinaturaTexto: null,
      ...LOGO_DEFAULTS,
    };
    // Tenta carregar do sessionStorage se existir para persistir entre navegação.
    // A posição/tamanho da logo NÃO é rascunhada: ela só persiste via "Salvar
    // Alterações" e é sempre recarregada do backend (evita parecer auto-salva).
    const saved = sessionStorage.getItem(`pdf_config_${id}`);
    if (saved) {
      try {
        return { ...base, ...JSON.parse(saved), ...LOGO_DEFAULTS };
      } catch (e) {
        console.error("Erro ao carregar configurações do cache:", e);
      }
    }
    return base;
  });

  // Salva no sessionStorage sempre que as configurações mudarem (exceto a logo)
  useEffect(() => {
    if (id) {
      const {
        mostrarLogoCapa: _m,
        logoCapaX: _x,
        logoCapaY: _y,
        logoCapaLargura: _l,
        logoCapaAltura: _a,
        ...semLogo
      } = configuracoes;
      sessionStorage.setItem(`pdf_config_${id}`, JSON.stringify(semLogo));
    }
  }, [configuracoes, id]);
  const [configuracoesOriginais, setConfiguracoesOriginais] =
    useState<ConfiguracoesPdf>({
      espacamentoHorizontal: 10,
      espacamentoVertical: 15,
      margemPagina: 20,
      metodologiaTexto: null,
      metodologiaEntradaTexto: null,
      metodologiaSaidaTexto: null,
      metodologiaConstatacaoTexto: null,
      metodologiaPeriodicaTexto: null,
      termosGeraisTexto: null,
      assinaturaTexto: null,
      mostrarLogoCapa: true,
      logoCapaX: null,
      logoCapaY: null,
      logoCapaLargura: null,
      logoCapaAltura: null,
    });
  const [gerandoPdf, setGerandoPdf] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [mensagemGeracaoPdf, setMensagemGeracaoPdf] = useState(
    "Estamos processando as imagens e organizando o laudo completo..."
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  // Imagem selecionada para edição via `EditImagemModal`. Diferente
  // do `editingId` acima (que é o modo inline de legenda deste preview
  // — clicar na imagem e editar a legenda diretamente na grade):
  // `editingImage` é o objeto que alimenta o modal compartilhado com
  // a galeria, aberto pelo botão de lápis.
  const [editingImage, setEditingImage] = useState<any | null>(null);
  const wasTriggeredRef = useRef(false);
  const isConfigLoadedRef = useRef(false);
  // Mapa de `<img>` no preview (galeria + apontamentos). STATE
  // (não useRef) para forçar re-render do `DamageMarkerOverlay`
  // quando uma imagem monta — assim o overlay SEMPRE recebe a
  // ref atualizada e pode ler `naturalWidth` etc.
  //
  // ARMADILHA EVITADA: o callback ref abaixo SÓ chama setState
  // quando `el` é o elemento (mount). No unmount (`el === null`),
  // NÃO chama setState — se chamasse, entraria em loop infinito:
  // React sempre faz cleanup-null → setup-el → cleanup-null →
  // setup-el ao TROCAR o callback inline em cada re-render, e
  // setState dispararia nova re-render → novo callback → ...
  // Pular o setState no unmount quebra o ciclo: o cleanup deixa
  // o state apontando para o elemento (já obsoleto, mas o
  // componente logo será desmontado pelo React de qualquer forma).
  const [previewImgRefs, setPreviewImgRefs] = useState<
    Record<string, HTMLImageElement | null>
  >({});
  const modoPreviewAlteradoRef = useRef(false);
  const originalLegendasRef = useRef<Record<string, string>>({});
  const pagesCache = useRef<Record<string, any[]>>({});

  const hasCover = true;

  /**
   * Quantas páginas de Registros Complementares (contestação) precisam ser
   * somadas ao `totalPaginas` do preview. Mesma regra do backend de PDF:
   * grid 3x3 → 9 fotos por página. Fonte única: `meta` do `getImagensPdf`.
   * Encapsulando aqui, evitamos o drift entre a regra do backend (que
   * renderiza o PDF) e do frontend (que mostra a paginação no preview).
   */
  const FOTOS_POR_PAGINA_CONTESTACAO = 9;
  const calcularPaginasContestacao = (
    contestacaoImagesCount: number | undefined,
    contestacaoRealizada: boolean | undefined,
  ): number => {
    if (!contestacaoRealizada) return 0;
    const count = contestacaoImagesCount ?? 0;
    if (count <= 0) return 0;
    return Math.ceil(count / FOTOS_POR_PAGINA_CONTESTACAO);
  };

  /**
   * Mesmo cálculo do `calcularPaginasContestacao`, mas para a seção
   * "Registro de Apontamentos". Mesma regra do backend de PDF: grid 3x3,
   * 9 fotos por página. A contagem vem de `meta.apontamentosImagesCount`
   * no mesmo round-trip do `getImagensPdf`, então não há "salto" no
   * totalPaginas ao abrir o preview.
   */
  const FOTOS_POR_PAGINA_APONTAMENTOS = 9;
  const calcularPaginasApontamentos = (
    apontamentosImagesCount: number | undefined,
  ): number => {
    const count = apontamentosImagesCount ?? 0;
    if (count <= 0) return 0;
    return Math.ceil(count / FOTOS_POR_PAGINA_APONTAMENTOS);
  };

  const handleModoPreviewChange = async (modo: ModoPreview) => {
    if (modo === modoPreview) return;

    const modoAnterior = modoPreview;
    modoPreviewAlteradoRef.current = true;
    pagesCache.current = {};
    setEditingId(null);
    setImagensComUrls([]);
    setLoading(true);
    setModoPreview(modo);

    try {
      await laudosService.updateConfiguracoesPdf({ modoPreviewPdf: modo });
    } catch (error) {
      console.error("Erro ao salvar modo do preview:", error);
      toast.error("Erro ao salvar preferência do preview");
      pagesCache.current = {};
      setImagensComUrls([]);
      setLoading(true);
      setModoPreview(modoAnterior);
    }
  };

  useEffect(() => {
    if (id && !isConfigLoadedRef.current) {
      carregarConfiguracoes();
      carregarLaudo();
      isConfigLoadedRef.current = true;
    }
  }, [id]);

  useEffect(() => {
    if (id && laudo) {
      if (ambientes.length === 0) {
        carregarAmbientes();
      }
      carregarImagens();
    }
  }, [id, paginaAtual, laudo?.id, modoPreview]);

  /**
   * IMPORTANTE: este `useEffect` foi REMOVIDO por causar um "salto"
   * visível de totalPaginas (ex.: 1/5 → 1/7) ao abrir o preview de um
   * laudo com imagens de contestação.
   *
   * Motivo: o backend já devolve `contestacaoImagesCount` e
   * `contestacaoRealizada` no `meta` do `getImagensPdf`, então o
   * `carregarImagens` calcula `totalPaginas` corretamente na primeira
   * ida ao servidor. Antes, este effect disparava uma SEGUNDA chamada
   * `getImagensPdf(id, 1, ...)` só para atualizar o total quando a
   * contestação terminava de carregar (resolvida em série após
   * `getLaudo`), o que produzia o delay de 1–2s relatado.
   *
   * O objeto `contestacao` (com as imagens) continua sendo carregado em
   * paralelo com `getLaudo` para a renderização da página de Registros
   * Complementares — só não usamos mais ele para o cálculo de paginação.
   */

  useEffect(() => {
    setPaginaInput(String(paginaAtual));
  }, [paginaAtual]);

  const irParaPagina = useCallback(
    (pagina: number) => {
      if (totalPaginas <= 0) return;
      const paginaNormalizada = Math.min(
        totalPaginas,
        Math.max(1, Math.floor(pagina))
      );
      setPaginaAtual(paginaNormalizada);
    },
    [totalPaginas]
  );

  const handleIrParaPaginaInput = () => {
    const pagina = Number(paginaInput.trim());
    if (!Number.isFinite(pagina) || pagina <= 0) {
      setPaginaInput(String(paginaAtual));
      return;
    }
    irParaPagina(pagina);
  };

  const carregarAmbientes = async () => {
    if (!id) return;
    try {
      const response = await laudosService.getAmbientesWeb(id);
      const ambientesWeb = [...(response.ambientes || [])]
        .sort((a, b) => a.ordem - b.ordem)
        .map((ambiente) => ({
          ambiente: ambiente.nomeAmbiente,
          totalImagens: ambiente.totalImagens || 0,
          ordem: ambiente.ordem,
        }));

      setAmbientes(ambientesWeb);
    } catch (error) {
      console.error("Erro ao carregar ambientes:", error);
    }
  };

  const carregarConfiguracoes = async () => {
    try {
      const config = await laudosService.getConfiguracoesPdf();
      const configNormalizada: ConfiguracoesPdf = {
        espacamentoHorizontal: config.espacamentoHorizontal ?? 10,
        espacamentoVertical: config.espacamentoVertical ?? 15,
        margemPagina: config.margemPagina ?? 20,
        metodologiaTexto: config.metodologiaTexto ?? null,
        metodologiaEntradaTexto: config.metodologiaEntradaTexto ?? null,
        metodologiaSaidaTexto: config.metodologiaSaidaTexto ?? null,
        metodologiaConstatacaoTexto: config.metodologiaConstatacaoTexto ?? null,
        metodologiaPeriodicaTexto: config.metodologiaPeriodicaTexto ?? null,
        termosGeraisTexto: config.termosGeraisTexto ?? null,
        assinaturaTexto: config.assinaturaTexto ?? null,
        mostrarLogoCapa: config.mostrarLogoCapa ?? true,
        logoCapaX: config.logoCapaX ?? null,
        logoCapaY: config.logoCapaY ?? null,
        logoCapaLargura: config.logoCapaLargura ?? null,
        logoCapaAltura: config.logoCapaAltura ?? null,
      };

      // Só atualiza configuracoes se não houver rascunho no sessionStorage.
      // A logo, porém, é SEMPRE recarregada do backend (não é rascunhada),
      // garantindo que a posição só mude após "Salvar Alterações".
      const hasDraft = !!sessionStorage.getItem(`pdf_config_${id}`);
      if (!hasDraft) {
        setConfiguracoes(configNormalizada);
      } else {
        setConfiguracoes((prev) => ({
          ...prev,
          mostrarLogoCapa: configNormalizada.mostrarLogoCapa,
          logoCapaX: configNormalizada.logoCapaX,
          logoCapaY: configNormalizada.logoCapaY,
          logoCapaLargura: configNormalizada.logoCapaLargura,
          logoCapaAltura: configNormalizada.logoCapaAltura,
        }));
      }
      setConfiguracoesOriginais(configNormalizada);

      if (
        !modoPreviewAlteradoRef.current &&
        isModoPreviewValido(config.modoPreviewPdf)
      ) {
        setModoPreview(config.modoPreviewPdf);
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
    }
  };

  const carregarLaudo = async () => {
    if (!id) return;
    try {
      // Dispara getLaudo primeiro (precisa do objeto antes dos demais
      // efeitos). getLaudoDetalhes e getContestacao rodam em paralelo
      // — antes eram sequenciais, o que somava ~1 round-trip de latência
      // ao abrir o preview (visível como atraso antes do "1/5" aparecer).
      const data = await laudosService.getLaudo(id);
      setLaudo(data);

      Promise.all([
        laudosService
          .getLaudoDetalhes(id)
          .then((details) => {
            setDetalhes(details);
          })
          .catch((err) => {
            console.error("Erro ao carregar detalhes dinâmicos:", err);
          }),
        laudosService
          .getContestacao(id)
          .then((cont) => {
            // Objeto completo (imagens + URLs) só é necessário para
            // RENDERIZAR a página de Registros Complementares; o cálculo
            // de totalPaginas usa o `meta` do `getImagensPdf` (não este
            // estado), por isso o atraso aqui não atrasa mais a UI.
            setContestacao(cont);
          })
          .catch((err) => {
            console.error("Erro ao carregar contestação:", err);
            setContestacao(null);
          }),
        laudosService
          .getApontamentos(id)
          .then((ap) => {
            // Mesmo padrão da contestação: payload completo (com URLs
            // assinadas) só é necessário para RENDERIZAR a página de
            // Registro de Apontamentos. A contagem de páginas entra
            // via `meta.apontamentosImagesCount` no mesmo round-trip
            // de `getImagensPdf`, então este atraso não atrasa a UI.
            setApontamentos(ap?.imagens || []);
          })
          .catch((err) => {
            console.error("Erro ao carregar apontamentos:", err);
            setApontamentos([]);
          }),
      ]);
    } catch (error) {
      console.error("Erro ao carregar laudo:", error);
      toast.error("Erro ao carregar dados do laudo");
    }
  };

  const carregarImagens = async () => {
    if (!id || !laudo) return;

    const atualizarResumoImagens = async () => {
      const response = await laudosService.getImagensPdf(
        id,
        1,
        imagensPorPagina
      );
      // +4 = capa + termos + relatório + assinaturas (com cover)
      // +N = páginas de Registros Complementares (grid 3x3, 9 fotos/página)
      // +M = páginas de Registro de Apontamentos (grid 3x3, 9 fotos/página)
      //
      // As duas contagens vêm direto do `meta` retornado pelo backend no
      // MESMO round-trip (`contestacaoImagesCount`/`contestacaoRealizada`
      // e `apontamentosImagesCount`). Antes a de contestação dependia do
      // estado `contestacao` que carregava em série após `getLaudo`,
      // gerando o salto 1/5 → 1/7 — corrigido do mesmo jeito.
      const paginasContestacao = calcularPaginasContestacao(
        response.meta.contestacaoImagesCount,
        response.meta.contestacaoRealizada,
      );
      const paginasApontamentos = calcularPaginasApontamentos(
        response.meta.apontamentosImagesCount,
      );
      const adicional = hasCover ? 4 : 0;
      const totalPaginasVisual =
        response.meta.totalPages +
        adicional +
        paginasContestacao +
        paginasApontamentos;

      setTotalPaginas(totalPaginasVisual);
      setTotalImagens(response.meta.totalImages);

      if (totalPaginasVisual > 0 && paginaAtual > totalPaginasVisual) {
        setPaginaAtual(totalPaginasVisual);
      }
    };

    // Se for página de capa, não carrega imagens
    if (hasCover && paginaAtual === 1) {
      setImagensComUrls([]);
      setLoading(true);
      try {
        await atualizarResumoImagens();
      } catch (error: any) {
        toast.error(error.message || "Erro ao carregar imagens");
        console.error(error);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Se for página de Termos (Página 2), não carrega imagens
    if (hasCover && paginaAtual === 2) {
      setImagensComUrls([]);
      setLoading(true);
      try {
        await atualizarResumoImagens();
      } catch (error: any) {
        toast.error(error.message || "Erro ao carregar imagens");
        console.error(error);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Calculo da página do backend (Pagina 1 do backend começa na página 3 do visualizador se tiver capa)
    // IMPORTANTE: as páginas de "Registro de Apontamentos" ficam DEPOIS
    // da galeria principal de Fotos e ANTES do Relatório. Quando o
    // usuário está numa dessas páginas, NÃO chamamos `getImagensPdf` —
    // elas são renderizadas a partir do estado `apontamentos` (carregado
    // em paralelo com `getLaudo`). O `backendPage` só mapeia páginas
    // de FOTOS, que sempre começam na página 3 (com cover), portanto
    // NÃO descontamos nada aqui — o offset de apontamentos fica depois
    // das fotos no novo layout.
    const paginasApontamentosVisual = calcularPaginasApontamentos(
      apontamentos?.length,
    );
    const backendPage = hasCover ? paginaAtual - 2 : paginaAtual;
    if (hasCover && paginasApontamentosVisual > 0) {
      const inicioApontamentos = 3 + paginasFotosBackend;
      const fimApontamentos = inicioApontamentos + paginasApontamentosVisual - 1;
      if (paginaAtual >= inicioApontamentos && paginaAtual <= fimApontamentos) {
        // Página de apontamentos: não chama backend, deixa o roteador
        // de páginas renderizar `renderApontamentosPage()`.
        setLoading(false);
        return;
      }
    }
    const cacheKey = `${modoPreview}:${paginaAtual}`;

    if (pagesCache.current[cacheKey]) {
      setImagensComUrls(pagesCache.current[cacheKey]);
      return;
    }

    try {
      setLoading(true);
      const response = await laudosService.getImagensPdf(
        id,
        backendPage,
        imagensPorPagina
      );

      // Mesma fonte da verdade (meta do backend) usada em
      // `atualizarResumoImagens`. Não depende mais do estado `contestacao`,
      // que carregava em série — isso era o que causava o "salto" no
      // totalPaginas.
      const paginasContestacao = calcularPaginasContestacao(
        response.meta.contestacaoImagesCount,
        response.meta.contestacaoRealizada,
      );
      const paginasApontamentos = calcularPaginasApontamentos(
        response.meta.apontamentosImagesCount,
      );
      const totalPaginasVisual = hasCover
        ? response.meta.totalPages + 4 + paginasContestacao + paginasApontamentos
        : response.meta.totalPages + paginasContestacao + paginasApontamentos;

      setTotalPaginas(totalPaginasVisual);
      setTotalImagens(response.meta.totalImages);

      if (totalPaginas > 0 && totalPaginas !== totalPaginasVisual) {
        // Relatório e Assinaturas sempre vêm por último; as páginas de
        // Registros Complementares entram entre as fotos e o relatório.
        // As páginas de Registro de Apontamentos ficam DEPOIS das fotos
        // (entre fotos e relatório) — `getIdxRelatorio` continua sendo
        // `totalPaginas - 1 - paginasContestacaoTotal` e não muda.
        // `ultimaPaginaComImagem` é a ÚLTIMA página de fotos no
        // visualizador: com cover, fotos começam na página 3 e o
        // bloco de apontamentos vem DEPOIS, então a última página de
        // fotos é simplesmente `paginasFotosBackend + 2` (sem offset
        // de apontamentos).
        const idxRelatorio = hasCover
          ? totalPaginasVisual - 1 - paginasContestacao
          : totalPaginasVisual - paginasContestacao;
        const paginaEraRelatorio =
          hasCover && paginaAtual === idxRelatorio;
        const paginaEraAssinatura =
          hasCover && paginaAtual === totalPaginasVisual;
        const ultimaPaginaComImagem = hasCover
          ? response.meta.totalPages + 2
          : response.meta.totalPages;

        if (paginaEraRelatorio) {
          setImagensComUrls([]);
          setPaginaAtual(Math.max(1, totalPaginasVisual - 1));
          return;
        }

        if (paginaEraAssinatura || paginaAtual > totalPaginasVisual) {
          setImagensComUrls([]);
          setPaginaAtual(totalPaginasVisual);
          return;
        }

        if (
          response.meta.totalPages > 0 &&
          backendPage > response.meta.totalPages
        ) {
          setImagensComUrls([]);
          setPaginaAtual(ultimaPaginaComImagem);
          return;
        }
      }

      if (totalPaginasVisual > 0 && paginaAtual > totalPaginasVisual) {
        setImagensComUrls([]);
        setPaginaAtual(totalPaginasVisual);
        return;
      }

      if (
        hasCover &&
        totalPaginasVisual > 0 &&
        (paginaAtual === totalPaginasVisual - 1 ||
          paginaAtual === totalPaginasVisual)
      ) {
        setImagensComUrls([]);
        return;
      }

      if (response.data.length === 0) {
        setImagensComUrls([]);
        return;
      }

      const s3Keys = response.data.map((img: any) => img.s3Key);
      if (s3Keys.length === 0) {
        setImagensComUrls([]);
        return;
      }

      const urls = await laudosService.getSignedUrlsBatch(s3Keys);

      const imagensComUrl = response.data.map((img: any) => ({
        ...img,
        url: urls[img.s3Key],
      }));

      pagesCache.current[cacheKey] = imagensComUrl;
      setImagensComUrls(imagensComUrl);
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar imagens");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const [editedFields, setEditedFields] = useState<Partial<Laudo>>({});
  const [isSaving, setIsSaving] = useState(false);

  const configuracoesAlteradas = useCallback(() => {
    const keys: (keyof ConfiguracoesPdf)[] = [
      "espacamentoHorizontal",
      "espacamentoVertical",
      "margemPagina",
      "metodologiaTexto",
      "metodologiaEntradaTexto",
      "metodologiaSaidaTexto",
      "metodologiaConstatacaoTexto",
      "metodologiaPeriodicaTexto",
      "termosGeraisTexto",
      "assinaturaTexto",
      "mostrarLogoCapa",
      "logoCapaX",
      "logoCapaY",
      "logoCapaLargura",
      "logoCapaAltura",
    ];
    return keys.some(
      (key) => configuracoes[key] !== configuracoesOriginais[key]
    );
  }, [configuracoes, configuracoesOriginais]);

  const payloadConfiguracoesAlteradas = useCallback(() => {
    const keys: (keyof ConfiguracoesPdf)[] = [
      "espacamentoHorizontal",
      "espacamentoVertical",
      "margemPagina",
      "metodologiaTexto",
      "metodologiaEntradaTexto",
      "metodologiaSaidaTexto",
      "metodologiaConstatacaoTexto",
      "metodologiaPeriodicaTexto",
      "termosGeraisTexto",
      "assinaturaTexto",
      "mostrarLogoCapa",
      "logoCapaX",
      "logoCapaY",
      "logoCapaLargura",
      "logoCapaAltura",
    ];
    return keys.reduce<Record<string, any>>((acc, key) => {
      if (configuracoes[key] !== configuracoesOriginais[key]) {
        // Garantir que se o valor for string vazia, ele seja enviado corretamente
        // Se for null, o backend pode interpretar como "remover customização"
        acc[key] = configuracoes[key];
      }
      return acc;
    }, {});
  }, [configuracoes, configuracoesOriginais]);

  const handleConfigTextChange = (
    field: CampoTextoEditavel,
    value: string
  ) => {
    // Se o valor for vazio, salvamos uma string vazia em vez de null
    // para evitar que o operador || ou verificações de falsy resetem para o padrão
    setConfiguracoes((prev) => ({ ...prev, [field]: value }));
  };

  const handleRestoreDefaultText = (field: CampoTextoEditavel) => {
    setConfiguracoes((prev) => ({ ...prev, [field]: null }));
  };

  const handleLogoCapaChange = (patch: Partial<LogoCapaValue>) => {
    setConfiguracoes((prev) => ({
      ...prev,
      ...(patch.mostrar !== undefined && { mostrarLogoCapa: patch.mostrar }),
      ...(patch.x !== undefined && { logoCapaX: patch.x }),
      ...(patch.y !== undefined && { logoCapaY: patch.y }),
      ...(patch.largura !== undefined && { logoCapaLargura: patch.largura }),
      ...(patch.altura !== undefined && { logoCapaAltura: patch.altura }),
    }));
  };

  const handleFieldChange = (
    field: keyof Laudo | "dataVistoria",
    value: any
  ) => {
    setLaudo((prev) => (prev ? { ...prev, [field]: value } : null));
    setEditedFields((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveChanges = async () => {
    if (!id) return;

    const hasLaudoChanges = Object.keys(editedFields).length > 0;
    const hasConfigChanges = configuracoesAlteradas();

    console.log("Iniciando salvamento:", {
      hasLaudoChanges,
      hasConfigChanges,
      payloadConfig: hasConfigChanges ? payloadConfiguracoesAlteradas() : null,
    });

    if (!hasLaudoChanges && !hasConfigChanges) return;

    setIsSaving(true);
    try {
      if (hasLaudoChanges) {
        await laudosService.updateLaudo(id, editedFields as any);
        setEditedFields({});
      }
      if (hasConfigChanges) {
        const payload = payloadConfiguracoesAlteradas();
        console.log("Enviando payload de configurações:", payload);
        await laudosService.updateConfiguracoesPdf(payload);
        setConfiguracoesOriginais((prev) => ({ ...prev, ...payload }));

        // Limpa rascunho do sessionStorage após salvar com sucesso
        sessionStorage.removeItem(`pdf_config_${id}`);
      }
      toast.success("Alterações salvas com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar alterações");
      console.error("Erro no salvamento:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLegendaChange = async (imagemId: string, novaLegenda: string) => {
    try {
      await laudosService.updateLegenda(imagemId, novaLegenda);
      setImagensComUrls((prev) =>
        prev.map((img) =>
          img.id === imagemId ? { ...img, legenda: novaLegenda } : img
        )
      );
    } catch (error: any) {
      toast.error("Erro ao salvar legenda");
      console.error(error);
    }
  };

  // === Handlers do `EditImagemModal` (botão de lápis no PDF preview) ===
  // Persistência do marker de avaria arrastado no modal. Atualização
  // otimista local (o modal já reflete visualmente a nova posição);
  // se o backend falhar, mantém o local e loga — o usuário pode
  // re-arrastar para forçar nova tentativa.
  const handleEditModalMarkerChange = useCallback(
    async (imagemId: string, marker: { x: number; y: number; r: number } | null) => {
      setImagensComUrls((prev) =>
        prev.map((img) =>
          img.id === imagemId ? { ...img, damageMarker: marker } : img,
        ),
      );
      setEditingImage((prev: any) =>
        prev && prev.id === imagemId
          ? { ...prev, damageMarker: marker }
          : prev,
      );
      try {
        await laudosService.updateImagemMetadata(imagemId, {
          damageMarker: marker,
        } as any);
      } catch (err) {
        console.error(
          "[VisualizadorPdfLaudo] Falha ao persistir marcador de avaria:",
          err,
        );
      }
    },
    [],
  );

  // Persistência da legenda editada no modal. Mesmo padrão da galeria:
  // atualização otimista + PATCH; o debounce fica dentro do modal.
  const handleEditModalLegendaChange = useCallback(
    async (imagemId: string, novaLegenda: string) => {
      setImagensComUrls((prev) =>
        prev.map((img) =>
          img.id === imagemId ? { ...img, legenda: novaLegenda } : img,
        ),
      );
      setEditingImage((prev: any) =>
        prev && prev.id === imagemId
          ? { ...prev, legenda: novaLegenda }
          : prev,
      );
      try {
        await laudosService.updateLegenda(imagemId, novaLegenda);
      } catch (err) {
        toast.error("Erro ao salvar legenda");
      }
    },
    [],
  );

  const handleEditModalClose = useCallback(() => {
    setEditingImage(null);
  }, []);

  // === Ações rápidas de foto (Marcar/Desmarcar avaria, Marcar como
  // item, Excluir) — reusam exatamente a mesma lógica/payload da
  // GaleriaImagens, apenas mirando `imagensComUrls` (o state local do
  // preview) em vez do state da galeria. Toast é o mesmo.

  /**
   * Marca ou desmarca a foto como AVARIA. Mesma regra end-to-end da
   * galeria: ao desmarcar, apaga também o `damageMarker` salvo (a foto
   * volta a "como se nunca tivesse sido circulada"). Ao marcar, mantém
   * qualquer marker existente (a posição persistida é preservada; só
   * a RENDERIZAÇÃO no preview é gated por `categoria === "AVARIA"`).
   */
  const handlePreviewToggleAvaria = useCallback(
    async (imgId: string, marcarAvaria: boolean) => {
      const novaCategoria = marcarAvaria ? "AVARIA" : "VISTORIA";
      const payload: { categoria: string; damageMarker?: null } = {
        categoria: novaCategoria,
      };
      if (!marcarAvaria) {
        payload.damageMarker = null;
      }
      try {
        setLoadingCategoriaChange(imgId);
        await laudosService.updateImagemMetadata(imgId, payload);
        setImagensComUrls((prev) =>
          prev.map((img) =>
            img.id === imgId
              ? {
                  ...img,
                  categoria: novaCategoria,
                  damageMarker: marcarAvaria ? img.damageMarker : null,
                }
              : img,
          ),
        );
        toast.success(
          marcarAvaria
            ? "Imagem marcada como avaria. A IA usará o prompt de avaria."
            : "Imagem marcada como vistoria.",
        );
      } catch (err) {
        toast.error("Erro ao atualizar categoria da imagem.");
      } finally {
        setLoadingCategoriaChange(null);
      }
    },
    [],
  );

  /**
   * Aplica o prefixo "ITEM " na legenda da foto. Mesma regra da
   * galeria: idempotente (remove prefixo anterior se houver), respeita
   * o limite de 200 caracteres do VARCHAR.
   */
  const handlePreviewMarcarItem = useCallback(
    async (imgId: string) => {
      const imagem = imagensComUrls.find((i) => i.id === imgId);
      const legendaAtual = (imagem?.legenda || "").trim();
      const semPrefixo = legendaAtual
        .replace(/^ITEM\s*[-–—:]*\s*/i, "")
        .trim();
      const prefixo = "ITEM ";
      const espacoUtil = 200 - prefixo.length;
      const corpo =
        semPrefixo.length > espacoUtil
          ? semPrefixo.slice(0, espacoUtil).trimEnd()
          : semPrefixo;
      const novaLegenda = `${prefixo}${corpo}`;
      try {
        setLoadingItemFlagChange(imgId);
        await laudosService.updateLegenda(imgId, novaLegenda);
        setImagensComUrls((prev) =>
          prev.map((img) =>
            img.id === imgId ? { ...img, legenda: novaLegenda } : img,
          ),
        );
        toast.success("Imagem marcada como item.");
      } catch (err) {
        toast.error("Erro ao marcar imagem como item.");
      } finally {
        setLoadingItemFlagChange(null);
      }
    },
    [imagensComUrls],
  );

  /**
   * Abre o `ConfirmModal` para confirmar exclusão. O delete em si é
   * disparado por `handleConfirmPreviewDelete` (onConfirm do modal).
   * Mesma UX da galeria: confirmação obrigatória, atualização
   * otimista, rollback em caso de erro.
   */
  const handlePreviewAskDelete = useCallback((imgId: string) => {
    setPendingDeleteId(imgId);
  }, []);

  const handleConfirmPreviewDelete = useCallback(async () => {
    const imgId = pendingDeleteId;
    if (!imgId) return;
    const imagemDeletada = imagensComUrls.find((img) => img.id === imgId);
    const indexOriginal = imagensComUrls.findIndex(
      (img) => img.id === imgId,
    );
    // Otimista: remove imediatamente do state para o preview refletir
    // instantaneamente. O modal fecha junto (o "Excluir" do overlay já
    // foi disparado; o ConfirmModal assume o fluxo).
    setImagensComUrls((prev) => prev.filter((img) => img.id !== imgId));
    setPendingDeleteId(null);
    try {
      setDeletingId(imgId);
      await laudosService.deleteImagem(imgId);
      toast.success("Imagem deletada com sucesso!");
    } catch (err) {
      // Rollback: reinsere na posição original para o usuário não
      // perder a referência visual.
      if (imagemDeletada) {
        setImagensComUrls((prev) => {
          const novaLista = [...prev];
          novaLista.splice(indexOriginal, 0, imagemDeletada);
          return novaLista;
        });
      }
      toast.error("Erro ao deletar imagem.");
    } finally {
      setDeletingId(null);
    }
  }, [pendingDeleteId, imagensComUrls]);

  // Navegação entre imagens dentro do modal — mesma mecânica da
  // galeria (Tab, setas ←/→, setas flutuantes). Wrap-around: da
  // última volta pra primeira e vice-versa. O escopo é a página
  // atual do preview (`imagensComUrls`) — é o conjunto de imagens
  // que o usuário está vendo no momento.
  const findEditingIndex = useCallback(() => {
    if (!editingImage) return -1;
    return imagensComUrls.findIndex((img) => img.id === editingImage.id);
  }, [editingImage, imagensComUrls]);

  const handleEditModalPrev = useCallback(() => {
    if (imagensComUrls.length < 2 || !editingImage) return;
    const idx = findEditingIndex();
    if (idx < 0) return;
    const prev = (idx - 1 + imagensComUrls.length) % imagensComUrls.length;
    setEditingImage(imagensComUrls[prev]);
  }, [editingImage, findEditingIndex, imagensComUrls]);

  const handleEditModalNext = useCallback(() => {
    if (imagensComUrls.length < 2 || !editingImage) return;
    const idx = findEditingIndex();
    if (idx < 0) return;
    const next = (idx + 1) % imagensComUrls.length;
    setEditingImage(imagensComUrls[next]);
  }, [editingImage, findEditingIndex, imagensComUrls]);

  const handleGerarPdfPagina = async () => {
    try {
      setGerandoPdf(true);
      await pdfService.gerarPdfPaginaUnica(
        "pdf-grid-preview",
        `laudo-pagina-${paginaAtual}.pdf`
      );
      toast.success("PDF gerado com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao gerar PDF");
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
    return () => {
      if (id) leaveLaudo(id);
    };
  }, [id, joinLaudo, leaveLaudo]);

  // Monitorar progresso do PDF via Socket
  useEffect(() => {
    if (!id || !laudo) return;

    // Verificar estado inicial do laudo (se já estava processando quando carregou)
    if (laudo.pdfStatus === "PROCESSING" || laudo.pdfStatus === "PENDING") {
      setGerandoPdf(true);
      const progress = laudo.pdfProgress || 0;
      setProgresso(progress);
      setMensagemGeracaoPdf(getPdfProgressMessage(progress));
    } else if (laudo.pdfStatus === "COMPLETED") {
      setGerandoPdf(false);
      setProgresso(100);
      setMensagemGeracaoPdf("PDF pronto para download.");
    }

    const update = pdfProgressMap[id];
    if (update) {
      if (update.status === "PROCESSING" || update.status === "PENDING") {
        setGerandoPdf(true);
        setProgresso(update.progress);
        setMensagemGeracaoPdf(
          update.message || getPdfProgressMessage(update.progress)
        );
      } else if (update.status === "COMPLETED") {
        setGerandoPdf(false);
        setProgresso(100);
        setMensagemGeracaoPdf(update.message || "PDF pronto para download.");

        const isFirstLoad = !laudo.pdfUrl && update.url;
        const isUpdated = update.url && laudo.pdfUrl !== update.url;

        if (update.url) {
          if (isFirstLoad || isUpdated) {
            toast.success("PDF gerado com sucesso!");
          }

          setLaudo((prev) =>
            prev
              ? {
                  ...prev,
                  pdfUrl: update.url,
                  pdfStatus: "COMPLETED",
                  pdfModoPreview: isModoPreviewValido(update.modoPreviewPdf)
                    ? update.modoPreviewPdf
                    : modoPreview,
                }
              : null
          );
        }

        // Abre automaticamente se foi acionado pelo usuário nesta sessão
        if (wasTriggeredRef.current && update.url) {
          window.open(update.url, "_blank");
          wasTriggeredRef.current = false;
        }
      } else if (update.status === "ERROR") {
        setGerandoPdf(false);
        setProgresso(0);
        setMensagemGeracaoPdf("Não foi possível finalizar o PDF.");
        wasTriggeredRef.current = false;
        toast.error(
          `Erro na geração do PDF: ${update.error || "Desconhecido"}`
        );
        setLaudo((prev) => (prev ? { ...prev, pdfStatus: "ERROR" } : null));
      }
    }
  }, [pdfProgressMap, id, laudo?.pdfStatus, laudo?.pdfUrl, modoPreview]);

  const handleGerarPdfCompleto = async () => {
    if (!id || !laudo) return;

    const modoPdfGerado = laudo.pdfModoPreview || "detalhado";
    const pdfEstaNoModoAtual = modoPdfGerado === modoPreview;

    if (laudo.pdfUrl && laudo.pdfStatus === "COMPLETED" && pdfEstaNoModoAtual) {
      window.open(laudo.pdfUrl, "_blank");
      return;
    }

    const labelModo = PREVIEW_LAYOUTS[modoPreview].label;
    iniciarGeracao(
      laudo.pdfUrl
        ? `Atualizando PDF em ${labelModo}...`
        : `Gerando PDF em ${labelModo}...`
    );
  };

  const handleRegenerarPdf = async () => {
    // Força a geração mesmo se já existir
    iniciarGeracao(`Atualizando PDF em ${PREVIEW_LAYOUTS[modoPreview].label}...`);
  };

  const iniciarGeracao = async (mensagem: string) => {
    if (!id) return;
    try {
      setGerandoPdf(true);
      setProgresso(0);
      setMensagemGeracaoPdf(mensagem);
      wasTriggeredRef.current = true;

      // Envia os valores de layout EXATOS que o preview está usando para que
      // o PDF gerado tenha o mesmo tamanho de imagem do preview, mesmo que o
      // usuário ainda não tenha clicado em "Salvar Alterações".
      await laudosService.requestPdfGeneration(id, modoPreview, {
        margemPagina: configuracoes.margemPagina,
        espacamentoHorizontal: configuracoes.espacamentoHorizontal,
        espacamentoVertical: configuracoes.espacamentoVertical,
      });

      toast.info(mensagem);

      // O progresso será atualizado pelo useEffect do socket
    } catch (error: any) {
      console.error(error);
      setGerandoPdf(false);

      // Se o erro for "já está processando" ou "já está na fila", avisa o usuário
      if (
        error.response?.status === 400 &&
        (error.response?.data?.message?.includes("processamento") ||
          error.response?.data?.message?.includes("fila"))
      ) {
        toast.warning("O PDF já está sendo gerado ou está na fila. Aguarde.");
      } else {
        toast.error("Não foi possível iniciar a geração do PDF.");
      }
    }
  };

  const renderCoverPage = () => {
    if (!laudo) return null;

    return (
      <div
        id="pdf-grid-preview"
        style={{
          width: "210mm",
          height: "297mm",
          boxSizing: "border-box",
          margin: "0 auto",
          borderTop: "8px solid #6f2f9e",
          padding: "10mm 20mm 20mm 20mm",
          backgroundColor: "#fff",
          overflow: "hidden",
          position: "relative",
          fontFamily: '"Roboto", Arial, sans-serif',
          color: "black",
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
              /* O input tem min-width: auto por padrão, o que o impede de
                 preencher todo o espaço do flex container (campo-longo). Isso
                 fazia o preview ficar com caixas cinza mais estreitas que o
                 PDF do backend. min-width: 0 + width: 100% corrigem. */
              min-width: 0;
              width: 100%;
              box-sizing: border-box;
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

        {/* Logo da capa — usa a logo personalizada do laudo se houver, senão a foto de perfil */}
        <LogoCapaEditavel
          src={laudo?.logoPersonalizadaUrl ?? user?.fotoPerfilUrl}
          value={{
            mostrar: configuracoes.mostrarLogoCapa,
            x: configuracoes.logoCapaX,
            y: configuracoes.logoCapaY,
            largura: configuracoes.logoCapaLargura,
            altura: configuracoes.logoCapaAltura,
          }}
          onChange={handleLogoCapaChange}
          editable
        />

        <div style={{ height: "35px" }}></div>

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
                  className={`valor-campo-input ${
                    editedFields.tipoUso ? "field-edited" : ""
                  }`}
                  style={{ flex: 1 }}
                  value={laudo.tipoUso || ""}
                  onChange={(e) => handleFieldChange("tipoUso", e.target.value)}
                  maxLength={200}
                />
              </div>
              <div className="formatacao-campos campo-longo">
                <strong>Endereço:</strong>
                <input
                  className={`valor-campo-input ${
                    editedFields.endereco ? "field-edited" : ""
                  }`}
                  style={{ flex: 1 }}
                  value={laudo.endereco || ""}
                  onChange={(e) =>
                    handleFieldChange("endereco", e.target.value)
                  }
                  maxLength={200}
                />
              </div>
            </div>

            <div className="linha-campos">
              <div className="formatacao-campos campo-curto">
                <strong>Tipo:</strong>
                <input
                  className={`valor-campo-input ${
                    editedFields.tipoImovel ? "field-edited" : ""
                  }`}
                  style={{ flex: 1 }}
                  value={laudo.tipoImovel || laudo.tipo || ""}
                  onChange={(e) =>
                    handleFieldChange("tipoImovel", e.target.value)
                  }
                  maxLength={200}
                />
              </div>
              <div className="formatacao-campos campo-longo">
                <strong>CEP:</strong>
                <input
                  className={`valor-campo-input ${
                    editedFields.cep ? "field-edited" : ""
                  }`}
                  style={{ flex: 1 }}
                  value={laudo.cep || ""}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9-]/g, "");
                    handleFieldChange("cep", val);
                  }}
                  maxLength={9}
                />
              </div>
            </div>

            <div className="linha-campos">
              <div className="formatacao-campos campo-curto">
                <strong>Unidade:</strong>
                <input
                  className={`valor-campo-input ${
                    editedFields.unidade ? "field-edited" : ""
                  }`}
                  style={{ flex: 1 }}
                  value={laudo.unidade || laudo.numero || ""}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, "");
                    handleFieldChange("unidade", val);
                  }}
                  maxLength={20}
                />
              </div>
              <div className="formatacao-campos campo-longo">
                <strong>Tamanho do imóvel:</strong>
                <input
                  className={`valor-campo-input ${
                    editedFields.tamanho ? "field-edited" : ""
                  }`}
                  style={{
                    width: `${Math.max(
                      20,
                      (laudo.tamanho
                        ? laudo.tamanho.replace(" m²", "").length
                        : 1) * 8
                    )}px`,
                    marginLeft: "4px",
                    flex: "none",
                  }}
                  value={laudo.tamanho ? laudo.tamanho.replace(" m²", "") : ""}
                  onChange={(e) => {
                    const val = e.target.value
                      .replace(/[^0-9]/g, "")
                      .substring(0, 10);
                    const finalVal = val ? `${val} m²` : "";
                    handleFieldChange("tamanho", finalVal);
                  }}
                  maxLength={10}
                />
                <span style={{ fontSize: "12px" }}>m²</span>
              </div>
            </div>

            <div className="linha-campos">
              <div className="formatacao-campos campo-curto">
                <strong>Tipo de Vistoria:</strong>
                <select
                  className={`valor-campo-input ${
                    editedFields.tipoVistoria ? "field-edited" : ""
                  }`}
                  value={(laudo.tipoVistoria || "").toUpperCase()}
                  onChange={(e) =>
                    handleFieldChange("tipoVistoria", e.target.value)
                  }
                  style={{ background: "transparent", border: "none", flex: 1 }}
                >
                  <option value="ENTRADA">Entrada</option>
                  <option value="SAIDA">Saída</option>
                  <option value="CONSTATACAO">Constatação</option>
                  <option value="PERIODICA">Periódica</option>
                </select>
              </div>
              <div className="formatacao-campos campo-longo">
                <strong>Realizada em:</strong>
                <input
                  type="date"
                  className={`valor-campo-input ${
                    editedFields.dataVistoria ? "field-edited" : ""
                  }`}
                  style={{ flex: 1 }}
                  value={
                    laudo.dataVistoria
                      ? new Date(laudo.dataVistoria).toISOString().split("T")[0]
                      : laudo.createdAt
                      ? new Date(laudo.createdAt).toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) =>
                    handleFieldChange("dataVistoria", e.target.value)
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <div className="div-metodologia">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
              borderBottom: "solid #c0c0c0 1px",
              paddingBottom: "2px",
            }}
          >
            <h1 style={{ borderBottom: "none", paddingBottom: 0 }}>
              METODOLOGIA
            </h1>
            {(() => {
              const campo = getCampoMetodologiaPorTipo(laudo.tipoVistoria);
              const valor = configuracoes[campo];
              const padrao = getMetodologiaPadrao(laudo.tipoVistoria);
              return valor !== null && valor !== padrao ? (
                <button
                  type="button"
                  onClick={() => handleRestoreDefaultText(campo)}
                  style={{
                    fontSize: "11px",
                    color: "#4338ca",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  Restaurar texto original
                </button>
              ) : null;
            })()}
          </div>
          {(() => {
            const campo = getCampoMetodologiaPorTipo(laudo.tipoVistoria);
            const valor = configuracoes[campo];
            const padrao = getMetodologiaPadrao(laudo.tipoVistoria);
            return (
              <EditableText
                value={valor !== null ? valor : padrao}
                onSave={(newValue) =>
                  handleConfigTextChange(campo, newValue)
                }
                style={{
                  fontSize: "12px",
                  textAlign: "justify",
                  lineHeight: "1.5",
                  borderBottom:
                    valor !== null && valor !== padrao
                      ? "1px dashed #22c55e"
                      : "1px dashed transparent",
                  backgroundColor:
                    valor !== null && valor !== padrao
                      ? "#f0fdf4"
                      : "transparent",
                }}
              />
            );
          })()}
        </div>

        {/* Rodapé com número de página */}
        {renderPageFooter()}
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
          width: "210mm",
          height: "297mm",
          boxSizing: "border-box",
          margin: "0 auto",
          padding: "20mm",
          backgroundColor: "#fff",
          overflow: "hidden",
          position: "relative",
          fontFamily: '"Roboto", Arial, sans-serif',
          color: "black",
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

        <div style={{ height: "35px" }}></div>

        {(() => {
          const tipoNorm = (laudo?.tipoVistoria || "").toLowerCase();
          const ocultarTermos =
            tipoNorm === "constatação" ||
            tipoNorm === "constatacao" ||
            tipoNorm === "periódica" ||
            tipoNorm === "periodica";
          if (ocultarTermos) return null;
          return (
            <div className="termos-gerais">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px",
                  borderBottom: "1px solid #c0c0c0",
                  paddingBottom: "4px",
                  marginBottom: "15px",
                }}
              >
                <h2
                  style={{
                    borderBottom: "none",
                    paddingBottom: 0,
                    marginBottom: 0,
                  }}
                >
                  Termos Gerais
                </h2>
                {configuracoes.termosGeraisTexto !== null &&
                  configuracoes.termosGeraisTexto !==
                    TERMOS_GERAIS_TEXTS.join("\n\n") && (
                    <button
                      type="button"
                      onClick={() => handleRestoreDefaultText("termosGeraisTexto")}
                      style={{
                        fontSize: "11px",
                        color: "#4338ca",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      Restaurar texto original
                    </button>
                  )}
              </div>
              <EditableText
                value={
                  configuracoes.termosGeraisTexto !== null
                    ? configuracoes.termosGeraisTexto
                    : TERMOS_GERAIS_TEXTS.join("\n\n")
                }
                onSave={(newValue) =>
                  handleConfigTextChange("termosGeraisTexto", newValue)
                }
                style={{
                  fontSize: "12px",
                  textAlign: "justify",
                  lineHeight: "1.5",
                  borderBottom:
                    configuracoes.termosGeraisTexto !== null &&
                    configuracoes.termosGeraisTexto !==
                      TERMOS_GERAIS_TEXTS.join("\n\n")
                      ? "1px dashed #22c55e"
                      : "1px dashed transparent",
                  backgroundColor:
                    configuracoes.termosGeraisTexto !== null &&
                    configuracoes.termosGeraisTexto !==
                      TERMOS_GERAIS_TEXTS.join("\n\n")
                      ? "#f0fdf4"
                      : "transparent",
                }}
              />
            </div>
          );
        })()}

        <div className="ambientes-section">
          <h2>Ambientes</h2>
          <div className="ambientes-container">
            {columns.map((col, colIndex) => (
              <div key={colIndex} className="ambiente-col">
                {col.map((amb) => (
                  <div key={amb.ambiente} className="ambiente-item">
                    {amb.originalIndex}.{" "}
                    {amb.ambiente.replace(/^\d+\s*-\s*/, "")}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Rodapé com número de página */}
        {renderPageFooter()}
      </div>
    );
  };

  const normalizeRespostaStatus = (value: unknown) =>
    String(value ?? "")
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ");

  const getRespostaStatusClass = (value: unknown) => {
    const normalized = normalizeRespostaStatus(value);
    if (normalized === "sem irregularidades")
      return "item-valor item-valor-sem-irregularidades";
    if (
      normalized === "com apontamento" ||
      normalized === "com irregularidades"
    )
      return "item-valor item-valor-com-apontamento";
    return "item-valor";
  };

  const formatRespostaStatus = (value: unknown) => {
    const normalized = normalizeRespostaStatus(value);
    if (normalized === "sem irregularidades") return "sem irregularidades";
    if (
      normalized === "com apontamento" ||
      normalized === "com irregularidades"
    )
      return "com apontamento";
    if (normalized === "outros") return "outros";
    return String(value).toLowerCase();
  };

  const renderItemDinamico = (
    sectionName: string,
    questionText: string,
    questionId: string,
    index: number
  ) => {
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
      sectionData =
        detalhes.dadosExtra[sectionName] || detalhes.dadosExtra[normalizedKey];
    }

    // Parsing se for string JSON
    if (typeof sectionData === "string" && sectionData.startsWith("{")) {
      try {
        sectionData = JSON.parse(sectionData);
      } catch {}
    }

    // Buscar o valor da resposta
    let value = "-";
    if (sectionData) {
      if (fieldKey && sectionData[fieldKey] !== undefined) {
        value = sectionData[fieldKey];
      } else if (typeof sectionData === "string" && !fieldKey) {
        // CASO CRÍTICO: Se a seção é apenas uma string (ex: Atestado), retorna ela mesma
        value = sectionData;
      } else if (sectionData[questionText] !== undefined) {
        value = sectionData[questionText];
      } else if (sectionData[questionId] !== undefined) {
        value = sectionData[questionId];
      }
    }

    if (value === null || value === undefined || value === "") value = "-";
    if (typeof value === "object") value = JSON.stringify(value);

    const displayValue = formatRespostaStatus(value);

    return (
      <div className="item-row" key={questionId || index}>
        <span className="item-label">{questionText}</span>
        <span className={getRespostaStatusClass(value)}>{displayValue}</span>
      </div>
    );
  };

  /**
   * Renderiza a(s) página(s) de "Registro de Apontamentos". Espelha o
   * backend (`pdf.service.ts` → `getApontamentosHtml`): header "REGISTRO
   * DE APONTAMENTOS" + meta na primeira página do bloco, grid 3x3 com
   * fotos de altura fixa (200px), borda vermelha em todas (já que só
   * entram aqui fotos marcadas como AVARIA), e legenda exibindo o
   * nome do ambiente e a ordem da foto naquele ambiente. Quando a
   * foto foi enviada com a flag `usarNomeArquivoComoLegenda`, suprime
   * o prefixo "Nº amb (Nº foto)" — exatamente a mesma regra usada na
   * galeria principal (linhas 2527–2534 deste arquivo) e no PDF
   * gerado (`getPhotosHtml` do backend). Múltiplas páginas quando há
   * >9 avarias.
   *
   * Estilo: usa EXATAMENTE os mesmos inline styles e classes Tailwind
   * do card detalhado da galeria principal (linhas ~2620–2730 deste
   * arquivo) — wrapper `border-[3px] border-red-500 mb-1`, imagem com
   * `w-full object-cover` + `height: 200px`, labels com `font-bold
   * uppercase` em 10px e caption em 9px. Isso garante que os cards
   * do Registro de Apontamentos tenham exatamente o mesmo tamanho
   * visual dos cards da galeria principal, sem o bloco `<style>` injetado
   * (que estava deixando os cards menores por conflito com o CSS global).
   */
  const renderApontamentosPage = () => {
    if (!apontamentos || apontamentos.length === 0) {
      return null;
    }
    const total = apontamentos.length;
    // No layout APÓS-FOTOS, o bloco "Registro de Apontamentos" começa
    // logo após a última página de Fotos. Com cover, Fotos começam na
    // página 3; somamos `paginasFotosBackend` para achar o início do
    // bloco. (Antes era hardcoded em 3 — bug: retornava lote vazio
    // quando havia 1+ foto.)
    const inicioApontamentos = 3 + paginasFotosBackend;
    const idxLote = paginaAtual - inicioApontamentos; // 0..N-1
    const inicio = idxLote * FOTOS_POR_PAGINA_APONTAMENTOS;
    const lote = apontamentos.slice(
      inicio,
      inicio + FOTOS_POR_PAGINA_APONTAMENTOS,
    );
    const plural =
      total === 1 ? "1 imagem de avaria" : `${total} imagens de avaria`;

    return (
      <div
        id="pdf-grid-preview"
        className="bg-white"
        style={{
          width: "210mm",
          padding: isModoCompacto
            ? "18px 20px 28px"
            : `${configuracoes.margemPagina}px`,
          height: "297mm",
          boxSizing: "border-box",
          color: "black",
          position: "relative",
          fontFamily: '"Roboto", Arial, sans-serif',
        }}
      >
        {/* Espaçador de 35px no topo, idêntico ao usado em
            `renderContestacaoPage` e `renderRelatorioPage`, para alinhar
            verticalmente o conteúdo principal com as demais páginas. */}
        <div style={{ height: "35px" }}></div>

        {/* Header "REGISTRO DE APONTAMENTOS" só na primeira página do bloco */}
        {idxLote === 0 && (
          <div
            style={{
              borderBottom: "2px solid #000",
              paddingBottom: "6px",
              marginBottom: "14px",
            }}
          >
            <h1
              style={{
                fontSize: "18px",
                fontWeight: 700,
                textTransform: "uppercase",
                margin: 0,
                letterSpacing: "0.5px",
                color: "#000",
              }}
            >
              REGISTRO DE APONTAMENTOS
            </h1>
            <div
              style={{
                display: "flex",
                gap: "16px",
                fontSize: "11px",
                color: "#555",
                marginTop: "4px",
              }}
            >
              <span>{plural}</span>
            </div>
          </div>
        )}

        {/* Grid 3x3 com cards do MESMO tamanho dos da galeria principal:
            mesmo `gap` (dinâmico via configuracoes), mesmo
            `gridTemplateColumns: repeat(3, 1fr)`, mesma estrutura do
            card detalhado (`border-[3px] border-red-500 mb-1` + imagem
            `w-full object-cover` com `height: 200px`, ambiente
            `font-bold uppercase` em 10px, caption em 9px com supressão
            do prefixo "Nº amb (Nº foto)" quando
            `usarNomeArquivoComoLegenda` for true). */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: isModoCompacto
              ? "0 8px"
              : `${configuracoes.espacamentoVertical}px ${configuracoes.espacamentoHorizontal}px`,
            alignContent: "start",
          }}
        >
          {lote.map((img) => {
            const ambienteSemNumero =
              img.ambiente?.replace(/^\d+\s*-\s*/, "") || img.ambiente || "";
            const usarNomeArquivoComoLegenda =
              !!img.usarNomeArquivoComoLegenda;
            const textoLegenda = (img.legenda || "").trim();
            // Gate por categoria=AVARIA: a página de Apontamentos
            // só renderiza fotos AVARIA pelo backend, mas a
            // normalização evita render do círculo se a categoria
            // vier diferente por alguma inconsistência.
            const isAvaria =
              (img.categoria || "").trim().toUpperCase() === "AVARIA";

            return (
              <div key={img.id}>
                <div
                  className="border-[3px] border-red-500 mb-1"
                  style={{ position: "relative" }}
                >
                  <img
                    ref={(el) => {
                      if (!el) return;
                      setPreviewImgRefs((prev) =>
                        prev[img.id] === el
                          ? prev
                          : { ...prev, [img.id]: el },
                      );
                    }}
                    src={img.url}
                    alt={textoLegenda || ambienteSemNumero}
                    className="w-full object-cover"
                    style={{
                      height: "200px",
                      display: "block",
                    }}
                    crossOrigin="anonymous"
                  />
                  <DamageMarkerOverlay
                    imageRef={{
                      current:
                        previewImgRefs[img.id] || null,
                    }}
                    marker={
                      isAvaria ? img.damageMarker ?? null : null
                    }
                    onChange={() => {
                      /* read-only na preview */
                    }}
                    disabled
                    editing
                  />
                  {/* Botão de lápis para abrir o EditImagemModal
                      (mesma affordance da galeria). */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingImage(img);
                    }}
                    aria-label={
                      isAvaria && !img.damageMarker
                        ? "Marcar a região da avaria"
                        : "Abrir imagem"
                    }
                    title={
                      isAvaria && !img.damageMarker
                        ? "Marcar a região da avaria"
                        : "Abrir imagem"
                    }
                    className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/55 hover:bg-black/70 border border-white/25 text-white shadow-md backdrop-blur-sm transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div
                  className="font-bold uppercase"
                  style={{
                    fontSize: "10px",
                    lineHeight: "1.2",
                    textAlign: "left",
                  }}
                >
                  {ambienteSemNumero}
                </div>
                <div
                  className="text-left"
                  style={{
                    fontSize: "9px",
                    lineHeight: "1.4",
                  }}
                >
                  {!usarNomeArquivoComoLegenda && (
                    <span className="font-bold mr-1">
                      {img.numeroAmbiente} ({img.numeroImagemNoAmbiente})
                    </span>
                  )}
                  {textoLegenda || (
                    <span className="text-gray-400 italic">Sem legenda</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {renderPageFooter()}
      </div>
    );
  };

  /**
   * Renderiza a(s) página(s) de Registros Complementares. IDÊNTICA ao
   * backend (pdf.service.ts): header "REGISTROS COMPLEMENTARES" + meta
   * na primeira página do bloco, grid 3x3 com fotos de altura fixa
   * (200px) e legendas individuais. Múltiplas páginas quando há >9 fotos.
   */
  const renderContestacaoPage = () => {
    if (!contestacao?.contestacaoRealizada || !contestacao.imagens?.length) {
      return null;
    }
    const total = contestacao.imagens.length;
    const idxRelatorio = getIdxRelatorio();
    const idxLote = paginaAtual - (idxRelatorio + 1); // 0..N-1
    const inicio = idxLote * FOTOS_POR_PAGINA_CONTESTACAO;
    const lote = contestacao.imagens.slice(
      inicio,
      inicio + FOTOS_POR_PAGINA_CONTESTACAO,
    );
    const dataFmt = contestacao.contestacaoData
      ? new Date(contestacao.contestacaoData).toLocaleDateString("pt-BR")
      : "";
    const plural = total === 1 ? "1 foto anexada" : `${total} fotos anexadas`;

    return (
      <div className="page-container page-standard contestacao-pagina">
        <style>{`
          .contestacao-pagina { padding: 20mm; box-sizing: border-box; }
          .contestacao-header { border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 14px; }
          .contestacao-header-titulo { font-size: 18px; font-weight: 700; text-transform: uppercase; margin: 0; letter-spacing: 0.5px; color: #000; }
          .contestacao-header-meta { display: flex; gap: 16px; font-size: 11px; color: #555; margin-top: 4px; }
          .contestacao-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 4px; }
          .contestacao-card { break-inside: avoid; }
          .contestacao-card-foto { border: 1px solid #9ca3af; overflow: hidden; margin-bottom: 3px; }
          .contestacao-card-foto img { width: 100%; height: 200px; object-fit: cover; object-position: center; display: block; }
          .contestacao-card-legenda { font-size: 9px; line-height: 1.35; text-align: left; color: #000; padding: 0 2px; word-wrap: break-word; }
        `}</style>

        <div style={{ height: "35px" }}></div>

        {idxLote === 0 && (
          <div className="contestacao-header">
            <h1 className="contestacao-header-titulo">
              REGISTROS COMPLEMENTARES
            </h1>
            <div className="contestacao-header-meta">
              {dataFmt && <span>Realizado em {dataFmt}</span>}
              <span>{plural}</span>
            </div>
          </div>
        )}

        <div className="contestacao-grid">
          {lote.map((img) => {
            const legenda = (img.legenda || "").trim();
            return (
              <div key={img.id} className="contestacao-card">
                <div className="contestacao-card-foto" style={{ position: "relative" }}>
                  <img
                    src={img.url}
                    alt={legenda}
                    crossOrigin="anonymous"
                  />
                  {/* Botão de lápis também na página de Contestação —
                      mesmo overlay usado nas demais páginas do preview. */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingImage(img);
                    }}
                    aria-label="Abrir imagem"
                    title="Abrir imagem"
                    className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/55 hover:bg-black/70 border border-white/25 text-white shadow-md backdrop-blur-sm transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="contestacao-card-legenda">{legenda}</div>
              </div>
            );
          })}
        </div>
        {renderPageFooter()}
      </div>
    );
  };

  /**
   * Helpers de paginação: a página de Relatório fica logo APÓS as páginas
   * de Registros Complementares (se houver), e as Assinaturas ficam por
   * último (quando há cover). As páginas de Registro de Apontamentos
   * ficam DEPOIS das páginas de Fotos e ANTES do Relatório — não
   * afetam `getIdxRelatorio` (que continua sendo `totalPaginas - 1 -
   * paginasContestacaoTotal`). O bloco começa na primeira página após
   * a última página de fotos, então o "início" é `3 + paginasFotosBackend`
   * quando há cover. Como `totalPaginas` é a fonte da verdade do
   * total de páginas (vem do `meta.totalPages` do backend somado aos
   * blocos extras), derivamos `paginasFotosBackend` dele.
   */
  const paginasContestacaoTotal =
    contestacao?.contestacaoRealizada && contestacao.imagens?.length
      ? Math.ceil(contestacao.imagens.length / FOTOS_POR_PAGINA_CONTESTACAO)
      : 0;
  const paginasApontamentosTotal = calcularPaginasApontamentos(
    apontamentos?.length,
  );
  const paginasFotosBackend = hasCover
    ? Math.max(0, totalPaginas - 4 - paginasContestacaoTotal - paginasApontamentosTotal)
    : Math.max(0, totalPaginas - paginasContestacaoTotal - paginasApontamentosTotal);
  const getIdxRelatorio = (): number => {
    if (!hasCover) return totalPaginas; // sem cover: relatório é a última
    return totalPaginas - 1 - paginasContestacaoTotal;
  };
  const isContestacaoPage = (pagina: number): boolean => {
    if (!hasCover || paginasContestacaoTotal === 0) return false;
    const primeira = getIdxRelatorio() + 1;
    const ultima = primeira + paginasContestacaoTotal - 1;
    return pagina >= primeira && pagina <= ultima;
  };
  /**
   * Verifica se a página atual faz parte do bloco "Registro de
   * Apontamentos". Com cover, o bloco começa logo após a última página
   * de Fotos e ocupa `paginasApontamentosTotal` páginas.
   */
  const isApontamentosPage = (pagina: number): boolean => {
    if (!hasCover || paginasApontamentosTotal === 0) return false;
    const primeira = 3 + paginasFotosBackend;
    const ultima = primeira + paginasApontamentosTotal - 1;
    return pagina >= primeira && pagina <= ultima;
  };

  const renderRelatorioPage = () => {
    if (!laudo) return null;

    // 1. Preparar lista de seções oficiais
    const sections: any[] = [...(detalhes?.availableSections || [])];

    // Mapeamento de IDs para textos (para evitar UUIDs em labels extras na prévia)
    const questionIdToText = new Map<string, string>();
    sections.forEach((s) => {
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
        const isOfficial =
          sections.some(
            (s) => normalizeSectionName(s.name) === normalizedKey
          ) || Object.values(SECTION_FIELD_MAP).some((m) => m.dataKey === key);

        if (!isOfficial) {
          // Criar uma estrutura de seção compatível para renderização
          const questions =
            typeof value === "object" && value !== null
              ? Object.keys(value).map((k) => ({
                  id: k,
                  questionText: questionIdToText.get(k) || k,
                }))
              : [{ id: "val", questionText: "Descrição" }]; // Para strings simples

          sections.push({
            id: `extra-${key}`,
            name: key,
            questions: questions,
            isExtra: true,
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
          width: "210mm",
          height: "297mm",
          boxSizing: "border-box",
          margin: "0 auto",
          padding: "20mm",
          backgroundColor: "#fff",
          overflow: "hidden",
          position: "relative",
          fontFamily: '"Roboto", Arial, sans-serif',
          color: "black",
        }}
      >
        <style>{`
           .relatorio-titulo { font-size: 14px; font-weight: 700; border-bottom: 2px solid #000; padding-bottom: 4px; margin-bottom: 20px; text-transform: uppercase; }
           .relatorio-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: start; }
           .relatorio-coluna { display: flex; flex-direction: column; gap: 10px; }
           .categoria-box { background-color: #999; color: #fff; padding: 5px 10px; font-weight: 700; margin-bottom: 2px; font-size: 11px; text-transform: uppercase; }
           .item-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; background-color: #d9d9d9; padding: 5px 10px; margin-bottom: 2px; font-size: 11px; }
           .item-label { font-weight: 500; flex: 1; min-width: 0; line-height: 1.3; }
           .item-valor { font-weight: 700; font-size: 10px; text-transform: lowercase; text-align: right; max-width: 45%; min-width: 92px; line-height: 1.3; overflow-wrap: anywhere; }
           .item-valor-sem-irregularidades { color: #15803d; }
           .item-valor-com-apontamento { color: #dc2626; }
           .download-fotos-section { margin-top: 24px; border-top: 2px solid #000; padding-top: 10px; }
           .download-fotos-titulo { font-size: 13px; font-weight: 700; text-transform: uppercase; margin-bottom: 10px; }
           .download-fotos-content { display: flex; align-items: flex-start; gap: 20px; }
           .download-fotos-coluna { flex: 1; min-width: 0; display: flex; flex-direction: column; }
           .download-fotos-text { font-size: 11px; line-height: 1.6; text-align: justify; color: #000; margin: 0; }
           .download-fotos-link { margin-top: 8px; font-size: 10px; line-height: 1.4; color: #2563eb; text-decoration: underline; word-break: break-all; overflow-wrap: anywhere; }
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

        <div style={{ height: "35px" }}></div>

        <h2 className="relatorio-titulo">RELATÓRIO GERAL DE APONTAMENTO</h2>

        <div className="relatorio-grid">
          <div className="relatorio-coluna">
            {col1.map((section) => (
              <div key={section.id} className="grupo">
                <div className="categoria-box">{section.name}</div>
                {section.questions?.map(
                  (q: { questionText?: string; id: string }, idx: number) =>
                    renderItemDinamico(
                      section.name,
                      q.questionText || "",
                      q.id,
                      idx
                    )
                )}
              </div>
            ))}
          </div>

          <div className="relatorio-coluna">
            {col2.map((section) => (
              <div key={section.id} className="grupo">
                <div className="categoria-box">{section.name}</div>
                {section.questions?.map(
                  (q: { questionText?: string; id: string }, idx: number) =>
                    renderItemDinamico(
                      section.name,
                      q.questionText || "",
                      q.id,
                      idx
                    )
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Seção Download de Fotos com QR Code */}
        {(() => {
          const driveUrl = `${window.location.origin}/dashboard/laudos/${id}/drive`;
          return (
            <div className="download-fotos-section">
              <div className="download-fotos-titulo">DOWNLOAD DE FOTOS</div>
              <div className="download-fotos-content">
                <div className="download-fotos-coluna">
                  <p className="download-fotos-text">
                    Para maior conveniência e acessibilidade, as fotos poderão ser
                    baixadas diretamente através do QR Code fornecido neste
                    documento. Ressaltamos que as imagens obtidas são adequadas
                    para outras análises e avaliações, independentemente do que
                    estiver registrado em texto neste laudo. Esta abordagem
                    garante uma verificação visual completa e transparente das
                    condições do imóvel.
                  </p>
                  <a className="download-fotos-link" href={driveUrl}>
                    {driveUrl}
                  </a>
                </div>
                <div className="download-fotos-qrcode">
                  <QRCodeSVG value={driveUrl} size={100} />
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
            Encerra o presente termo, o qual certifica e dá fé dos registros
            apresentados.
          </p>
          <div className="encerramento-rodape"></div>
        </div>

        {/* Rodapé com número de página */}
        {renderPageFooter()}
      </div>
    );
  };

  const renderAssinaturasPage = () => {
    if (!laudo) return null;

    const dataRef =
      laudo.dataRelatorio ||
      laudo.dataVistoria ||
      laudo.createdAt ||
      new Date().toISOString();
    const dataFull = new Date(dataRef);
    const dia = dataFull.getDate().toString().padStart(2, "0");
    const meses = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ];
    const mes = meses[dataFull.getMonth()];
    const ano = dataFull.getFullYear();
    const cidadeDb = laudo.cidade || "";
    const cidade =
      cidadeDb === "" || cidadeDb.toUpperCase() === "SP"
        ? "São Paulo"
        : cidadeDb;

    return (
      <div
        id="pdf-grid-preview"
        style={{
          width: "210mm",
          height: "297mm",
          boxSizing: "border-box",
          margin: "0 auto",
          padding: "20mm",
          backgroundColor: "#fff",
          overflow: "hidden",
          position: "relative",
          fontFamily: '"Roboto", Arial, sans-serif',
          color: "black",
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
           
           .testemunhas-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
           .testemunha-item { display: flex; flex-direction: column; gap: 5px; }
           .testemunha-assinatura-area { height: 45px; border-bottom: 1px solid #000; margin-bottom: 8px; }
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

        <div style={{ height: "35px" }}></div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
            borderBottom: "1px solid #c0c0c0",
            paddingBottom: "4px",
            marginBottom: "20px",
          }}
        >
          <h2
            className="assinaturas-titulo"
            style={{ borderBottom: "none", marginBottom: 0, paddingBottom: 0 }}
          >
            ASSINATURAS
          </h2>
          {configuracoes.assinaturaTexto !== null &&
            configuracoes.assinaturaTexto !== ASSINATURA_TEXTO && (
              <button
                type="button"
                onClick={() => handleRestoreDefaultText("assinaturaTexto")}
                style={{
                  fontSize: "11px",
                  color: "#4338ca",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Restaurar texto original
              </button>
            )}
        </div>

        <EditableText
          className="assinaturas-texto"
          value={
            configuracoes.assinaturaTexto !== null
              ? configuracoes.assinaturaTexto
              : ASSINATURA_TEXTO
          }
          onSave={(newValue) =>
            handleConfigTextChange("assinaturaTexto", newValue)
          }
          style={{
            borderBottom:
              configuracoes.assinaturaTexto !== null &&
              configuracoes.assinaturaTexto !== ASSINATURA_TEXTO
                ? "1px dashed #22c55e"
                : "1px dashed transparent",
            backgroundColor:
              configuracoes.assinaturaTexto !== null &&
              configuracoes.assinaturaTexto !== ASSINATURA_TEXTO
                ? "#f0fdf4"
                : "transparent",
          }}
        />

        <div
          className="assinaturas-data"
          style={{
            textAlign: "center",
            fontSize: "12px",
            marginBottom: "60px",
          }}
        >
          <EditableText
            tag="span"
            value={cidade}
            onSave={(newValue) => handleFieldChange("cidade", newValue)}
            className={`${
              editedFields.cidade
                ? "bg-green-50 border-b border-dashed border-green-500"
                : ""
            }`}
            style={{
              minWidth: "10px",
              display: "inline-block",
            }}
          />
          <span>, </span>
          <EditableText
            tag="span"
            value={laudo.dataRelatorio || `${dia} de ${mes} de ${ano}`}
            onSave={(newValue) => handleFieldChange("dataRelatorio", newValue)}
            className={`${
              editedFields.dataRelatorio
                ? "bg-green-50 border-b border-dashed border-green-500"
                : ""
            }`}
            style={{
              minWidth: "10px",
              display: "inline-block",
            }}
          />
        </div>

        {/* LOCADOR */}
        <div className="assinaturas-box-wrapper">
          <div className="assinaturas-box-header">LOCADOR(A)</div>
          <div className="assinaturas-box">
            <div className="assinaturas-box-content">
              <div className="assinaturas-box-col">
                <input
                  className={`campo-input-assinatura ${
                    editedFields.locadorNome ? "field-edited" : ""
                  }`}
                  placeholder="Nome do Locador"
                  value={laudo.locadorNome || ""}
                  onChange={(e) =>
                    handleFieldChange("locadorNome", e.target.value)
                  }
                />
                <div className="assinaturas-label">Qualificação / Nome</div>
              </div>
              <div className="assinaturas-box-col">
                <input
                  className={`campo-input-assinatura ${
                    editedFields.locadorAssinatura ? "field-edited" : ""
                  }`}
                  placeholder="Assinatura locador"
                  value={laudo.locadorAssinatura || ""}
                  onChange={(e) =>
                    handleFieldChange("locadorAssinatura", e.target.value)
                  }
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
                  className={`campo-input-assinatura ${
                    editedFields.locatarioNome ? "field-edited" : ""
                  }`}
                  placeholder="Nome do Locatário"
                  value={laudo.locatarioNome || ""}
                  onChange={(e) =>
                    handleFieldChange("locatarioNome", e.target.value)
                  }
                />
                <div className="assinaturas-label">Qualificação / Nome</div>
              </div>
              <div className="assinaturas-box-col">
                <input
                  className={`campo-input-assinatura ${
                    editedFields.locatarioAssinatura ? "field-edited" : ""
                  }`}
                  placeholder="Assinatura locatário"
                  value={laudo.locatarioAssinatura || ""}
                  onChange={(e) =>
                    handleFieldChange("locatarioAssinatura", e.target.value)
                  }
                />
                <div className="assinaturas-label">Assinatura</div>
              </div>
            </div>
          </div>
        </div>

        {/* TESTEMUNHAS */}
        <div className="assinaturas-box-wrapper">
          <div className="assinaturas-box-header">TESTEMUNHAS</div>
          <div className="testemunhas-grid">
            <div className="testemunha-item">
              <div className="testemunha-assinatura-area"></div>
              <div className="testemunha-linha">
                <strong>Nome:</strong>
                <input
                  style={{
                    flex: 1,
                    border: "none",
                    background: "transparent",
                    outline: "none",
                    borderBottom: "1px dashed transparent",
                  }}
                  className={`${
                    editedFields.testemunha1Nome ? "field-edited" : ""
                  }`}
                  value={laudo.testemunha1Nome || ""}
                  onChange={(e) =>
                    handleFieldChange("testemunha1Nome", e.target.value)
                  }
                  placeholder="Nome Testemunha 1"
                />
              </div>
              <div className="testemunha-linha">
                <strong>RG:</strong>
                <input
                  style={{
                    flex: 1,
                    border: "none",
                    background: "transparent",
                    outline: "none",
                    borderBottom: "1px dashed transparent",
                  }}
                  className={`${
                    editedFields.testemunha1Rg ? "field-edited" : ""
                  }`}
                  value={laudo.testemunha1Rg || ""}
                  onChange={(e) =>
                    handleFieldChange("testemunha1Rg", e.target.value)
                  }
                  placeholder="RG Testemunha 1"
                />
              </div>
            </div>

            <div className="testemunha-item">
              <div className="testemunha-assinatura-area"></div>
              <div className="testemunha-linha">
                <strong>Nome:</strong>
                <input
                  style={{
                    flex: 1,
                    border: "none",
                    background: "transparent",
                    outline: "none",
                    borderBottom: "1px dashed transparent",
                  }}
                  className={`${
                    editedFields.testemunha2Nome ? "field-edited" : ""
                  }`}
                  value={laudo.testemunha2Nome || ""}
                  onChange={(e) =>
                    handleFieldChange("testemunha2Nome", e.target.value)
                  }
                  placeholder="Nome Testemunha 2"
                />
              </div>
              <div className="testemunha-linha">
                <strong>RG:</strong>
                <input
                  style={{
                    flex: 1,
                    border: "none",
                    background: "transparent",
                    outline: "none",
                    borderBottom: "1px dashed transparent",
                  }}
                  className={`${
                    editedFields.testemunha2Rg ? "field-edited" : ""
                  }`}
                  value={laudo.testemunha2Rg || ""}
                  onChange={(e) =>
                    handleFieldChange("testemunha2Rg", e.target.value)
                  }
                  placeholder="RG Testemunha 2"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé com número de página */}
        {renderPageFooter()}
      </div>
    );
  };

  const hasPendingChanges =
    Object.keys(editedFields).length > 0 || configuracoesAlteradas();

  // Modal de configuração do rodapé (acessível a partir do header).
  const [modalRodapeAberto, setModalRodapeAberto] = useState(false);

  const renderPageFooter = () => {
    const rodape = (laudo?.rodape || "").toString();
    return (
      <div
        style={{
          position: "absolute",
          bottom: "10mm",
          left: "20mm",
          right: "15mm",
          height: "22mm",
          fontFamily: '"Roboto", Arial, sans-serif',
          fontSize: "10px",
          color: "#555",
        }}
      >
        {rodape ? (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: "25mm",
              textAlign: "center",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              maxHeight: "22mm",
              overflow: "hidden",
            }}
          >
            {rodape}
          </div>
        ) : null}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
          }}
        >
          {paginaAtual}
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
            <h1 className="text-xl md:text-2xl font-bold truncate">
              Visualizador de PDF
            </h1>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
            {/* Botão: Configurar Rodapé (mesmo padrão visual do "Baixar PDF") */}
            <Button
              variant="primary"
              onClick={() => setModalRodapeAberto(true)}
              className="w-full sm:w-auto justify-center"
              title="Editar o texto exibido no rodapé de todas as páginas do PDF"
            >
              <Type className="w-4 h-4 mr-2" />
              Configurar Rodapé
            </Button>

            {/* Botão Salvar (Apenas se houver alterações) */}
            {hasPendingChanges && (
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
            {laudo?.pdfStatus === "COMPLETED" && !gerandoPdf && (
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
              className={`w-full sm:w-auto justify-center ${
                gerandoPdf ? "opacity-80 cursor-wait" : ""
              }`}
            >
              {gerandoPdf ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  {progresso > 0
                    ? `Gerando PDF ${progresso}%`
                    : "Solicitando..."}
                </>
              ) : (
                "Baixar PDF" // Ajustado texto para consistência
              )}
            </Button>
          </div>
        </div>

        {/* Paginação */}
        <div className="flex flex-col gap-4 bg-white rounded-lg shadow-sm p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
            <div className="text-sm text-gray-600 text-center sm:text-left">
              Página {paginaAtual} de {totalPaginas} • {totalImagens} imagens
              no total • {imagensPorPagina} por página
            </div>

            <div
              className="inline-flex rounded-lg border border-gray-300 bg-gray-50 p-1"
              aria-label="Modo do preview"
            >
              {(Object.keys(PREVIEW_LAYOUTS) as ModoPreview[]).map((modo) => {
                const ativo = modoPreview === modo;

                return (
                  <button
                    key={modo}
                    type="button"
                    onClick={() => handleModoPreviewChange(modo)}
                    aria-pressed={ativo}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                      ativo
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {PREVIEW_LAYOUTS[modo].label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <button
                onClick={() => irParaPagina(1)}
                disabled={paginaAtual === 1 || loading || totalPaginas === 0}
                className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
                aria-label="Primeira página"
              >
                « Primeira
              </button>

              <button
                onClick={() => irParaPagina(paginaAtual - 1)}
                disabled={paginaAtual === 1 || loading || totalPaginas === 0}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
              >
                ← Anterior
              </button>

              <span className="px-3 py-2 text-gray-700 whitespace-nowrap text-sm font-medium">
                {paginaAtual} / {totalPaginas}
              </span>

              <button
                onClick={() => irParaPagina(paginaAtual + 1)}
                disabled={
                  paginaAtual === totalPaginas || loading || totalPaginas === 0
                }
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
              >
                Próxima →
              </button>

              <button
                onClick={() => irParaPagina(totalPaginas)}
                disabled={
                  paginaAtual === totalPaginas || loading || totalPaginas === 0
                }
                className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
                aria-label="Última página"
              >
                Última »
              </button>
            </div>

            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-gray-600">Ir para:</span>
              <input
                type="number"
                min={1}
                max={Math.max(totalPaginas, 1)}
                value={paginaInput}
                onChange={(e) => setPaginaInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleIrParaPaginaInput();
                  }
                }}
                disabled={loading || totalPaginas === 0}
                className="w-16 px-2 py-2 rounded-lg border border-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              />
              <button
                onClick={handleIrParaPaginaInput}
                disabled={loading || totalPaginas === 0}
                className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
              >
                Ir
              </button>
            </div>
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
          ) : hasCover && isApontamentosPage(paginaAtual) ? (
            renderApontamentosPage()
          ) : hasCover && paginaAtual === totalPaginas ? (
            renderAssinaturasPage()
          ) : hasCover && isContestacaoPage(paginaAtual) ? (
            renderContestacaoPage()
          ) : hasCover && paginaAtual === getIdxRelatorio() ? (
            renderRelatorioPage()
          ) : (
            <div
              id="pdf-grid-preview"
              className={`bg-white transition-opacity duration-200 ${
                loading ? "opacity-50" : "opacity-100"
              }`}
              style={{
                width: "210mm",
                padding: isModoCompacto
                  ? "18px 20px 28px"
                  : `${configuracoes.margemPagina}px`,
                height: "297mm",
                boxSizing: isModoCompacto ? "border-box" : undefined,
                color: "black",
                position: "relative",
                fontFamily: '"Roboto", Arial, sans-serif',
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: isModoCompacto
                    ? "0 8px"
                    : `${configuracoes.espacamentoVertical}px ${configuracoes.espacamentoHorizontal}px`,
                  alignContent: "start",
                }}
              >
                {imagensComUrls.map((img) => {
                  const ambienteSemNumero =
                    img.ambiente?.replace(/^\d+\s*-\s*/, "") || img.ambiente;
                  const numeroFoto =
                    img.numeroImagemNoAmbiente ?? img.count ?? "";
                  const numeroAmbiente = img.numeroAmbiente ?? "";
                  // Flag per-imagem: quando a foto foi enviada com a opção
                  // "Usar nome do arquivo como legenda" ativa, suprimimos o
                  // prefixo "Nº amb (Nº foto)" e mostramos apenas a legenda.
                  const usarNomeArquivoComoLegenda =
                    !!img.usarNomeArquivoComoLegenda;
                  const rotuloCompacto = usarNomeArquivoComoLegenda
                    ? (img.legenda?.trim() || ambienteSemNumero)
                    : `${numeroAmbiente} (${numeroFoto}) ${ambienteSemNumero}`;

                  // Borda vermelha em fotos marcadas como avaria — espelha a
                  // `border-[3px] border-red-500` aplicada em
                  // GaleriaImagens.tsx no card da galeria.
                  const isAvaria =
                    (img.categoria || "").trim().toUpperCase() === "AVARIA";
                  const wrapperClass = isAvaria
                    ? "group border-[3px] border-red-500"
                    : "group border border-gray-300";

                  if (isModoCompacto) {
                    return (
                      <div key={img.id}>
                        <div
                          className={wrapperClass}
                          style={{ position: "relative" }}
                        >
                          <img
                            ref={(el) => {
                              if (!el) return;
                              setPreviewImgRefs((prev) =>
                                prev[img.id] === el
                                  ? prev
                                  : { ...prev, [img.id]: el },
                              );
                            }}
                            src={img.url}
                            alt={`${img.ambiente} - ${img.numeroImagemNoAmbiente}`}
                            className="w-full object-cover"
                            style={{
                              height: "178px",
                              display: "block",
                            }}
                            crossOrigin="anonymous"
                          />
                          {/* Overlay do marcador de avaria. `disabled`
                              pois o preview é sempre read-only — para
                              arrastar/redimensionar o círculo o usuário
                              volta pra galeria. Gate por categoria:
                              só exibe quando AVARIA (igual ao card
                              da galeria e ao PDF gerado pelo backend).
                              Sem o gate, fotos que já foram AVARIA no
                              passado manteriam o círculo visível no
                              preview mesmo após desmarcar — bug
                              reportado. A POSIÇÃO persistida em
                              damageMarker é preservada; só a
                              RENDERIZAÇÃO é gated. */}
                          <DamageMarkerOverlay
                            imageRef={{
                              current:
                                previewImgRefs[img.id] || null,
                            }}
                            marker={
                              isAvaria ? img.damageMarker ?? null : null
                            }
                            onChange={() => {
                              /* read-only no preview */
                            }}
                            disabled
                            editing
                          />
                          {/* Botão de lápis para abrir o EditImagemModal
                              (mesma affordance da galeria). */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingImage(img);
                            }}
                            aria-label={
                              isAvaria && !img.damageMarker
                                ? "Marcar a região da avaria"
                                : "Abrir imagem"
                            }
                            title={
                              isAvaria && !img.damageMarker
                                ? "Marcar a região da avaria"
                                : "Abrir imagem"
                            }
                            className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/55 hover:bg-black/70 border border-white/25 text-white shadow-md backdrop-blur-sm transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <PhotoCardActionsOverlay
                            img={img}
                            isTouchOnly={!hoverSupportedRef.current}
                            showActionsOnMobile={mobileActionsImageId === img.id}
                            anyMobileActionsOpen={mobileActionsImageId !== null}
                            onMobileActionsChange={setMobileActionsImageId}
                            onToggleAvaria={handlePreviewToggleAvaria}
                            onMarcarItem={handlePreviewMarcarItem}
                            onDelete={handlePreviewAskDelete}
                            loadingCategoriaChange={loadingCategoriaChange}
                            loadingItemFlagChange={loadingItemFlagChange}
                          />
                        </div>
                        <div
                          className="font-bold"
                          style={{
                            height: "23px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "9px",
                            lineHeight: "1.2",
                            textAlign: "center",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                          title={rotuloCompacto}
                        >
                          <span
                            style={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: "100%",
                            }}
                          >
                            {rotuloCompacto}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  const isEditing = editingId === img.id;
                  const detailedWrapperClass = isAvaria
                    ? "group border-[3px] border-red-500 mb-1"
                    : "group border border-gray-400 mb-1";

                  return (
                    <div key={img.id}>
                      <div
                        className={detailedWrapperClass}
                        style={{ position: "relative" }}
                      >
                        <img
                          ref={(el) => {
                            if (!el) return;
                            setPreviewImgRefs((prev) =>
                              prev[img.id] === el
                                ? prev
                                : { ...prev, [img.id]: el },
                            );
                          }}
                          src={img.url}
                          alt={`${img.ambiente} - ${img.numeroImagemNoAmbiente}`}
                          className="w-full object-cover"
                          style={{
                            height: "200px",
                            display: "block",
                          }}
                          crossOrigin="anonymous"
                        />
                        <DamageMarkerOverlay
                          imageRef={{
                            current:
                              previewImgRefs[img.id] || null,
                          }}
                          marker={
                            isAvaria ? img.damageMarker ?? null : null
                          }
                          onChange={() => {
                            /* read-only no preview */
                          }}
                          disabled
                          editing
                        />
                        {/* Botão de lápis para abrir o EditImagemModal
                            (mesma affordance da galeria). stopPropagation
                            impede que o clique propague para o wrapper. */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingImage(img);
                          }}
                          aria-label={
                            isAvaria && !img.damageMarker
                              ? "Marcar a região da avaria"
                              : "Abrir imagem"
                          }
                          title={
                            isAvaria && !img.damageMarker
                              ? "Marcar a região da avaria"
                              : "Abrir imagem"
                          }
                          className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/55 hover:bg-black/70 border border-white/25 text-white shadow-md backdrop-blur-sm transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <PhotoCardActionsOverlay
                          img={img}
                          isTouchOnly={!hoverSupportedRef.current}
                          showActionsOnMobile={mobileActionsImageId === img.id}
                          anyMobileActionsOpen={mobileActionsImageId !== null}
                          onMobileActionsChange={setMobileActionsImageId}
                          onToggleAvaria={handlePreviewToggleAvaria}
                          onMarcarItem={handlePreviewMarcarItem}
                          onDelete={handlePreviewAskDelete}
                          loadingCategoriaChange={loadingCategoriaChange}
                          loadingItemFlagChange={loadingItemFlagChange}
                        />
                      </div>
                      <div
                        className="font-bold uppercase"
                        style={{
                          fontSize: "10px",
                          lineHeight: "1.2",
                          textAlign: "left",
                        }}
                      >
                        {ambienteSemNumero}
                      </div>
                      <div
                        className="text-left"
                        style={{
                          fontSize: "9px",
                          lineHeight: "1.4",
                        }}
                      >
                        {isEditing ? (
                          <div>
                            {!usarNomeArquivoComoLegenda && (
                              <div className="flex flex-wrap">
                                <span className="font-bold mr-1">
                                  {img.numeroAmbiente} (
                                  {img.numeroImagemNoAmbiente})
                                </span>
                              </div>
                            )}
                            <textarea
                              value={img.legenda}
                              maxLength={200}
                              onChange={(e) => {
                                setImagensComUrls((prev) =>
                                  prev.map((i) =>
                                    i.id === img.id
                                      ? { ...i, legenda: e.target.value }
                                      : i
                                  )
                                );
                              }}
                              className="w-full border border-blue-400 outline-none resize-none bg-yellow-50 p-1 rounded mt-1"
                              style={{
                                fontSize: "9px",
                                lineHeight: "1.4",
                                fontFamily: "inherit",
                                minHeight: "40px",
                              }}
                              rows={2}
                              autoFocus
                            />
                            <div className="flex justify-between items-center mt-1">
                              <span
                                className={`text-xs ${
                                  (img.legenda?.length || 0) > 180
                                    ? "text-red-500 font-bold"
                                    : "text-gray-500"
                                }`}
                              >
                                {img.legenda?.length || 0}/200
                              </span>
                              <div className="flex gap-1">
                                <button
                                  onClick={async () => {
                                    await handleLegendaChange(
                                      img.id,
                                      img.legenda
                                    );
                                    setEditingId(null);
                                  }}
                                  className="px-2 py-0.5 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                                >
                                  Salvar
                                </button>
                                <button
                                  onClick={() => {
                                    setImagensComUrls((prev) =>
                                      prev.map((i) =>
                                        i.id === img.id
                                          ? {
                                              ...i,
                                              legenda:
                                                originalLegendasRef.current[
                                                  img.id
                                                ] || "",
                                            }
                                          : i
                                      )
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
                            {!usarNomeArquivoComoLegenda && (
                              <span className="font-bold mr-1">
                                {img.numeroAmbiente} ({img.numeroImagemNoAmbiente}
                                )
                              </span>
                            )}
                            {img.legenda || (
                              <span className="text-gray-400 italic">
                                Sem legenda
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Rodapé com número de página */}
              {renderPageFooter()}
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
                {mensagemGeracaoPdf}
              </p>

              <div className="w-full mb-2">
                <div className="flex justify-between text-sm font-medium mb-2">
                  <span className="text-slate-600 dark:text-slate-300">
                    Progresso
                  </span>
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

      {/* Modal: Configurar Rodapé (editado uma vez, vale para todas as páginas) */}
      {modalRodapeAberto && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setModalRodapeAberto(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Type className="w-5 h-5" />
                  Configurar Rodapé do Laudo
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Este texto aparece em todas as páginas do PDF gerado
                  (capa, informações, fotos, relatório e assinaturas).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalRodapeAberto(false)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <RodapeEditor
                value={laudo?.rodape || ""}
                onChange={(val) => handleFieldChange("rodape", val)}
                rows={4}
                hidePreview={false}
              />

              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                Quando terminar de ajustar o texto, clique em{" "}
                <strong>"Salvar Alterações"</strong> aqui em cima para gravar.
                Em seguida, clique em <strong>"Gerar Novamente"</strong> para
                baixar um PDF atualizado com o novo rodapé em todas as páginas.
              </div>
            </div>

            <div className="flex justify-end gap-2 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <Button
                variant="secondary"
                onClick={() => setModalRodapeAberto(false)}
                className="bg-white border-gray-300"
              >
                Fechar
              </Button>
              <Button
                variant="primary"
                onClick={async () => {
                  setModalRodapeAberto(false);
                  await handleSaveChanges();
                }}
                disabled={isSaving}
                className="bg-green-600 hover:bg-green-700 text-white border-0"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Salvar e Fechar
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal compartilhado de edição — aberto pelo botão de lápis
          em cada `<img>` do preview (galeria, apontamentos,
          contestação). Componente único consumido também pela galeria.
          Tab/←/→/setas flutuantes navegam entre as imagens da
          página atual do preview (mesma UX do lightbox da galeria,
          com wrap-around). */}
      <EditImagemModal
        open={!!editingImage}
        imagem={editingImage}
        onClose={handleEditModalClose}
        onMarkerChange={handleEditModalMarkerChange}
        onLegendaChange={handleEditModalLegendaChange}
        onLegendaFlush={handleEditModalLegendaChange}
        onPrev={
          imagensComUrls.length > 1 ? handleEditModalPrev : undefined
        }
        onNext={
          imagensComUrls.length > 1 ? handleEditModalNext : undefined
        }
        hasPrev={imagensComUrls.length > 1}
        hasNext={imagensComUrls.length > 1}
      />
      {/* Confirmação obrigatória de exclusão — mesma UX da galeria.
          Aberto por `handlePreviewAskDelete` (acionado pelo botão
          "Excluir" no overlay de ações do preview). */}
      <ConfirmModal
        isOpen={pendingDeleteId !== null}
        onClose={() => {
          if (!deletingId) setPendingDeleteId(null);
        }}
        onConfirm={handleConfirmPreviewDelete}
        title="Excluir imagem"
        message="Tem certeza que deseja excluir esta imagem? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
        isLoading={deletingId !== null}
        loadingLabel="Excluindo..."
      />
    </div>
  );
}
