import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PHASE_LABELS } from "@/lib/constants";
import { Team } from "@/types/entities";

export default async function AdminOverviewPage() {
  const teams = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/teams`, { cache: "no-store" }).then((r) => r.json() as Promise<Team[]>);
  const submissionCount = teams.filter((team) => team.submission).length;
  const scoredCount = teams.filter((team) => (team.scores?.length ?? 0) > 0).length;
  const phase = "REGISTRATION";

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle>Total Teams</CardTitle>
        </CardHeader>
        <CardContent>{teams.length}</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Submissions</CardTitle>
        </CardHeader>
        <CardContent>{submissionCount}</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Scored Teams</CardTitle>
        </CardHeader>
        <CardContent>{scoredCount}</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Current Phase</CardTitle>
        </CardHeader>
        <CardContent>{PHASE_LABELS[phase]}</CardContent>
      </Card>
    </div>
  );
}
