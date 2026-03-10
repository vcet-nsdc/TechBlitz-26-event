"use client";

import { Loader2 } from "lucide-react";

export function ConnectionStatus({
  isConnected,
  isReconnecting
}: {
  isConnected: boolean;
  isReconnecting: boolean;
}) {
  if (isReconnecting) {
    return (
      <div className="flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/20 px-3 py-1 text-xs text-amber-300">
        <Loader2 className="h-3 w-3 animate-spin" />
        Reconnecting...
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-3 py-1 text-xs text-emerald-300">
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        Live
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/20 px-3 py-1 text-xs text-red-300">
      <span className="h-2 w-2 rounded-full bg-red-400" />
      Offline
    </div>
  );
}
