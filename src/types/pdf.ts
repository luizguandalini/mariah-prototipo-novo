// Tipos para PDF
export interface ImagemPdfDto {
  id: string;
  s3Key: string;
  ambiente: string;
  numeroAmbiente: number;
  numeroImagemNoAmbiente: number;
  legenda: string;
  ordem: number;
  categoria: string;
  tipo: string;
  // Flag per-imagem: indica se esta foto foi enviada com a opção
  // "Usar nome do arquivo como legenda" ativa. Quando true, o PDF não
  // inclui o prefixo "Nº amb (Nº foto)" — apenas a legenda.
  usarNomeArquivoComoLegenda?: boolean;
}

export interface ImagensPdfResponse {
  data: ImagemPdfDto[];
  meta: {
    currentPage: number;
    totalPages: number;
    totalImages: number;
    imagesPerPage: number;
  };
}

export interface ConfiguracaoPdfUsuario {
  id: string;
  usuarioId: string;
  espacamentoHorizontal: number;
  espacamentoVertical: number;
  margemPagina: number;
  metodologiaTexto: string | null;
  // Texto de METODOLOGIA customizado por tipo de vistoria. Quando null,
  // usa o padrão (ou o legado `metodologiaTexto` para tipos sem override).
  metodologiaEntradaTexto: string | null;
  metodologiaSaidaTexto: string | null;
  metodologiaConstatacaoTexto: string | null;
  metodologiaPeriodicaTexto: string | null;
  termosGeraisTexto: string | null;
  assinaturaTexto: string | null;
  updatedAt: string;
}
