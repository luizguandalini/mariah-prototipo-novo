/**
 * Serviço de download das fotos do laudo (Mariah Drive).
 *
 * Conversa com os endpoints do backend:
 *  - GET  /uploads/image/:id/download            (binário: JPEG otimizado)
 *  - POST /download/laudo/:laudoId/ambiente/:amb  (enfileira ZIP do ambiente)
 *  - POST /download/laudo/:laudoId                (enfileira ZIP do laudo)
 *  - GET  /download/job/:jobId                    (status do job)
 *
 * Os ZIPs são gerados de forma assíncrona; a conclusão chega por WebSocket
 * (ver `useDownloadSocket`), quando o backend emite `download:ready` com a
 * `url` (presigned) que dispara o .zip. O `getJobStatus` fica disponível
 * como fallback/consulta pontual.
 */

import { api } from "./api";
import { API_CONFIG } from "../config/api";

export type DownloadJobStatus = "queued" | "processing" | "ready" | "error";

export interface DownloadJobResponse {
  jobId: string;
  status: DownloadJobStatus;
  tipo: "ambiente" | "laudo";
  ambiente: string | null;
  totalImagens: number;
  url?: string;
  erro?: string;
  reused?: boolean;
}

function getAuthToken(): string | null {
  return localStorage.getItem("auth_token");
}

/**
 * Extrai o filename de um header Content-Disposition, com fallback.
 */
function filenameFromDisposition(disposition: string | null, fallback: string): string {
  if (!disposition) return fallback;
  const match = /filename\*?=(?:UTF-8''|")?([^";]+)/i.exec(disposition);
  if (match && match[1]) {
    try {
      return decodeURIComponent(match[1].replace(/"/g, "").trim());
    } catch {
      return match[1].replace(/"/g, "").trim();
    }
  }
  return fallback;
}

/**
 * Dispara o salvamento de um Blob no dispositivo via <a download>.
 */
function saveBlob(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Libera o objectURL após o disparo do download.
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

export const downloadService = {
  /**
   * Baixa uma foto (versão otimizada). Como o endpoint exige autenticação e
   * devolve binário, usamos fetch próprio com o Bearer token e salvamos o blob.
   */
  async downloadImagem(imagemId: string): Promise<void> {
    const token = getAuthToken();
    const response = await fetch(
      `${API_CONFIG.baseURL}/uploads/image/${imagemId}/download`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} },
    );

    if (response.status === 401) {
      throw new Error("Sessão expirada. Faça login novamente.");
    }
    if (!response.ok) {
      throw new Error("Não foi possível baixar a foto.");
    }

    const blob = await response.blob();
    const filename = filenameFromDisposition(
      response.headers.get("content-disposition"),
      `foto_${imagemId.substring(0, 8)}.jpg`,
    );
    saveBlob(blob, filename);
  },

  /**
   * Enfileira a geração do ZIP de um ambiente do laudo.
   */
  async requestAmbienteZip(laudoId: string, ambiente: string): Promise<DownloadJobResponse> {
    return api.post<DownloadJobResponse>(
      `/download/laudo/${laudoId}/ambiente/${encodeURIComponent(ambiente)}`,
      undefined,
      true,
    );
  },

  /**
   * Enfileira a geração do ZIP do laudo inteiro.
   */
  async requestLaudoZip(laudoId: string): Promise<DownloadJobResponse> {
    return api.post<DownloadJobResponse>(`/download/laudo/${laudoId}`, undefined, true);
  },

  /**
   * Consulta o status de um job de download.
   */
  async getJobStatus(jobId: string): Promise<DownloadJobResponse> {
    return api.get<DownloadJobResponse>(`/download/job/${jobId}`, true);
  },

  /**
   * Dispara o download de um .zip a partir da presigned URL (já com
   * Content-Disposition: attachment no S3/MinIO).
   */
  abrirDownload(url: string): void {
    const a = document.createElement("a");
    a.href = url;
    a.rel = "noopener";
    a.download = "";
    document.body.appendChild(a);
    a.click();
    a.remove();
  },
};
