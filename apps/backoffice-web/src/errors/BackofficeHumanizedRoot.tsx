"use client";

import { useEffect, type ReactNode } from "react";
import {
  GlobalCommerceErrorBoundary,
  installCommerceHumanizedGlobalHandlers,
} from "commerce-humanized-errors";

import { BackofficeLiveObservabilityBridge } from "../observability/BackofficeLiveObservabilityBridge";

export function BackofficeHumanizedRoot({ children }: { children: ReactNode }) {
  useEffect(() => {
    return installCommerceHumanizedGlobalHandlers({
      locale: "fr-CI",
      module: "backoffice-web",
    });
  }, []);

  return (
    <GlobalCommerceErrorBoundary locale="fr-CI" module="backoffice-web">
      <BackofficeLiveObservabilityBridge />
      {children}
    </GlobalCommerceErrorBoundary>
  );
}
