import { useEffect } from "react";
import {
  installCommerceHumanizedGlobalHandlers,
  isCommerceHumanizedErrorsEnabled,
} from "commerce-humanized-errors";

import { useGrossisteAFeatureFlags } from "../hooks/useGrossisteAFeatureFlags";

export function GrossisteAHumanizedErrorsBridge() {
  const { flags, hydrated } = useGrossisteAFeatureFlags();

  useEffect(() => {
    if (!hydrated || !isCommerceHumanizedErrorsEnabled(flags)) return;
    return installCommerceHumanizedGlobalHandlers({
      locale: "fr-CI",
      module: "web-grossiste-a",
    });
  }, [flags, hydrated]);

  return null;
}
