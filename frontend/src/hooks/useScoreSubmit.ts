"use client";

import { api } from "@/lib/api";
import { useSocket } from "@/hooks/useSocket";
import { Score } from "@/types/entities";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type ScorePayload = {
  teamId: string;
  round: string;
  criteria: { criteriaId: string; value: number }[];
};

export function useScoreSubmit(teamId: string) {
  const queryClient = useQueryClient();
  const { socket } = useSocket("/judges");

  return useMutation({
    mutationFn: (payload: ScorePayload) => api.post<{ accepted: true }>("/scores", payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ["scores", teamId] });
      const previous = queryClient.getQueryData<Score[]>(["scores", teamId]);
      const optimistic: Score[] = payload.criteria.map((c, idx) => ({
        id: `optimistic-${idx}`,
        teamId: payload.teamId,
        judgeId: "self",
        criteriaId: c.criteriaId,
        round: payload.round,
        value: c.value,
        criteria: { id: c.criteriaId, name: "Criterion", maxScore: 10, domain: "UIUX", isFinal: false },
        submittedAt: new Date().toISOString()
      }));
      queryClient.setQueryData(["scores", teamId], optimistic);
      return { previous };
    },
    onError: (_, __, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["scores", teamId], context.previous);
      }
    },
    onSuccess: () => {
      socket?.emit("score:accepted", { teamId });
      queryClient.invalidateQueries({ queryKey: ["scores", teamId] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    }
  });
}
