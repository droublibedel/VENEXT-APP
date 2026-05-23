"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useBackofficeAuth } from "./BackofficeAuthProvider";

export function BackofficeSessionGuard({ children }: { children: ReactNode }) {
  const { token, loading } = useBackofficeAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !token) router.replace("/pilotage/login");
  }, [loading, token, router]);

  if (loading || !token) return null;
  return <>{children}</>;
}
