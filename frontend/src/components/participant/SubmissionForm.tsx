"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { Domain, SubmissionStatus, SubmissionType } from "@/types/entities";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  url: z.string().url()
});

function detectType(url: string): SubmissionType | null {
  if (url.includes("figma.com")) {
    return "FIGMA_LINK";
  }
  if (url.includes("github.com")) {
    return "GITHUB_LINK";
  }
  return null;
}

export function SubmissionForm({ domain }: { domain: Domain }) {
  const { toast } = useToast();
  const [status, setStatus] = useState<SubmissionStatus | null>(null);
  const [detectedType, setDetectedType] = useState<SubmissionType | null>(null);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { url: "" }
  });

  const requiredType = domain === "UIUX" ? "FIGMA_LINK" : "GITHUB_LINK";

  const onSubmit = form.handleSubmit(async ({ url }) => {
    const type = detectType(url);
    if (!type) {
      toast({ title: "Invalid URL", description: "Use a Figma or GitHub URL.", variant: "error" });
      return;
    }
    if (type !== requiredType) {
      toast({
        title: "Wrong submission type",
        description: `This domain requires ${requiredType === "FIGMA_LINK" ? "Figma" : "GitHub"} links.`,
        variant: "error"
      });
      return;
    }
    await api.post("/submissions", { url, type });
    setStatus("VALIDATING");
    toast({ title: "Submitted", description: "Submission is being validated." });

    const poll = setInterval(async () => {
      const latest = await api.get<{ status: SubmissionStatus } | null>("/submissions/my");
      if (!latest) {
        return;
      }
      setStatus(latest.status);
      if (latest.status === "VALID" || latest.status === "INVALID") {
        clearInterval(poll);
      }
    }, 3000);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Project Link</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-3" onSubmit={onSubmit}>
          <Input
            placeholder="https://..."
            {...form.register("url")}
            onChange={(event) => {
              form.setValue("url", event.target.value);
              setDetectedType(detectType(event.target.value));
            }}
          />
          <div className="flex gap-2 text-xs">
            <Badge>Required: {requiredType === "FIGMA_LINK" ? "Figma" : "GitHub"}</Badge>
            {detectedType ? <Badge>Detected: {detectedType === "FIGMA_LINK" ? "Figma" : "GitHub"}</Badge> : null}
            {status ? <Badge>{status}</Badge> : null}
          </div>
          <Button className="w-full" type="submit">
            Submit
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
