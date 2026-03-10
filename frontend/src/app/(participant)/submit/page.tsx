import { SubmissionForm } from "@/components/participant/SubmissionForm";
import { auth } from "@/lib/auth";
import { Domain } from "@/types/entities";
import { redirect } from "next/navigation";

export default async function SubmitPage() {
  const session = await auth();
  if (!session?.user.backendToken) {
    redirect("/login");
  }
  const participant = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/participants/me`, {
    headers: { Authorization: `Bearer ${session.user.backendToken}` },
    cache: "no-store"
  }).then((r) => r.json());

  return <SubmissionForm domain={participant.team.domain as Domain} />;
}
