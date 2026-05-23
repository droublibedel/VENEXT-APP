import { useEffect } from "react";
import { commerceFoundationCssVariables, isCommerceUxHarmonyEnabled } from "commerce-ux-harmony";

import { useDetaillantFeatureFlags } from "../hooks/useDetaillantFeatureFlags";

export function DetaillantUxHarmonyBridge() {
  const { flags, hydrated } = useDetaillantFeatureFlags();

  useEffect(() => {
    if (!hydrated || !isCommerceUxHarmonyEnabled(flags)) return;
    const vars = commerceFoundationCssVariables("mobile");
    const root = document.documentElement;
    for (const [key, value] of Object.entries(vars)) {
      root.style.setProperty(key, value);
    }
    return () => {
      for (const key of Object.keys(vars)) {
        root.style.removeProperty(key);
      }
    };
  }, [flags, hydrated]);

  return null;
}
