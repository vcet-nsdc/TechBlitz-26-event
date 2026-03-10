"use client";

import { ConnectionStatus } from "@/components/shared/ConnectionStatus";
import { useSocket } from "@/hooks/useSocket";
import Link from "next/link";

export default function JudgeLayout({ children }: { children: React.ReactNode }) {
  const { isConnected, isReconnecting } = useSocket("/judges");
  return (
    <div className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex gap-3 text-sm">
          <Link href="/judge">Labs</Link>
          <Link href="/judge/finals">Finals</Link>
        </div>
        <ConnectionStatus isConnected={isConnected} isReconnecting={isReconnecting} />
      </header>
      {children}
    </div>
  );
}
