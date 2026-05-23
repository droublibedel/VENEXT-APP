"use client";

import { useEffect } from "react";
import { commerceFoundationCssVariables, isCommerceUxHarmonyEnabled } from "commerce-ux-harmony";

import { useGrossisteAFeatureFlags } from "../hooks/useGrossisteAFeatureFlags";

export function GrossisteAUxHarmonyBridge() {
  const { flags, hydrated } = useGrossisteAFeatureFlags();

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
