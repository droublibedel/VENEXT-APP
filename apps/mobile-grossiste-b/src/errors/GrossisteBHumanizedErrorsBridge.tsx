import { useEffect } from "react";
import {
  installCommerceHumanizedGlobalHandlers,
  isCommerceHumanizedErrorsEnabled,
} from "commerce-humanized-errors";

import { useGrossisteFeatureFlags } from "../hooks/useGrossisteFeatureFlags";

/** Erreurs humanisées globales — Instruction 20.84-A. */
export function GrossisteBHumanizedErrorsBridge() {
  const { flags, hydrated } = useGrossisteFeatureFlags();

  useEffect(() => {
    if (!hydrated || !isCommerceHumanizedErrorsEnabled(flags)) return;
    return installCommerceHumanizedGlobalHandlers({
      locale: "fr-CI",
      module: "mobile-grossiste-b",
    });
  }, [flags, hydrated]);

  return null;
}
