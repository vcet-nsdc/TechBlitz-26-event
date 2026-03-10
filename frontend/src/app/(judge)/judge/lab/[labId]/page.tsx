import { LabTeamList } from "@/components/judge/LabTeamList";
import { auth } from "@/lib/auth";
import { Score, Team } from "@/types/entities";
import { redirect } from "next/navigation";

export default async function LabPage({ params }: { params: Promise<{ labId: string }> }) {
  const { labId } = await params;
  const session = await auth();
  if (!session?.user.backendToken) {
    redirect("/login");
  }
  const teams = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/teams`, {
    headers: { Authorization: `Bearer ${session.user.backendToken}` },
    cache: "no-store"
  }).then((r) => r.json() as Promise<Team[]>);

  const labTeams = teams.filter((t) => t.labId === labId);
  const scoreResults = await Promise.all(
    labTeams.map((team) =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/scores/team/${team.id}`, {
        headers: { Authorization: `Bearer ${session.user.backendToken}` },
        cache: "no-store"
      }).then((r) => r.json() as Promise<Score[]>)
    )
  );
  const scoredTeamIds = labTeams.filter((_, idx) => scoreResults[idx].length > 0).map((t) => t.id);

  return <LabTeamList teams={labTeams} scoredTeamIds={scoredTeamIds} />;
}
