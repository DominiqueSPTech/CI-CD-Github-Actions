import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type ToastType = "success" | "error";
type Toast = { id: number; type: ToastType; title?: string; message: string; leaving: boolean };
type ToastApi = {
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

const DURATION = { success: 3500, error: 6000 };
const EXIT = 250;
let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), EXIT);
  }, []);

  const push = useCallback(
    (type: ToastType, message: string, title?: string) => {
      const id = ++nextId;
      setToasts((list) => {
        // Evita empilhar o mesmo erro (ex.: várias chamadas falhando juntas).
        const duplicated = list.some((t) => !t.leaving && t.type === type && t.message === message);
        return duplicated ? list : [...list, { id, type, title, message, leaving: false }];
      });
      setTimeout(() => dismiss(id), DURATION[type]);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (message, title) => push("success", message, title),
      error: (message, title) => push("error", message, title),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.type === "error" ? "alert" : "status"}
            className={`toast toast-${t.type}${t.leaving ? " leaving" : ""}`}
            onClick={() => dismiss(t.id)}
          >
            <span className="toast-icon">{t.type === "success" ? "✓" : "!"}</span>
            <span className="toast-body">
              {t.title && <strong className="toast-title">{t.title}</strong>}
              <span>{t.message}</span>
            </span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast precisa estar dentro de <ToastProvider>");
  return ctx;
}
