import { useEffect } from "react";
import { commerceFoundationCssVariables, isCommerceUxHarmonyEnabled } from "commerce-ux-harmony";

import { useGrossisteFeatureFlags } from "../hooks/useGrossisteFeatureFlags";

/** Applies shared commerce UX tokens when harmony flag is on (Instruction 20.84). */
export function GrossisteBUxHarmonyBridge() {
  const { flags, hydrated } = useGrossisteFeatureFlags();

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
