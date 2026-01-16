import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

import { API_CONFIG } from '../config/api';

const SOCKET_URL = `${API_CONFIG.baseURL}/queue`;

export interface QueueProgress {
  laudoId: string;
  processedImages: number;
  totalImages: number;
  percentage: number;
}

export const useQueueSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, QueueProgress>>({});
  const [statusMap, setStatusMap] = useState<Record<string, string>>({});
  const [pdfProgressMap, setPdfProgressMap] = useState<Record<string, any>>({});

  useEffect(() => {
    socketRef.current = io(SOCKET_URL);

    socketRef.current.on('connect', () => {
      console.log('Connected to Queue WebSocket');
    });

    socketRef.current.on('progress', (data: QueueProgress) => {
      setProgressMap((prev) => ({
        ...prev,
        [data.laudoId]: data,
      }));
    });
    
    socketRef.current.on('statusChange', (data: { laudoId: string; status: string }) => {
        setStatusMap((prev) => ({
            ...prev,
            [data.laudoId]: data.status
        }));
    });

    socketRef.current.on('pdfProgress', (data: { laudoId: string; status: string; progress: number, url?: string, error?: string }) => {
        console.log('socket: pdfProgress received', data);
        setPdfProgressMap(prev => ({
            ...prev,
            [data.laudoId]: data
        }));
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const joinLaudo = useCallback((laudoId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('joinLaudo', { laudoId });
    }
  }, []);

  const leaveLaudo = useCallback((laudoId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('leaveLaudo', { laudoId });
    }
  }, []);

  return {
    progressMap,
    statusMap,
    pdfProgressMap,
    joinLaudo,
    leaveLaudo,
  };
};
