import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const TYPE_STYLES = {
  success: 'bg-green-500/20 border-green-500/40 text-green-400',
  error: 'bg-red-500/20 border-red-500/40 text-red-400',
  info: 'bg-blue-500/20 border-blue-500/40 text-blue-400',
  warning: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400',
};

function ToastContainer({ toasts, onRemove }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] space-y-2 max-w-sm">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium shadow-lg animate-slide-in ${TYPE_STYLES[toast.type] || TYPE_STYLES.info}`}
          onClick={() => onRemove(toast.id)}
        >
          <span className="flex-1">{toast.message}</span>
          <button className="text-current opacity-60 hover:opacity-100 text-xs ml-2">x</button>
        </div>
      ))}
    </div>
  );
}
