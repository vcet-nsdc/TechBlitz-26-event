"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { Domain, EventPhase } from "@/types/entities";
import { useState } from "react";

const phases: EventPhase[] = ["REGISTRATION", "LAB_ROUND", "FINALS", "CLOSED"];
const domains: Domain[] = ["UIUX", "AGENTIC_AI", "VIBE_CODING"];

export default function AdminConfigPage() {
  const { toast } = useToast();
  const [phase, setPhase] = useState<EventPhase>("REGISTRATION");
  const [confirm, setConfirm] = useState<{ open: boolean; action?: () => Promise<void>; title: string }>({
    open: false,
    title: ""
  });

  function ask(title: string, action: () => Promise<void>) {
    setConfirm({ open: true, action, title });
  }

  async function executeConfirm() {
    try {
      await confirm.action?.();
      toast({ title: "Configuration updated" });
    } catch {
      toast({ title: "Action failed", variant: "error" });
    } finally {
      setConfirm({ open: false, title: "" });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Event Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="text-sm text-zinc-400">Current phase: {phase}</div>
          <div className="flex flex-wrap gap-2">
            {phases.map((nextPhase) => (
              <Button
                key={nextPhase}
                variant={phase === nextPhase ? "default" : "outline"}
                onClick={() =>
                  ask(`Advance phase to ${nextPhase}?`, async () => {
                    await api.post("/admin/phase", { phase: nextPhase });
                    setPhase(nextPhase);
                  })
                }
              >
                {nextPhase}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-sm text-zinc-400">Finals promotion</div>
          <div className="flex flex-wrap gap-2">
            {domains.map((domain) => (
              <Button
                key={domain}
                disabled={phase !== "FINALS"}
                onClick={() =>
                  ask(`Promote top teams for ${domain}?`, async () => {
                    await api.post("/admin/finals/promote", { domain });
                  })
                }
              >
                Promote Top 5 · {domain}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-sm text-zinc-400">Round lock</div>
          <div className="flex flex-wrap gap-2">
            {domains.map((domain) => (
              <Button
                key={domain}
                variant="outline"
                onClick={() =>
                  ask(`Lock current round for ${domain}?`, async () => {
                    await api.post("/admin/round/lock", { round: phase, domain });
                  })
                }
              >
                Toggle Lock · {domain}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
      <Dialog
        open={confirm.open}
        onOpenChange={(open) => setConfirm((prev) => ({ ...prev, open }))}
        title="Confirm action"
        description={confirm.title}
      >
        <div className="flex gap-2">
          <Button onClick={executeConfirm}>Confirm</Button>
          <Button variant="outline" onClick={() => setConfirm({ open: false, title: "" })}>
            Cancel
          </Button>
        </div>
      </Dialog>
    </Card>
  );
}
