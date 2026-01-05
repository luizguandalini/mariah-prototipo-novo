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
  updatedAt: string;
}
