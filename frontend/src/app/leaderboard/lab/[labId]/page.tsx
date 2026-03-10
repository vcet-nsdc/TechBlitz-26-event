import { BroadcastView } from "@/components/leaderboard/BroadcastView";
import { Domain } from "@/types/entities";

export default async function LabLeaderboardBroadcast({
  params,
  searchParams
}: {
  params: Promise<{ labId: string }>;
  searchParams: Promise<{ domain?: Domain }>;
}) {
  const { labId } = await params;
  const { domain } = await searchParams;
  return <BroadcastView mode={{ type: "lab", labId }} domain={domain} />;
}
