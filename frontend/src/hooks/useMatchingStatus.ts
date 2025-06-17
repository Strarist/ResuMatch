import { useState, useEffect, useRef } from 'react';
import { useToast } from './useToast';

interface MatchingStatus {
  status: 'idle' | 'processing' | 'completed' | 'error';
  progress: number;
  message?: string;
}

export const useMatchingStatus = (jobId: string) => {
  const [status, setStatus] = useState<MatchingStatus>({
    status: 'idle',
    progress: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<number | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (!jobId) return;

    const wsUrl = `${import.meta.env.VITE_WS_URL || 'ws://localhost:8000'}/ws/matching/${jobId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
      showToast('Connected to matching service', 'success');
      
      // Start ping interval
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000); // Ping every 30 seconds
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'status_update':
            setStatus({
              status: data.status,
              progress: data.progress || 0,
              message: data.message,
            });
            break;
          case 'completed':
            setStatus({
              status: 'completed',
              progress: 100,
              message: 'Matching completed successfully',
            });
            showToast('Matching completed!', 'success');
            break;
          case 'error':
            setError(data.message || 'An error occurred during matching');
            setStatus({
              status: 'error',
              progress: 0,
              message: data.message,
            });
            showToast('Matching failed', 'error');
            break;
          case 'pong':
            // Ping response, do nothing
            break;
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    ws.onerror = (event) => {
      setError('WebSocket connection error');
      setIsConnected(false);
      showToast('Connection error', 'error');
    };

    ws.onclose = () => {
      setIsConnected(false);
      setError('Connection closed');
    };

    return () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [jobId, showToast]);

  return { 
    status: status.status, 
    progress: status.progress, 
    error, 
    isConnected 
  };
}; 