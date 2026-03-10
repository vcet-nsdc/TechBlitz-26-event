import { Badge } from "@/components/ui/badge";
import { DOMAIN_COLORS, DOMAIN_LABELS } from "@/lib/constants";
import { Domain } from "@/types/entities";

export function DomainBadge({ domain }: { domain: Domain }) {
  return <Badge className={DOMAIN_COLORS[domain]}>{DOMAIN_LABELS[domain]}</Badge>;
}
