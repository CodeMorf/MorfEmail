import React from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { ToastMessage } from '../types';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isWarning = toast.type === 'warning';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={`p-3.5 rounded-xl shadow-xl border flex items-start justify-between space-x-3 pointer-events-auto animate-in slide-in-from-bottom-2 duration-150 ${
              isSuccess
                ? 'bg-slate-900 border-emerald-500/40 text-white'
                : isWarning
                ? 'bg-slate-900 border-amber-500/40 text-white'
                : isError
                ? 'bg-slate-900 border-red-500/40 text-white'
                : 'bg-slate-900 border-slate-700 text-white'
            }`}
          >
            <div className="flex items-start space-x-2.5">
              {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />}
              {isWarning && <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />}
              {isError && <XCircle className="w-4 h-4 text-[#F04438] flex-shrink-0 mt-0.5" />}
              {!isSuccess && !isWarning && !isError && <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />}

              <div>
                <div className="text-xs font-bold text-slate-100">{toast.title}</div>
                {toast.message && (
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{toast.message}</p>
                )}
              </div>
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="text-slate-500 hover:text-slate-300 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
