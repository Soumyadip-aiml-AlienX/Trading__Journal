'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const success = useCallback((msg: string) => showToast(msg, 'success'), [showToast]);
  const error = useCallback((msg: string) => showToast(msg, 'error'), [showToast]);
  const warning = useCallback((msg: string) => showToast(msg, 'warning'), [showToast]);

  const getToastClass = (type: ToastType) => {
    switch (type) {
      case 'error': return 'toast-error';
      case 'warning': return 'toast-warning';
      default: return 'toast-success';
    }
  };

  const getEmoji = (type: ToastType) => {
    switch (type) {
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return '✅';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning }}>
      {children}
      
      {/* Toast Container */}
      <div className="toast-container select-none" aria-live="polite" role="status">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast ${getToastClass(t.type)} flex items-center gap-2.5 shadow-lg border border-opacity-30`}
          >
            <span className="text-sm">{getEmoji(t.type)}</span>
            <span className="font-semibold text-xs leading-normal">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
