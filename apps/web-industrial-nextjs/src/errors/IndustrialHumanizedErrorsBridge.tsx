import { useEffect } from "react";
import {
  installCommerceHumanizedGlobalHandlers,
  isCommerceHumanizedErrorsEnabled,
} from "commerce-humanized-errors";

import { useIndustrialFeatureFlags } from "../poles/hooks/useIndustrialFeatureFlags";

export function IndustrialHumanizedErrorsBridge() {
  const { flags, hydrated } = useIndustrialFeatureFlags();

  useEffect(() => {
    if (!hydrated || !isCommerceHumanizedErrorsEnabled(flags)) return;
    return installCommerceHumanizedGlobalHandlers({
      locale: "fr-CI",
      module: "web-industrial-nextjs",
    });
  }, [flags, hydrated]);

  return null;
}
