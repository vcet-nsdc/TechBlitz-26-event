import { BroadcastView } from "@/components/leaderboard/BroadcastView";
import { Domain } from "@/types/entities";

export default async function DomainLeaderboardBroadcast({ params }: { params: Promise<{ domain: Domain }> }) {
  const { domain } = await params;
  return <BroadcastView mode={{ type: "domain", domain }} domain={domain} />;
}
