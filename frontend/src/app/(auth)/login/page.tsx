"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const [participantEmail, setParticipantEmail] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loadingParticipant, setLoadingParticipant] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();
  const { toast } = useToast();

  useEffect(() => {
    if (!session?.user.role) {
      return;
    }
    if (session.user.role === "participant") {
      router.replace("/dashboard");
      return;
    }
    router.replace("/judge");
  }, [router, session?.user.role]);

  async function onParticipantLogin() {
    try {
      setLoadingParticipant(true);
      await api.post("/auth/participant/magic-link", { email: participantEmail });
      await signIn("email", { email: participantEmail, redirect: false });
      toast({ title: "Magic link requested", description: "Check your email for login link." });
    } catch {
      toast({ title: "Request failed", description: "Could not request magic link.", variant: "error" });
    } finally {
      setLoadingParticipant(false);
    }
  }

  async function onStaffLogin() {
    setLoadingStaff(true);
    const result = await signIn("credentials", {
      email: staffEmail,
      password,
      redirect: false
    });
    setLoadingStaff(false);
    if (result?.ok) {
      const fresh = await fetch("/api/auth/session");
      const sessionData = await fresh.json();
      if (sessionData?.user?.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/judge");
      }
      return;
    }
    toast({ title: "Login failed", description: "Invalid credentials.", variant: "error" });
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Login</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="participant">
          <TabsList>
            <TabsTrigger value="participant">Participant</TabsTrigger>
            <TabsTrigger value="staff">Judge / Admin</TabsTrigger>
          </TabsList>
          <TabsContent value="participant" className="space-y-3">
            <Input placeholder="participant@email.com" value={participantEmail} onChange={(e) => setParticipantEmail(e.target.value)} />
            <Button className="w-full" disabled={loadingParticipant || !participantEmail} onClick={onParticipantLogin}>
              {loadingParticipant ? "Requesting..." : "Request Magic Link"}
            </Button>
          </TabsContent>
          <TabsContent value="staff" className="space-y-3">
            <Input placeholder="judge@email.com" value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} />
            <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <Button className="w-full" disabled={loadingStaff || !staffEmail || !password} onClick={onStaffLogin}>
              {loadingStaff ? "Signing in..." : "Sign In"}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
