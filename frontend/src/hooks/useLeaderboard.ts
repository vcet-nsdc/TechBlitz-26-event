"use client";

import { api } from "@/lib/api";
import { socketManager } from "@/lib/socket";
import { useEventStore } from "@/store/eventStore";
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
    mode.type === "lab"
      ? ["leaderboard", "lab", mode.labId]
      : mode.type === "domain"
        ? ["leaderboard", "domain", mode.domain]
        : ["leaderboard", "finals"];

  const query = useQuery({
    queryKey: key,
    queryFn: () =>
      mode.type === "lab"
        ? api.get<LeaderboardEntry[]>(`/leaderboard/lab/${mode.labId}`)
        : mode.type === "domain"
          ? api.get<LeaderboardEntry[]>(`/leaderboard/domain/${mode.domain}`)
          : api.get<LeaderboardEntry[]>("/leaderboard/finals"),
    initialData,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    enabled: mode.type === "finals" || !!(mode.type === "lab" ? mode.labId : mode.domain)
  });

  useEffect(() => {
    if (!socket) return;

    // Subscribe to rooms
    if (mode.type === "lab") {
      socket.emit("broadcast:join_lab", { labId: mode.labId });
      useEventStore.getState().addPendingRoom("/broadcast", `broadcast:join_lab:{"labId":"${mode.labId}"}`);
    } else if (mode.type === "domain") {
      socket.emit("broadcast:join_domain", { domain: mode.domain });
      useEventStore.getState().addPendingRoom("/broadcast", `broadcast:join_domain:{"domain":"${mode.domain}"}`);
    }

    // Debounced update handler
    let updateTimer: ReturnType<typeof setTimeout>;

    if (mode.type === "lab") {
      const handler = (event: LeaderboardLabUpdatedEvent) => {
        if (event.labId !== mode.labId) return;
        clearTimeout(updateTimer);
        updateTimer = setTimeout(() => {
          queryClient.setQueryData(key, (old: LeaderboardEntry[] | undefined) => {
            const prevRanks = Object.fromEntries((old ?? []).map((e) => [e.teamId, e.rank]));
            return event.entries.map((e) => ({
              ...e,
              previousRank: prevRanks[e.teamId] ?? e.rank
            }));
          });
        }, 800);
      };
      socket.on("leaderboard:lab_updated", handler);
      return () => {
        clearTimeout(updateTimer);
        socket.off("leaderboard:lab_updated", handler);
      };
    }

    if (mode.type === "domain") {
      const handler = (event: { domain: string; entries: LeaderboardEntry[] }) => {
        if (event.domain !== mode.domain) return;
        clearTimeout(updateTimer);
        updateTimer = setTimeout(() => {
          queryClient.setQueryData(key, (old: LeaderboardEntry[] | undefined) => {
            const prevRanks = Object.fromEntries((old ?? []).map((e) => [e.teamId, e.rank]));
            return event.entries.map((e) => ({
              ...e,
              previousRank: prevRanks[e.teamId] ?? e.rank
            }));
          });
        }, 800);
      };
      socket.on("leaderboard:domain_updated", handler);
      return () => {
        clearTimeout(updateTimer);
        socket.off("leaderboard:domain_updated", handler);
      };
    }

    // finals
    const handler = (event: { entries: LeaderboardEntry[] }) => {
      clearTimeout(updateTimer);
      updateTimer = setTimeout(() => {
        queryClient.setQueryData(key, (old: LeaderboardEntry[] | undefined) => {
          const prevRanks = Object.fromEntries((old ?? []).map((e) => [e.teamId, e.rank]));
          return event.entries.map((e) => ({
            ...e,
            previousRank: prevRanks[e.teamId] ?? e.rank
          }));
        });
      }, 800);
    };
    socket.on("leaderboard:finals_updated", handler);
    return () => {
      clearTimeout(updateTimer);
      socket.off("leaderboard:finals_updated", handler);
    };
  }, [mode, key, queryClient, socket]);

  return query;
}
