"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { Domain } from "@/types/entities";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [domain, setDomain] = useState<Domain>("UIUX");
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(false);

  async function onRegister() {
    setLoading(true);
    try {
      await api.post("/participants/register", { name, email, domain, teamName });
      router.push("/dashboard");
    } catch {
      toast({ title: "Registration failed", description: "Please try again.", variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Participant Registration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Select value={domain} onChange={(e) => setDomain(e.target.value as Domain)}>
          <option value="UIUX">UIUX</option>
          <option value="AGENTIC_AI">AGENTIC_AI</option>
          <option value="VIBE_CODING">VIBE_CODING</option>
        </Select>
        <Input placeholder="Team name" value={teamName} onChange={(e) => setTeamName(e.target.value)} />
        <Button className="w-full" disabled={loading} onClick={onRegister}>
          {loading ? "Submitting..." : "Register"}
        </Button>
      </CardContent>
    </Card>
  );
}
