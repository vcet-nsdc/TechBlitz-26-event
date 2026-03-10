"use client";

import { socketManager } from "@/lib/socket";
import { useEventStore } from "@/store/eventStore";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";

export function useSocket(namespace: "/judges" | "/participants" | "/broadcast") {
  const { data: session } = useSession();
  const socketRef = useRef<Socket | null>(null);
  const connections = useEventStore((s) => s.connections);
  const connState = connections[namespace] ?? "disconnected";
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    const token = session?.user?.backendToken;
    try {
      socketRef.current = socketManager.connect(namespace, token);
    } catch {
      socketRef.current = null;
    }

    // Do NOT disconnect on unmount — preserve connection across route changes
  }, [namespace, session?.user?.backendToken]);

  useEffect(() => {
    setIsConnected(connState === "connected");
    setIsReconnecting(connState === "reconnecting");
  }, [connState]);

  return { socket: socketRef.current, isConnected, isReconnecting };
}

export function useDisconnectAll() {
  return () => socketManager.disconnectAll();
}
