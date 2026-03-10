"use client";

import { getSocket } from "@/lib/socket";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";

export function useSocket(namespace: "/judges" | "/participants" | "/broadcast") {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const socket = useMemo(
    () => getSocket(namespace, session?.user.backendToken),
    [namespace, session?.user.backendToken]
  );

  useEffect(() => {
    if (!socket) {
      return;
    }
    const onConnect = () => {
      setIsConnected(true);
      setIsReconnecting(false);
    };
    const onDisconnect = () => setIsConnected(false);
    const onReconnectAttempt = () => setIsReconnecting(true);
    const onReconnect = () => {
      setIsConnected(true);
      setIsReconnecting(false);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.io.on("reconnect_attempt", onReconnectAttempt);
    socket.io.on("reconnect", onReconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.io.off("reconnect_attempt", onReconnectAttempt);
      socket.io.off("reconnect", onReconnect);
    };
  }, [socket]);

  return { socket, isConnected, isReconnecting };
}
