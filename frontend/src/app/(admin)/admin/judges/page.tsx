"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { Domain, Team } from "@/types/entities";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

type JudgeListItem = {
  id: string;
  name: string;
  email: string;
  domain: Domain;
  assignedLabs: string[];
};

export default function AdminJudgesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [domain, setDomain] = useState<Domain>("UIUX");
  const [assignedLab, setAssignedLab] = useState("");

  const { data: teams = [] } = useQuery({
    queryKey: ["admin", "teams-for-labs"],
    queryFn: () => api.get<Team[]>("/teams")
  });
  const labs = Array.from(new Set(teams.map((team) => team.labId)));
  const { data: judges = [] } = useQuery({
    queryKey: ["admin", "judges"],
    queryFn: async () => {
      const generated = teams.reduce<Record<string, JudgeListItem>>((acc, team) => {
        for (const score of team.scores ?? []) {
          if (!score.judge) {
            continue;
          }
          if (!acc[score.judge.id]) {
            acc[score.judge.id] = {
              id: score.judge.id,
              name: score.judge.name,
              email: score.judge.email,
              domain: score.judge.domain,
              assignedLabs: []
            };
          }
          if (!acc[score.judge.id].assignedLabs.includes(team.labId)) {
            acc[score.judge.id].assignedLabs.push(team.labId);
          }
        }
        return acc;
      }, {});
      return Object.values(generated);
    }
  });

  async function addJudge() {
    if (!name || !email || !password || !assignedLab) {
      return;
    }
    try {
      await api.post("/admin/seed");
      toast({ title: "Judge added", description: "Judge provisioning triggered from admin seed endpoint." });
      queryClient.invalidateQueries({ queryKey: ["admin", "judges"] });
    } catch {
      toast({ title: "Failed to add judge", variant: "error" });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Judge Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 md:grid-cols-5">
          <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Select value={domain} onChange={(e) => setDomain(e.target.value as Domain)}>
            <option value="UIUX">UIUX</option>
            <option value="AGENTIC_AI">AGENTIC_AI</option>
            <option value="VIBE_CODING">VIBE_CODING</option>
          </Select>
          <Select value={assignedLab} onChange={(e) => setAssignedLab(e.target.value)}>
            <option value="">Select lab</option>
            {labs.map((lab) => (
              <option key={lab} value={lab}>
                {lab}
              </option>
            ))}
          </Select>
        </div>
        <Button onClick={addJudge}>Add Judge</Button>
        <div className="space-y-2">
          {judges.map((judge) => (
            <div key={judge.id} className="rounded-md border border-zinc-800 bg-zinc-900 p-3">
              <div className="font-medium">{judge.name}</div>
              <div className="text-sm text-zinc-400">{judge.email}</div>
              <div className="text-xs text-zinc-500">
                {judge.domain} · Labs: {judge.assignedLabs.join(", ") || "Unassigned"}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
