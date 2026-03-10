"use client";

import { api } from "@/lib/api";
import { LeaderboardEntry } from "@/types/entities";
import { LeaderboardLabUpdatedEvent } from "@/types/events";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useSocket } from "./useSocket";

type Mode = { type: "lab"; labId: string } | { type: "domain"; domain: string } | { type: "finals" };

export function useLeaderboard(mode: Mode, initialData?: LeaderboardEntry[]) {
  const { socket } = useSocket("/broadcast");
  const queryClient = useQueryClient();

  const key =
    mode.type === "lab" ? ["leaderboard", "lab", mode.labId] : mode.type === "domain" ? ["leaderboard", "domain", mode.domain] : ["leaderboard", "finals"];

  const query = useQuery({
    queryKey: key,
    queryFn: () =>
      mode.type === "lab"
        ? api.get<LeaderboardEntry[]>(`/leaderboard/lab/${mode.labId}`)
        : mode.type === "domain"
          ? api.get<LeaderboardEntry[]>(`/leaderboard/domain/${mode.domain}`)
          : api.get<LeaderboardEntry[]>("/leaderboard/finals"),
    initialData
  });

  useEffect(() => {
    if (!socket) {
      return;
    }
    if (mode.type === "lab") {
      socket.emit("broadcast:subscribe_lab", { labId: mode.labId });
      socket.emit("broadcast:join_lab", { labId: mode.labId });
      const handler = (event: LeaderboardLabUpdatedEvent) => {
        if (event.labId !== mode.labId) {
          return;
        }
        queryClient.setQueryData(key, event.entries);
      };
      socket.on("leaderboard:lab_updated", handler);
      return () => {
        socket.off("leaderboard:lab_updated", handler);
      };
    }

    if (mode.type === "domain") {
      socket.emit("broadcast:join_domain", { domain: mode.domain });
      const handler = (event: { domain: string; entries: LeaderboardEntry[] }) => {
        if (event.domain !== mode.domain) {
          return;
        }
        queryClient.setQueryData(key, event.entries);
      };
      socket.on("leaderboard:domain_updated", handler);
      return () => {
        socket.off("leaderboard:domain_updated", handler);
      };
    }

    const handler = (event: { entries: LeaderboardEntry[] }) => {
      queryClient.setQueryData(key, event.entries);
    };
    socket.on("leaderboard:finals_updated", handler);
    return () => {
      socket.off("leaderboard:finals_updated", handler);
    };
  }, [mode, key, queryClient, socket]);

  return query;
}
