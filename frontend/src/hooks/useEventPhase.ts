"use client";

import { useSocket } from "@/hooks/useSocket";
import { useEventStore } from "@/store/eventStore";
import { EventPhaseChangedEvent } from "@/types/events";
import { useEffect } from "react";

export function useEventPhase() {
  const { socket } = useSocket("/broadcast");
  const { phase, setPhase } = useEventStore();

  useEffect(() => {
    if (!socket) {
      return;
    }
    const handler = (event: EventPhaseChangedEvent) => {
      setPhase(event.phase);
    };
    socket.on("event:phase_changed", handler);
    return () => {
      socket.off("event:phase_changed", handler);
    };
  }, [setPhase, socket]);

  return { phase };
}
