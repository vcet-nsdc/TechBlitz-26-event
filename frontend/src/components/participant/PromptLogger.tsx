"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { TOOL_OPTIONS } from "@/lib/constants";
import { PromptLog } from "@/types/entities";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export function PromptLogger() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [promptText, setPromptText] = useState("");
  const [toolUsed, setToolUsed] = useState<string>("GPT-4");
  const { data = [] } = useQuery({
    queryKey: ["prompts", "my"],
    queryFn: () => api.get<PromptLog[]>("/prompts/my")
  });

  const mutation = useMutation({
    mutationFn: () => api.post<PromptLog>("/prompts", { promptText, toolUsed }),
    onSuccess: () => {
      setPromptText("");
      queryClient.invalidateQueries({ queryKey: ["prompts", "my"] });
      toast({ title: "Prompt logged", description: "Your prompt has been saved." });
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Prompt Log</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea value={promptText} onChange={(e) => setPromptText(e.target.value)} placeholder="Enter prompt used during hackathon..." />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
            <Select value={toolUsed} onChange={(e) => setToolUsed(e.target.value)}>
              {TOOL_OPTIONS.map((tool) => (
                <option key={tool}>{tool}</option>
              ))}
            </Select>
            <Button disabled={!promptText.trim() || mutation.isPending} onClick={() => mutation.mutate()}>
              {mutation.isPending ? "Saving..." : "Add Prompt"}
            </Button>
          </div>
        </div>
        <div className="max-h-96 space-y-2 overflow-y-auto">
          {data.map((item) => (
            <div key={item.id} className="rounded-md border border-zinc-800 bg-zinc-900 p-3">
              <div className="mb-2 flex items-center justify-between">
                <Badge>{item.toolUsed ?? "Unknown"}</Badge>
                <span className="text-xs text-zinc-500">{new Date(item.loggedAt).toLocaleString()}</span>
              </div>
              <p className="text-sm text-zinc-100">{item.promptText}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
