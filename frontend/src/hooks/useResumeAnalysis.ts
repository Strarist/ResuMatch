import { useState, useEffect, useCallback } from 'react';
import { useToast } from './useToast';

interface AnalysisStatus {
  status: string;
  progress: number;
  error?: string;
}

export const useResumeAnalysis = (resumeId?: string) => {
  const [status, setStatus] = useState<AnalysisStatus>({
    status: 'idle',
    progress: 0
  });
  const [ws, setWs] = useState<WebSocket | null>(null);
  const { showToast } = useToast();

  const connect = useCallback(() => {
    if (!resumeId) return;
    
    const wsUrl = `${process.env.REACT_APP_WS_URL}/ws/analysis/${resumeId}`;
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
        if (data.type === 'analysis_update') {
          setStatus({
            status: data.status,
            progress: data.progress || 0
          });

          // Show toast for important status changes
          if (data.status === 'completed') {
            showToast('Resume analysis completed', 'success');
          } else if (data.status === 'error') {
            showToast(data.error || 'Analysis failed', 'error');
          }
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
  }, [resumeId, showToast]);

  useEffect(() => {
    const cleanup = connect();
    return () => {
      cleanup?.();
      if (ws) {
        ws.close();
      }
    };
  }, [connect]);

  // Poll for status if no WebSocket connection
  useEffect(() => {
    if (!resumeId || status.status === 'connected') return;

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/v1/resumes/${resumeId}/status`);
        const data = await response.json();
        
        setStatus({
          status: data.status,
          progress: data.status === 'completed' ? 100 : 0
        });
      } catch (error) {
        console.error('Error polling status:', error);
      }
    };

    const interval = setInterval(pollStatus, 5000);
    return () => clearInterval(interval);
  }, [resumeId, status.status]);

  return {
    status: status.status,
    progress: status.progress,
    error: status.error,
    isConnected: status.status === 'connected',
    isError: status.status === 'error'
  };
}; 