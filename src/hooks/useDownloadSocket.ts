import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

import { API_CONFIG } from "../config/api";

const SOCKET_URL = `${API_CONFIG.baseURL}/download`;
const DEFAULT_TIMEOUT_MS = 2 * 60 * 1000; // ~2 min

export interface DownloadReadyPayload {
  jobId: string;
  laudoId: string;
  tipo: "ambiente" | "laudo";
  ambiente?: string | null;
  url: string;
}

export interface DownloadErrorPayload {
  jobId: string;
  laudoId: string;
  tipo: "ambiente" | "laudo";
  ambiente?: string | null;
  erro: string;
}

interface Waiter {
  resolve: (url: string) => void;
  reject: (err: Error) => void;
}

/**
 * Conexão WebSocket com o namespace `/download` do backend. Entra na sala do
 * usuário (`joinUser`) e resolve a conclusão de cada job de ZIP via eventos
 * `download:ready` / `download:error`.
 *
 * Uso: chame `waitForJob(jobId)` logo após solicitar o ZIP; a Promise resolve
 * com a `url` do .zip pronto, ou rejeita em erro/timeout. Eventos que chegam
 * antes de `waitForJob` ser registrado ficam num buffer e são consumidos na
 * primeira chamada (evita corrida com jobs muito rápidos / reaproveitados).
 */
export const useDownloadSocket = (userId?: string) => {
  const socketRef = useRef<Socket | null>(null);
  const waitersRef = useRef<Map<string, Waiter>>(new Map());
  const bufferRef = useRef<Map<string, { url?: string; erro?: string }>>(new Map());

  useEffect(() => {
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.on("connect", () => {
      if (userId) socket.emit("joinUser", { userId });
    });

    socket.on("download:ready", (p: DownloadReadyPayload) => {
      const waiter = waitersRef.current.get(p.jobId);
      if (waiter) {
        waitersRef.current.delete(p.jobId);
        waiter.resolve(p.url);
      } else {
        bufferRef.current.set(p.jobId, { url: p.url });
      }
    });

    socket.on("download:error", (p: DownloadErrorPayload) => {
      const waiter = waitersRef.current.get(p.jobId);
      if (waiter) {
        waitersRef.current.delete(p.jobId);
        waiter.reject(new Error(p.erro || "Falha ao gerar o download."));
      } else {
        bufferRef.current.set(p.jobId, { erro: p.erro });
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId]);

  // Re-entra na sala se o userId resolver depois da conexão.
  useEffect(() => {
    if (userId && socketRef.current?.connected) {
      socketRef.current.emit("joinUser", { userId });
    }
  }, [userId]);

  const waitForJob = useCallback(
    (jobId: string, timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<string> => {
      return new Promise<string>((resolve, reject) => {
        // Evento já chegou antes do registro do waiter?
        const buffered = bufferRef.current.get(jobId);
        if (buffered) {
          bufferRef.current.delete(jobId);
          if (buffered.url) return resolve(buffered.url);
          return reject(new Error(buffered.erro || "Falha ao gerar o download."));
        }

        const timer = setTimeout(() => {
          waitersRef.current.delete(jobId);
          reject(new Error("A geração do download demorou demais. Tente novamente."));
        }, timeoutMs);

        waitersRef.current.set(jobId, {
          resolve: (url) => {
            clearTimeout(timer);
            resolve(url);
          },
          reject: (err) => {
            clearTimeout(timer);
            reject(err);
          },
        });
      });
    },
    [],
  );

  return { waitForJob };
};
