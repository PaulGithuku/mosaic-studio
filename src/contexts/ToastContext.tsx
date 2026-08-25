import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ToastItem, ToastType } from '../types/ui';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, description?: string, duration?: number) => void;
  addToast: (message: string, type?: ToastType, description?: string, duration?: number) => void;
  success: (message: string, description?: string) => void;
  error: (message: string, description?: string) => void;
  info: (message: string, description?: string) => void;
  warning: (message: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', description?: string, duration = 4500) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { id, type, message, description, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback((msg: string, desc?: string) => showToast(msg, 'success', desc), [showToast]);
  const error = useCallback((msg: string, desc?: string) => showToast(msg, 'error', desc, 6000), [showToast]);
  const info = useCallback((msg: string, desc?: string) => showToast(msg, 'info', desc), [showToast]);
  const warning = useCallback((msg: string, desc?: string) => showToast(msg, 'warning', desc), [showToast]);
  const addToast = useCallback((msg: string, type?: ToastType, desc?: string) => showToast(msg, type, desc), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, addToast, success, error, info, warning }}>
      {children}
      <div
        id="toast-container"
        className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0"
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              className={`pointer-events-auto flex items-start justify-between p-4 rounded-md border shadow-xl backdrop-blur-md transition-all ${
                toast.type === 'success'
                  ? 'bg-[#141414]/95 border-[#C9A86A]/40 text-[#F7F5F0]'
                  : toast.type === 'error'
                  ? 'bg-[#181111]/95 border-red-500/40 text-[#F7F5F0]'
                  : toast.type === 'warning'
                  ? 'bg-[#181611]/95 border-amber-500/40 text-[#F7F5F0]'
                  : 'bg-[#161616]/95 border-[#DDDBD6]/20 text-[#F7F5F0]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-[#C9A86A]" />}
                  {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400" />}
                  {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                  {toast.type === 'info' && <Info className="w-5 h-5 text-[#E7D7BE]" />}
                </div>
                <div>
                  <p className="text-sm font-medium leading-tight text-[#F7F5F0]">{toast.message}</p>
                  {toast.description && (
                    <p className="mt-1 text-xs text-[#A0A0A0] leading-relaxed">{toast.description}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-3 shrink-0 text-[#6F6F6F] hover:text-[#F7F5F0] transition-colors p-1"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
