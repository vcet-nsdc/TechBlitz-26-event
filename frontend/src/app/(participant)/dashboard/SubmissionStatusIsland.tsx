"use client";

import { Badge } from "@/components/ui/badge";
import { useSocket } from "@/hooks/useSocket";
import { SubmissionStatusChangedEvent } from "@/types/events";
import { useEffect, useState } from "react";

export function SubmissionStatusIsland({
  teamId,
  initialStatus
}: {
  teamId: string;
  initialStatus: string;
}) {
  const { socket } = useSocket("/participants");
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    if (!socket) {
      return;
    }
    socket.emit("participant:join_team", { teamId });
    const handler = (event: SubmissionStatusChangedEvent) => {
      if (event.teamId === teamId) {
        setStatus(event.status);
      }
    };
    socket.on("submission:status_changed", handler);
    return () => {
      socket.off("submission:status_changed", handler);
    };
  }, [socket, teamId]);

  return <Badge>{status}</Badge>;
}
