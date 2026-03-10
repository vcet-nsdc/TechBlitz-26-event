"use client";

import { cn } from "@/lib/utils";

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  if (!open) {
    return null;
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-950 p-4">
        <h3 className="text-lg font-semibold text-zinc-100">{title}</h3>
        {description ? <p className="mt-1 text-sm text-zinc-400">{description}</p> : null}
        <div className="mt-4">{children}</div>
        <button onClick={() => onOpenChange(false)} className={cn("mt-4 text-sm text-zinc-400 hover:text-zinc-200")}>
          Close
        </button>
      </div>
    </div>
  );
}
