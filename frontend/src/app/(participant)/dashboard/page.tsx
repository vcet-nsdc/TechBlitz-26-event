import { ProgressTracker } from "@/components/participant/ProgressTracker";
import { DomainBadge } from "@/components/shared/DomainBadge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { PromptLog, Team } from "@/types/entities";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SubmissionStatusIsland } from "./SubmissionStatusIsland";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user.backendToken) {
    redirect("/login");
  }

  const headers = { Authorization: `Bearer ${session.user.backendToken}` };
  const participant = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/participants/me`, { headers, cache: "no-store" }).then((r) => r.json());
  const team: Team = participant.team;
  const prompts = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/prompts/my`, { headers, cache: "no-store" }).then((r) => r.json() as Promise<PromptLog[]>);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {team.name}
            <DomainBadge domain={team.domain} />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-zinc-300">
          <div className="space-y-1">
            {team.participants?.map((p) => (
              <div key={p.id}>{p.name}</div>
            ))}
          </div>
          <div className="rounded-md border border-zinc-800 bg-zinc-900 p-3">
            <div className="mb-1 flex items-center gap-2">
              <Badge>Submission</Badge>
              <SubmissionStatusIsland teamId={team.id} initialStatus={team.submission?.status ?? "PENDING"} />
            </div>
            <div>{team.submission?.url ?? "Not submitted"}</div>
          </div>
          <Link href="/prompts" className="text-indigo-300 underline">
            Prompt logs: {prompts.length}
          </Link>
          <ProgressTracker registered submitted={Boolean(team.submission)} scored={Boolean(team.scoreSummary?.LAB_ROUND)} />
        </CardContent>
      </Card>
    </div>
  );
}
