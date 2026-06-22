import React, { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  removeToast: (id: string) => void;
}

const TYPE_STYLES: Record<ToastType, { container: string; icon: string; bar: string }> = {
  success: {
    container: 'bg-white border-l-4 border-l-emerald-500 border border-slate-200',
    icon: '✅',
    bar: 'bg-emerald-500',
  },
  error: {
    container: 'bg-white border-l-4 border-l-red-500 border border-slate-200',
    icon: '❌',
    bar: 'bg-red-500',
  },
  info: {
    container: 'bg-white border-l-4 border-l-blue-500 border border-slate-200',
    icon: 'ℹ️',
    bar: 'bg-blue-500',
  },
  warning: {
    container: 'bg-white border-l-4 border-l-amber-500 border border-slate-200',
    icon: '⚠️',
    bar: 'bg-amber-500',
  },
};

const SingleToast: React.FC<{ toast: ToastItem; removeToast: (id: string) => void }> = ({
  toast,
  removeToast,
}) => {
  const [exiting, setExiting] = useState(false);
  const duration = toast.duration ?? 5000;
  const styles = TYPE_STYLES[toast.type];

  const dismiss = () => {
    setExiting(true);
    setTimeout(() => removeToast(toast.id), 200);
  };

  useEffect(() => {
    const timer = setTimeout(dismiss, duration);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast.id]);

  return (
    <div
      className={`${styles.container} rounded-xl shadow-lg w-80 overflow-hidden ${exiting ? 'toast-exit' : 'toast-enter'}`}
      role="alert"
    >
      <div className="flex items-start gap-3 px-4 py-3.5">
        <span className="text-base shrink-0 mt-0.5">{styles.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-800 leading-snug">{toast.title}</p>
          {toast.message && (
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed font-mono">{toast.message}</p>
          )}
        </div>
        <button
          onClick={dismiss}
          className="shrink-0 text-slate-400 hover:text-slate-700 transition mt-0.5 text-xs font-bold"
          aria-label="Cerrar notificación"
        >
          ✕
        </button>
      </div>
      {/* Progress bar */}
      <div className="h-0.5 bg-slate-100">
        <div
          className={`h-full ${styles.bar} opacity-50`}
          style={{
            animation: `progress-shrink ${duration}ms linear forwards`,
          }}
        />
      </div>
      <style>{`
        @keyframes progress-shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 items-end pointer-events-none"
      aria-live="polite"
      aria-label="Notificaciones"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <SingleToast toast={toast} removeToast={removeToast} />
        </div>
      ))}
    </div>
  );
};
