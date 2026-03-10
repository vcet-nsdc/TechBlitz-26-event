import { ScoringForm } from "@/components/judge/ScoringForm";
import { SubmissionPreview } from "@/components/judge/SubmissionPreview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { getCriteriaFor } from "@/lib/constants";
import { Score, Team } from "@/types/entities";
import { redirect } from "next/navigation";

export default async function TeamScoringPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const session = await auth();
  if (!session?.user.backendToken) {
    redirect("/login");
  }
  const team = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/teams/${teamId}`, {
    headers: { Authorization: `Bearer ${session.user.backendToken}` },
    cache: "no-store"
  }).then((r) => r.json() as Promise<Team>);

  const scores = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/scores/team/${teamId}`, {
    headers: { Authorization: `Bearer ${session.user.backendToken}` },
    cache: "no-store"
  }).then((r) => r.json() as Promise<Score[]>);

  const criteria = getCriteriaFor(team.domain, false);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{team.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <SubmissionPreview submission={team.submission} />
        </CardContent>
      </Card>
      <ScoringForm teamId={team.id} labId={team.labId} round="LAB_ROUND" criteria={criteria} existingScores={scores} />
    </div>
  );
}
