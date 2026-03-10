import { validateEnv } from "@/lib/validate-env";
import { AppProviders } from "@/components/providers/AppProviders";
import type { Metadata } from "next";
import "./globals.css";

validateEnv();

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME ?? "Hackathon 2025",
  description: "Hackathon management platform — internal event tool",
  robots: "noindex, nofollow"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
