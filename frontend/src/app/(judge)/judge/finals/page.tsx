import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import { ScoringForm } from "@/components/judge/ScoringForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { getCriteriaFor } from "@/lib/constants";
import { LeaderboardEntry, Score, Team } from "@/types/entities";
import { redirect } from "next/navigation";

export default async function FinalsPage() {
  const session = await auth();
  if (!session?.user.backendToken || !session.user.domain) {
    redirect("/login");
  }

  const [teams, leaderboard] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/teams`, {
      headers: { Authorization: `Bearer ${session.user.backendToken}` },
      cache: "no-store"
    }).then((r) => r.json() as Promise<Team[]>),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/leaderboard/finals`, {
      headers: { Authorization: `Bearer ${session.user.backendToken}` },
      cache: "no-store"
    }).then((r) => r.json() as Promise<LeaderboardEntry[]>)
  ]);

  const domainFinalists = teams.filter((team) => team.domain === session.user.domain && team.inFinals);
  if (!domainFinalists.length) {
    return <div className="text-zinc-300">No finalists promoted for {session.user.domain} yet.</div>;
  }

  const targetTeam = domainFinalists[0];
  const existingScores = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/scores/team/${targetTeam.id}`, {
    headers: { Authorization: `Bearer ${session.user.backendToken}` },
    cache: "no-store"
  }).then((r) => r.json() as Promise<Score[]>);
  const criteria = getCriteriaFor(session.user.domain, true);

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
      <ScoringForm teamId={targetTeam.id} labId={targetTeam.labId} round="FINALS" criteria={criteria} existingScores={existingScores} />
      <Card>
        <CardHeader>
          <CardTitle>Finals Standings</CardTitle>
        </CardHeader>
        <CardContent>
          <LeaderboardTable entries={leaderboard.filter((row) => row.domain === session.user.domain)} />
        </CardContent>
      </Card>
    </div>
  );
}
