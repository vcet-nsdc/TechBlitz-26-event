"use client";

import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLeaderboard } from "@/hooks/useLeaderboard";

export default function LabLeaderboardPanel({ params }: { params: { labId: string } }) {
  const { data = [] } = useLeaderboard({ type: "lab", labId: params.labId });
  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Lab Leaderboard</CardTitle>
      </CardHeader>
      <CardContent>
        <LeaderboardTable entries={data} />
      </CardContent>
    </Card>
  );
}
