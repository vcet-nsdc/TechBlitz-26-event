"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

type ToastItem = { id: string; title: string; description?: string; variant?: "default" | "error" };
type ToastContextValue = {
  toast: (input: Omit<ToastItem, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const value = useMemo(
    () => ({
      toast: (input: Omit<ToastItem, "id">) => {
        const id = crypto.randomUUID();
        setItems((prev) => [...prev, { ...input, id }]);
        setTimeout(() => {
          setItems((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
      }
    }),
    []
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-[70] flex w-80 flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={`rounded-md border p-3 text-sm ${
              item.variant === "error" ? "border-red-500/50 bg-red-950 text-red-200" : "border-zinc-700 bg-zinc-900 text-zinc-100"
            }`}
          >
            <div className="font-semibold">{item.title}</div>
            {item.description ? <div className="text-xs text-zinc-300">{item.description}</div> : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return context;
}
