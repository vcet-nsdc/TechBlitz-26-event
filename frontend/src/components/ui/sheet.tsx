"use client";

export function Sheet({
  open,
  onOpenChange,
  children
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <>
      {open ? <div className="fixed inset-0 z-40 bg-black/60" onClick={() => onOpenChange(false)} /> : null}
      <div
        className={`fixed right-0 top-0 z-50 h-full w-96 max-w-[90vw] transform border-l border-zinc-800 bg-zinc-950 p-4 transition-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {children}
      </div>
    </>
  );
}
