import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();
  const role = session?.user.role;
  if (role === "participant") {
    redirect("/dashboard");
  }
  if (role === "admin") {
    redirect("/admin");
  }
  if (role === "judge") {
    redirect("/judge");
  }
  redirect("/login");
}
