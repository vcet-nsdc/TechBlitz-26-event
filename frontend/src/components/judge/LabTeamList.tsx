import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Team } from "@/types/entities";
import Link from "next/link";

export function LabTeamList({ teams, scoredTeamIds }: { teams: Team[]; scoredTeamIds: string[] }) {
  return (
    <div className="space-y-3">
      {teams.map((team) => (
        <Link key={team.id} href={`/judge/team/${team.id}`}>
          <Card className="hover:border-indigo-400">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>{team.name}</CardTitle>
              {scoredTeamIds.includes(team.id) ? <Badge variant="success">Scored</Badge> : <Badge>Pending</Badge>}
            </CardHeader>
            <CardContent>
              <div className="text-sm text-zinc-300">{team.submission?.url ?? "No submission link"}</div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
