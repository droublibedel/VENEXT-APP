"use client";

import { useEffect } from "react";
import { commerceFoundationCssVariables, isCommerceUxHarmonyEnabled } from "commerce-ux-harmony";

import { useIndustrialFeatureFlags } from "@/poles/hooks/useIndustrialFeatureFlags";

export function IndustrialUxHarmonyBridge() {
  const { flags, hydrated } = useIndustrialFeatureFlags();

  useEffect(() => {
    if (!hydrated || !isCommerceUxHarmonyEnabled(flags)) return;
    const vars = commerceFoundationCssVariables("web");
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
