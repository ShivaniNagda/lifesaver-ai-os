import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Info, 
  Sparkles, 
  X,
  Target,
  Leaf,
  ClipboardList,
  Calendar,
  Mail,
  Bell
} from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info" | "ai";

export interface ToastOptions {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  duration?: number;
  icon?: "success" | "error" | "warning" | "info" | "ai" | "goal" | "habit" | "task" | "calendar" | "email" | "bell";
  actions?: {
    label: string;
    onClick: () => void;
    primary?: boolean;
  }[];
}

interface ToastContextType {
  toast: (options: Omit<ToastOptions, "id">) => void;
  success: (message: string, description?: string, icon?: ToastOptions["icon"]) => void;
  error: (message: string, description?: string, icon?: ToastOptions["icon"]) => void;
  warning: (message: string, description?: string, icon?: ToastOptions["icon"]) => void;
  info: (message: string, description?: string, icon?: ToastOptions["icon"]) => void;
  ai: (message: string, description?: string, icon?: ToastOptions["icon"]) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastOptions[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((options: Omit<ToastOptions, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastOptions = {
      ...options,
      id,
      duration: options.duration ?? 4000,
    };
    setToasts((prev) => [...prev, newToast]);

    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }
  }, [removeToast]);

  const success = useCallback((message: string, description?: string, icon?: ToastOptions["icon"]) => {
    toast({ type: "success", message, description, icon: icon ?? "success" });
  }, [toast]);

  const error = useCallback((message: string, description?: string, icon?: ToastOptions["icon"]) => {
    toast({ type: "error", message, description, icon: icon ?? "error" });
  }, [toast]);

  const warning = useCallback((message: string, description?: string, icon?: ToastOptions["icon"]) => {
    toast({ type: "warning", message, description, icon: icon ?? "warning" });
  }, [toast]);

  const info = useCallback((message: string, description?: string, icon?: ToastOptions["icon"]) => {
    toast({ type: "info", message, description, icon: icon ?? "info" });
  }, [toast]);

  const ai = useCallback((message: string, description?: string, icon?: ToastOptions["icon"]) => {
    toast({ type: "ai", message, description, icon: icon ?? "ai", duration: 5000 });
  }, [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info, ai, removeToast }}>
      {children}
      
      {/* Toast Portal Container */}
      <div 
        id="toast-portal-container"
        className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none select-none"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <ToastItem key={t.id} item={t} onDismiss={removeToast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

interface ToastItemProps {
  item: ToastOptions;
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ item, onDismiss }) => {
  const { id, type, message, description, duration = 4000, icon, actions } = item;

  // Icon Selection
  const renderIcon = () => {
    const iconSize = 20;
    const select = icon || type;
    switch (select) {
      case "success":
        return <CheckCircle2 size={iconSize} className="text-emerald-500" />;
      case "error":
        return <XCircle size={iconSize} className="text-rose-500" />;
      case "warning":
        return <AlertTriangle size={iconSize} className="text-amber-500" />;
      case "info":
        return <Info size={iconSize} className="text-sky-500" />;
      case "ai":
        return <Sparkles size={iconSize} className="text-violet-400 animate-pulse" />;
      case "goal":
        return <Target size={iconSize} className="text-fuchsia-500" />;
      case "habit":
        return <Leaf size={iconSize} className="text-teal-500" />;
      case "task":
        return <ClipboardList size={iconSize} className="text-indigo-500" />;
      case "calendar":
        return <Calendar size={iconSize} className="text-orange-500" />;
      case "email":
        return <Mail size={iconSize} className="text-cyan-500" />;
      case "bell":
        return <Bell size={iconSize} className="text-indigo-400 animate-bounce" />;
      default:
        return <CheckCircle2 size={iconSize} className="text-emerald-500" />;
    }
  };

  // Border & Accent Color Styles
  const getStyles = () => {
    switch (type) {
      case "success":
        return {
          border: "border-emerald-500/20",
          background: "bg-emerald-950/20 backdrop-blur-md dark:bg-emerald-950/20",
          indicator: "bg-emerald-500",
          shadow: "shadow-emerald-950/10",
        };
      case "error":
        return {
          border: "border-rose-500/20",
          background: "bg-rose-950/20 backdrop-blur-md dark:bg-rose-950/20",
          indicator: "bg-rose-500",
          shadow: "shadow-rose-950/10",
        };
      case "warning":
        return {
          border: "border-amber-500/20",
          background: "bg-amber-950/15 backdrop-blur-md dark:bg-amber-950/15",
          indicator: "bg-amber-500",
          shadow: "shadow-amber-950/10",
        };
      case "info":
        return {
          border: "border-sky-500/20",
          background: "bg-sky-950/20 backdrop-blur-md dark:bg-sky-950/20",
          indicator: "bg-sky-500",
          shadow: "shadow-sky-950/10",
        };
      case "ai":
        return {
          border: "border-violet-500/30",
          background: "bg-gradient-to-r from-violet-950/30 via-fuchsia-950/25 to-violet-950/30 backdrop-blur-md dark:from-violet-950/30 dark:to-violet-950/30",
          indicator: "bg-gradient-to-r from-violet-400 to-fuchsia-400",
          shadow: "shadow-violet-900/10",
        };
      default:
        return {
          border: "border-zinc-800",
          background: "bg-zinc-900/80 backdrop-blur-md dark:bg-zinc-900/80",
          indicator: "bg-zinc-500",
          shadow: "shadow-black/20",
        };
    }
  };

  const styles = getStyles();

  return (
    <motion.div
      id={`toast-${id}`}
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 350, damping: 28 }}
      className={`pointer-events-auto flex flex-col relative overflow-hidden rounded-xl border ${styles.border} ${styles.background} p-4 shadow-lg ${styles.shadow} max-w-sm w-full`}
    >
      {/* Dismiss Button */}
      <button
        id={`toast-close-${id}`}
        onClick={() => onDismiss(id)}
        className="absolute top-2 right-2 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer focus:outline-none text-zinc-500 hover:text-zinc-300"
      >
        <X size={14} />
      </button>

      {/* Main Toast Layout */}
      <div className="flex gap-3 items-start">
        <div className="mt-0.5 shrink-0 flex items-center justify-center">
          {renderIcon()}
        </div>
        <div className="flex-1 pr-4">
          <h4 className="text-sm font-semibold text-zinc-100 leading-tight">
            {message}
          </h4>
          {description && (
            <p className="mt-1 text-xs text-zinc-400 leading-relaxed font-normal">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Interactive Action Buttons */}
      {actions && actions.length > 0 && (
        <div className="mt-3 flex gap-2 justify-end">
          {actions.map((act, i) => (
            <button
              key={i}
              onClick={() => {
                act.onClick();
                onDismiss(id);
              }}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer focus:outline-none ${
                act.primary
                  ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-900/30"
                  : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-zinc-100"
              }`}
            >
              {act.label}
            </button>
          ))}
        </div>
      )}

      {/* Progress Dismiss Bar Indicator */}
      {duration > 0 && (!actions || actions.length === 0) && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-800/40">
          <motion.div
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: duration / 1000, ease: "linear" }}
            className={`h-full ${styles.indicator}`}
          />
        </div>
      )}
    </motion.div>
  );
};
