import { Domain } from "@/types/entities";
import { FinalsBroadcastClient } from "./FinalsBroadcastClient";

export default async function FinalsBroadcastPage({
  searchParams
}: {
  searchParams: Promise<{ domain?: Domain }>;
}) {
  const { domain } = await searchParams;
  return <FinalsBroadcastClient domain={domain ?? null} />;
}
