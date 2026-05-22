"use client";

import { Suspense, type ReactNode } from "react";
import { NotificationProvider } from "@/components/providers/notification-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <NotificationProvider>{children}</NotificationProvider>
    </Suspense>
  );
}
