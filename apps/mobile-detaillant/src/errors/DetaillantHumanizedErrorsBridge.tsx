import { useEffect } from "react";
import {
  installCommerceHumanizedGlobalHandlers,
  isCommerceHumanizedErrorsEnabled,
} from "commerce-humanized-errors";

import { useDetaillantFeatureFlags } from "../hooks/useDetaillantFeatureFlags";

export function DetaillantHumanizedErrorsBridge() {
  const { flags, hydrated } = useDetaillantFeatureFlags();

  useEffect(() => {
    if (!hydrated || !isCommerceHumanizedErrorsEnabled(flags)) return;
    return installCommerceHumanizedGlobalHandlers({
      locale: "fr-CI",
      module: "mobile-detaillant",
    });
  }, [flags, hydrated]);

  return null;
}
