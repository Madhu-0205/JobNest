"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, AlertCircle, Info, AlertTriangle, Loader2, X } from "lucide-react";
import { useToast, ToastType } from "@/hooks/useToast";

const icons: Record<ToastType, React.ElementType> = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
  loading: Loader2,
};

const styles: Record<ToastType, string> = {
  success: "bg-emerald-950/80 border-emerald-500/30 text-emerald-300 dark:bg-emerald-950/80 dark:border-emerald-500/30 dark:text-emerald-300 bg-emerald-50 text-emerald-800 border-emerald-200",
  error: "bg-rose-950/80 border-rose-500/30 text-rose-300 dark:bg-rose-950/80 dark:border-rose-500/30 dark:text-rose-300 bg-rose-50 text-rose-800 border-rose-200",
  warning: "bg-amber-950/80 border-amber-500/30 text-amber-300 dark:bg-amber-950/80 dark:border-amber-500/30 dark:text-amber-300 bg-amber-50 text-amber-800 border-amber-200",
  info: "bg-blue-950/80 border-blue-500/30 text-blue-300 dark:bg-blue-950/80 dark:border-blue-500/30 dark:text-blue-300 bg-blue-50 text-blue-800 border-blue-200",
  loading: "bg-card border-border text-foreground dark:bg-card dark:border-border dark:text-foreground bg-card border-border text-foreground",
};

const iconColors: Record<ToastType, string> = {
  success: "text-emerald-500 dark:text-emerald-400",
  error: "text-rose-500 dark:text-rose-400",
  warning: "text-amber-500 dark:text-amber-400",
  info: "text-blue-500 dark:text-blue-400",
  loading: "text-primary",
};

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div
      aria-live="polite"
      className="fixed bottom-0 right-0 z-100 flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px] gap-2 pointer-events-none"
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = icons[toast.type];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              className={`pointer-events-auto flex w-full items-start gap-3 rounded-xl border p-4 shadow-luxury backdrop-blur-md transition-colors ${styles[toast.type]}`}
            >
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconColors[toast.type]} ${toast.type === "loading" ? "animate-spin" : ""}`} />
              
              <div className="flex flex-col gap-1 w-full">
                <p className="text-sm font-semibold">{toast.message}</p>
                {toast.description && (
                  <p className="text-sm opacity-90">{toast.description}</p>
                )}
              </div>

              {toast.type !== "loading" && (
                <button
                  onClick={() => removeToast(toast.id)}
                  className="inline-flex shrink-0 rounded-md opacity-50 hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 transition-opacity"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
