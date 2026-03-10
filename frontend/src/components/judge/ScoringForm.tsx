"use client";

import { CriteriaSlider } from "@/components/judge/CriteriaSlider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useScoreSubmit } from "@/hooks/useScoreSubmit";
import { Score, ScoreCriteria } from "@/types/entities";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  values: z.record(z.string(), z.number().min(0))
});

type FormShape = z.infer<typeof schema>;

export function ScoringForm({
  teamId,
  labId,
  round,
  criteria,
  existingScores
}: {
  teamId: string;
  labId: string;
  round: string;
  criteria: ScoreCriteria[];
  existingScores: Score[];
}) {
  const defaults = useMemo(
    () =>
      criteria.reduce<Record<string, number>>((acc, c) => {
        const existing = existingScores.find((s) => s.criteriaId === c.id);
        acc[c.id] = existing?.value ?? 0;
        return acc;
      }, {}),
    [criteria, existingScores]
  );
  const { toast } = useToast();
  const router = useRouter();
  const mutation = useScoreSubmit(teamId);

  const form = useForm<FormShape>({
    resolver: zodResolver(schema),
    values: { values: defaults }
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await mutation.mutateAsync({
        teamId,
        round,
        criteria: criteria.map((c) => ({
          criteriaId: c.id,
          value: Number(values.values[c.id] ?? 0)
        }))
      });
      toast({ title: "Scores saved", description: "Team score submitted successfully." });
      router.push(`/judge/lab/${labId}`);
    } catch {
      toast({ title: "Submission failed", description: "Could not save scores.", variant: "error" });
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scoring Form</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-3">
          {criteria.map((criterion) => (
            <CriteriaSlider
              key={criterion.id}
              label={criterion.name}
              max={criterion.maxScore}
              value={Number(form.watch(`values.${criterion.id}`) ?? 0)}
              onChange={(next) => form.setValue(`values.${criterion.id}`, next)}
            />
          ))}
          <Button type="submit" disabled={mutation.isPending} className="w-full">
            {mutation.isPending ? "Saving..." : "Submit Score"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
