import React from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div
      id="toast-container"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0"
    >
      <AnimatePresence>
        {toasts.map((t) => {
          const icons = {
            success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />,
            error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />,
            warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />,
            info: <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />,
          };

          const borderColors = {
            success: "border-emerald-200 bg-white dark:bg-slate-900 dark:border-emerald-800/80 shadow-emerald-500/10",
            error: "border-rose-200 bg-white dark:bg-slate-900 dark:border-rose-800/80 shadow-rose-500/10",
            warning: "border-amber-200 bg-white dark:bg-slate-900 dark:border-amber-800/80 shadow-amber-500/10",
            info: "border-indigo-200 bg-white dark:bg-slate-900 dark:border-indigo-800/80 shadow-indigo-500/10",
          };

          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto rounded-xl border p-4 shadow-lg flex items-start justify-between gap-3 ${borderColors[t.type]}`}
            >
              <div className="flex items-start gap-3">
                {icons[t.type]}
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {t.title}
                  </h4>
                  {t.message && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                      {t.message}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => onDismiss(t.id)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
