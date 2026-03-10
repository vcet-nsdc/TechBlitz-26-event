"use client";

import { DomainBadge } from "@/components/shared/DomainBadge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { api } from "@/lib/api";
import { Domain, Team } from "@/types/entities";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

export default function AdminTeamsPage() {
  const [domain, setDomain] = useState<Domain | "ALL">("ALL");
  const [status, setStatus] = useState<"ALL" | "PENDING" | "VALID" | "INVALID">("ALL");
  const { data = [] } = useQuery({
    queryKey: ["admin", "teams"],
    queryFn: () => api.get<Team[]>("/teams")
  });

  const filtered = useMemo(() => {
    return [...data]
      .filter((team) => (domain === "ALL" ? true : team.domain === domain))
      .filter((team) => (status === "ALL" ? true : team.submission?.status === status))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data, domain, status]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Teams</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <Select value={domain} onChange={(e) => setDomain(e.target.value as Domain | "ALL")}>
            <option value="ALL">All Domains</option>
            <option value="UIUX">UIUX</option>
            <option value="AGENTIC_AI">AGENTIC_AI</option>
            <option value="VIBE_CODING">VIBE_CODING</option>
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value as "ALL" | "PENDING" | "VALID" | "INVALID")}>
            <option value="ALL">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="VALID">VALID</option>
            <option value="INVALID">INVALID</option>
          </Select>
        </div>
        <div className="space-y-2">
          {filtered.map((team) => (
            <div key={team.id} className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2">
              <div className="space-y-1">
                <div className="font-medium">{team.name}</div>
                <DomainBadge domain={team.domain} />
              </div>
              <Badge>{team.submission?.status ?? "PENDING"}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
