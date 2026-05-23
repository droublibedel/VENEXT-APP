"use client";

import type { ReactNode } from "react";
import { IndustrialCommerceErrorBoundary } from "commerce-humanized-errors";

export function IndustrialHumanizedErrorShell({ children }: { children: ReactNode }) {
  return (
    <IndustrialCommerceErrorBoundary locale="fr-CI" onBack={() => window.history.back()}>
      {children}
    </IndustrialCommerceErrorBoundary>
  );
}
