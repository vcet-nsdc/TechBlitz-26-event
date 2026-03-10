"use client";

import { socketManager } from "@/lib/socket";
import { useEventStore } from "@/store/eventStore";
import { Loader2 } from "lucide-react";

type ConnectionStatusProps = {
  namespace?: "/judges" | "/participants" | "/broadcast";
  // legacy compat
  isConnected?: boolean;
  isReconnecting?: boolean;
};

export function ConnectionStatus({ namespace, isConnected: propConnected, isReconnecting: propReconnecting }: ConnectionStatusProps) {
  const connections = useEventStore((s) => s.connections);
  const connState = namespace ? connections[namespace] ?? "disconnected" : undefined;

  const isConnected = propConnected ?? connState === "connected";
  const isReconnecting = propReconnecting ?? connState === "reconnecting";
  const isFailed = connState === "failed";

  if (isFailed) {
    return (
      <div className="flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/20 px-3 py-1 text-xs text-red-300">
        <span className="h-2 w-2 rounded-full bg-red-400" />
        Connection failed
        <button
          onClick={() => {
            if (namespace) {
              socketManager.connect(namespace);
            }
          }}
          className="ml-1 underline hover:text-red-200"
        >
          Retry
        </button>
      </div>
    );
  }

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
    <div className="flex items-center gap-2 rounded-full border border-zinc-500/40 bg-zinc-500/20 px-3 py-1 text-xs text-zinc-400">
      <span className="h-2 w-2 rounded-full bg-zinc-500" />
      Offline
    </div>
  );
}
