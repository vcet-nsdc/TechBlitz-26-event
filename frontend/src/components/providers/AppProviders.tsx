"use client";

import { useEventPhase } from "@/hooks/useEventPhase";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { useState } from "react";
import { ToastProvider } from "@/components/ui/toast";

function EventPhaseSync() {
  useEventPhase();
  return null;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <EventPhaseSync />
          {children}
        </ToastProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
