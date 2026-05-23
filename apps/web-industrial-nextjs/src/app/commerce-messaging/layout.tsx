"use client";

import { IndustrialCommerceErrorBoundary } from "commerce-humanized-errors";

export default function CommerceMessagingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <IndustrialCommerceErrorBoundary locale="fr-CI" module="commerce-messaging">
      {children}
    </IndustrialCommerceErrorBoundary>
  );
}
