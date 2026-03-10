"use client";

import { api } from "@/lib/api";
import { useSocket } from "@/hooks/useSocket";
import { LeaderboardEntry, Score } from "@/types/entities";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type ScorePayload = {
  teamId: string;
  round: string;
  criteria: { criteriaId: string; value: number }[];
};

export function useScoreSubmit(teamId: string, labId?: number | string) {
  const queryClient = useQueryClient();
  const { socket } = useSocket("/judges");
  const leaderboardKey = labId ? ["leaderboard", "lab", String(labId)] : undefined;

  return useMutation({
    mutationFn: (payload: ScorePayload) => api.post<{ accepted: true }>("/scores", payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ["scores", teamId] });
      const previousScores = queryClient.getQueryData<Score[]>(["scores", teamId]);

      // Optimistic: mark team's entry
      let previousLeaderboard: LeaderboardEntry[] | undefined;
      if (leaderboardKey) {
        await queryClient.cancelQueries({ queryKey: leaderboardKey });
        previousLeaderboard = queryClient.getQueryData<LeaderboardEntry[]>(leaderboardKey);
        queryClient.setQueryData(leaderboardKey, (old: LeaderboardEntry[] | undefined) => {
          if (!old) return old;
          return old.map((e) =>
            e.teamId === teamId ? { ...e, _optimistic: true } : e
          );
        });
      }

      const optimistic: Score[] = payload.criteria.map((c, idx) => ({
        id: `optimistic-${idx}`,
        teamId: payload.teamId,
        judgeId: "self",
        criteriaId: c.criteriaId,
        round: payload.round,
        value: c.value,
        criteria: { id: c.criteriaId, name: "Criterion", maxScore: 10, domain: "UIUX" as const, isFinal: false },
        submittedAt: new Date().toISOString()
      }));
      queryClient.setQueryData(["scores", teamId], optimistic);

      return { previousScores, previousLeaderboard };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousScores) {
        queryClient.setQueryData(["scores", teamId], context.previousScores);
      }
      if (context?.previousLeaderboard && leaderboardKey) {
        queryClient.setQueryData(leaderboardKey, context.previousLeaderboard);
      }
    },
    onSuccess: () => {
      // score:accepted is emitted server-side after POST /scores succeeds
      queryClient.invalidateQueries({ queryKey: ["scores", teamId] });
    },
    onSettled: () => {
      // WS will deliver the real update but this is a safety net
      setTimeout(() => {
        if (leaderboardKey) {
          queryClient.invalidateQueries({ queryKey: leaderboardKey });
        }
        queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      }, 2000);
    }
  });
}
