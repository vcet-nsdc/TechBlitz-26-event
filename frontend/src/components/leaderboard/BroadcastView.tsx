"use client";

import { ConnectionStatus } from "@/components/shared/ConnectionStatus";
import { DomainBadge } from "@/components/shared/DomainBadge";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useSocket } from "@/hooks/useSocket";
import { Domain } from "@/types/entities";
import { LeaderboardTable } from "./LeaderboardTable";

export function BroadcastView({
  mode,
  domain
}: {
  mode: { type: "lab"; labId: string } | { type: "domain"; domain: string } | { type: "finals" };
  domain?: Domain;
}) {
  const { data = [] } = useLeaderboard(mode);
  const { isConnected, isReconnecting } = useSocket("/broadcast");

  return (
    <div className="min-h-screen bg-black px-6 py-8 text-zinc-100">
      <div className="mb-6 flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tight">Live Leaderboard</h1>
          {domain ? <DomainBadge domain={domain} /> : null}
        </div>
        <ConnectionStatus isConnected={isConnected} isReconnecting={isReconnecting} />
      </div>
      <div className="text-2xl">
        <LeaderboardTable entries={data} />
      </div>
    </div>
  );
}
