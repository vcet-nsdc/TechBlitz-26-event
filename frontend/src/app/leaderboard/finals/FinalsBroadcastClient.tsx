"use client";

import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import { TopThreePodium } from "@/components/leaderboard/TopThreePodium";
import { ConnectionStatus } from "@/components/shared/ConnectionStatus";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useSocket } from "@/hooks/useSocket";
import { Domain } from "@/types/entities";

export function FinalsBroadcastClient({ domain }: { domain: Domain | null }) {
  const { data = [] } = useLeaderboard({ type: "finals" });
  const { isConnected, isReconnecting } = useSocket("/broadcast");
  const filtered = domain ? data.filter((entry) => entry.domain === domain) : data;

  return (
    <div className="min-h-screen bg-black px-6 py-8 text-zinc-100">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-4xl font-black">{domain ? `${domain} Finals` : "Finals Leaderboard"}</h1>
        <ConnectionStatus isConnected={isConnected} isReconnecting={isReconnecting} />
      </div>
      <div className="space-y-6">
        <TopThreePodium entries={filtered} />
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Ranks 4–5</CardTitle>
          </CardHeader>
          <CardContent>
            <LeaderboardTable entries={filtered.slice(3, 5)} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
