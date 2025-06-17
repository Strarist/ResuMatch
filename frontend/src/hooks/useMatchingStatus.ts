import { useState, useEffect, useCallback } from 'react';
import { useToast } from './useToast';

interface MatchingStatus {
  status: string;
  progress: number;
  error?: string;
}

export const useMatchingStatus = (jobId: string) => {
  const [status, setStatus] = useState<MatchingStatus>({
    status: 'connecting',
    progress: 0
  });
  const [ws, setWs] = useState<WebSocket | null>(null);
  const { showToast } = useToast();

  const connect = useCallback(() => {
    const wsUrl = `${process.env.REACT_APP_WS_URL}/ws/matching/${jobId}`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      setStatus({ status: 'connected', progress: 0 });
      // Start ping interval to keep connection alive
      const pingInterval = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);

      socket.onclose = () => {
        clearInterval(pingInterval);
        setStatus({ status: 'disconnected', progress: 0 });
        // Attempt to reconnect after 5 seconds
        setTimeout(connect, 5000);
      };
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'matching_status') {
          setStatus({
            status: data.status,
            progress: data.progress
          });
        } else if (data.type === 'error') {
          setStatus({
            status: 'error',
            progress: 0,
            error: data.message
          });
          showToast(data.message, 'error');
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setStatus({
        status: 'error',
        progress: 0,
        error: 'Connection error'
      });
      showToast('Connection error', 'error');
    };

    setWs(socket);

    return () => {
      socket.close();
      clearInterval(pingInterval);
    };
  }, [jobId, showToast]);

  useEffect(() => {
    const cleanup = connect();
    return () => {
      cleanup();
      if (ws) {
        ws.close();
      }
    };
  }, [connect]);

  return {
    status: status.status,
    progress: status.progress,
    error: status.error,
    isConnected: status.status === 'connected',
    isError: status.status === 'error'
  };
}; 