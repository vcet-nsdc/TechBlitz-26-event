"use client";

import { useEffect, useMemo, useState } from "react";

export function TimerDisplay({ targetAt }: { targetAt: string }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const text = useMemo(() => {
    const remaining = Math.max(0, new Date(targetAt).getTime() - now);
    const hours = Math.floor(remaining / 1000 / 60 / 60);
    const minutes = Math.floor((remaining / 1000 / 60) % 60);
    const seconds = Math.floor((remaining / 1000) % 60);
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }, [now, targetAt]);

  return <div className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1 font-mono text-sm text-zinc-200">{text}</div>;
}
