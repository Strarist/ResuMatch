import { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

export interface ToastOptions {
  duration?: number;
  type?: 'success' | 'error' | 'warning' | 'info';
}

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const addToast = useCallback((message: string, options: ToastOptions = {}) => {
    const id = Math.random().toString(36).substr(2, 9);
    const toast: Toast = {
      id,
      message,
      type: options.type || 'info',
      duration: options.duration || 5000,
    };

    setToasts(prev => [...prev, toast]);

    // Auto remove toast after duration
    setTimeout(() => {
      removeToast(id);
    }, toast.duration);
  }, [removeToast]);

  const success = useCallback((message: string, options?: Omit<ToastOptions, 'type'>) => {
    addToast(message, { ...options, type: 'success' });
  }, [addToast]);

  const error = useCallback((message: string, options?: Omit<ToastOptions, 'type'>) => {
    addToast(message, { ...options, type: 'error' });
  }, [addToast]);

  const warning = useCallback((message: string, options?: Omit<ToastOptions, 'type'>) => {
    addToast(message, { ...options, type: 'warning' });
  }, [addToast]);

  const info = useCallback((message: string, options?: Omit<ToastOptions, 'type'>) => {
    addToast(message, { ...options, type: 'info' });
  }, [addToast]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', options?: Omit<ToastOptions, 'type'>) => {
    addToast(message, { ...options, type });
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
    showToast,
  };
}; 