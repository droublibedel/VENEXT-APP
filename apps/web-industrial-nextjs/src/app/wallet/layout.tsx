"use client";

import { IndustrialCommerceErrorBoundary } from "commerce-humanized-errors";

export default function WalletLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <IndustrialCommerceErrorBoundary locale="fr-CI" module="wallet">
      {children}
    </IndustrialCommerceErrorBoundary>
  );
}
