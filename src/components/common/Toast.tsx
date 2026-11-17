import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Undo2 } from 'lucide-react';

export interface ToastData {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning';
  undoAction?: () => void;
  duration?: number;
}

interface ToastProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onDismiss(toast.id), 300);
    }, toast.duration || 5000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const icons = {
    success: <CheckCircle size={20} className="text-green-500" />,
    error: <XCircle size={20} className="text-red-500" />,
    warning: <AlertTriangle size={20} className="text-amber-500" />,
  };

  return (
    <div className={`${exiting ? 'toast-exit' : 'toast-enter'} flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 px-4 py-3 min-w-[300px] max-w-md`}>
      {icons[toast.type]}
      <span className="flex-1 text-sm text-slate-700 dark:text-slate-200">{toast.message}</span>
      {toast.undoAction && (
        <button
          onClick={() => { toast.undoAction?.(); onDismiss(toast.id); }}
          className="flex items-center gap-1 text-indigo-500 hover:text-indigo-600 text-sm font-medium"
        >
          <Undo2 size={14} />
          Undo
        </button>
      )}
    </div>
  );
}
