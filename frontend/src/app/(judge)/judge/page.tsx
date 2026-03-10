import { DomainBadge } from "@/components/shared/DomainBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { Team } from "@/types/entities";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function JudgeHomePage() {
  const session = await auth();
  if (!session?.user.backendToken || !session.user.domain) {
    redirect("/login");
  }

  const teams = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/teams`, {
    headers: { Authorization: `Bearer ${session.user.backendToken}` },
    cache: "no-store"
  }).then((r) => r.json() as Promise<Team[]>);

  const labGroups = Object.values(
    teams.reduce<Record<string, { id: string; name: string; teams: Team[] }>>((acc, team) => {
      const id = team.labId;
      if (!acc[id]) {
        acc[id] = { id, name: team.lab?.name ?? `Lab ${id.slice(0, 4)}`, teams: [] };
      }
      acc[id].teams.push(team);
      return acc;
    }, {})
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">
        Judge Dashboard <DomainBadge domain={session.user.domain} />
      </h1>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {labGroups.map((lab) => (
          <Link key={lab.id} href={`/judge/lab/${lab.id}`}>
            <Card className="hover:border-indigo-400">
              <CardHeader>
                <CardTitle>{lab.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-zinc-300">
                <div>Teams: {lab.teams.length}</div>
                <div>Scored: {lab.teams.filter((t) => (t.scores?.length ?? 0) > 0).length}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
