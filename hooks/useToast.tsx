"use client";

import { useState, useCallback, createContext, useContext, ReactNode } from "react";

export type ToastType = "success" | "error" | "info" | "warning" | "loading";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  toast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  success: (message: string, description?: string) => void;
  error: (message: string, description?: string) => void;
  info: (message: string, description?: string) => void;
  warning: (message: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((newToast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => {
      // Prevent exact duplicates
      if (prev.some(t => t.message === newToast.message && t.type === newToast.type)) {
        return prev;
      }
      return [...prev, { ...newToast, id }];
    });

    if (newToast.duration !== Infinity && newToast.type !== "loading") {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration || 4000);
    }
  }, [removeToast]);

  const success = useCallback((message: string, description?: string) => toast({ type: "success", message, description }), [toast]);
  const error = useCallback((message: string, description?: string) => toast({ type: "error", message, description }), [toast]);
  const info = useCallback((message: string, description?: string) => toast({ type: "info", message, description }), [toast]);
  const warning = useCallback((message: string, description?: string) => toast({ type: "warning", message, description }), [toast]);

  return (
    <ToastContext.Provider value={{ toasts, toast, removeToast, success, error, info, warning }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
