import { auditFeatureFlagConsistency } from "commerce-performance-foundation";

import type { FeatureFlagAuditResult, VenextV1Flags } from "./venext-v1-readiness.types";

/** Core V1 flags expected in production readiness (dev defaults may differ). */
export const VENEXT_V1_PRODUCTION_FLAG_KEYS = [
  "venext_auth_foundation_enabled",
  "venext_i18n_enabled",
  "commerce_foundation_guardrails_enabled",
  "commerce_notifications_enabled",
  "commercial_activity_feed_enabled",
  "commerce_offline_foundation_enabled",
  "commerce_access_control_enabled",
  "commercial_context_routing_enabled",
  "commerce_ux_harmony_enabled",
  "commerce_performance_foundation_enabled",
  "venext_bff_routes_enabled",
] as const;

const TERRAIN_MOBILE_FLAGS = [
  "grossiste_b_mobile_enabled",
  "detaillant_mobile_enabled",
] as const;

const FORMAL_WEB_FLAGS = ["grossiste_a_web_enabled", "industrial_poles_enabled"] as const;

const DEAD_FLAG_HINTS = ["_experimental_", "_deprecated_", "_legacy_"];

export function auditFinalFeatureFlags(
  flags: VenextV1Flags,
  context?: { surface?: "terrain" | "formal" | "all" },
): FeatureFlagAuditResult {
  const issues: FeatureFlagAuditResult["issues"] = [];
  const unusedWarnings: string[] = [];
  const missingProduction: string[] = [];

  const perf = auditFeatureFlagConsistency(flags);
  for (const issue of perf.issues) {
    issues.push({ group: issue.group, message: issue.message });
  }

  for (const key of VENEXT_V1_PRODUCTION_FLAG_KEYS) {
    if (flags[key] === undefined && flags.venext_v1_readiness_enabled !== false) {
      missingProduction.push(key);
    }
  }

  for (const key of Object.keys(flags)) {
    if (DEAD_FLAG_HINTS.some((h) => key.includes(h))) {
      unusedWarnings.push(`Flag potentiellement mort: ${key}`);
    }
  }

  if (context?.surface === "terrain") {
    const anyMobile = TERRAIN_MOBILE_FLAGS.some((k) => flags[k] !== false);
    if (!anyMobile) {
      issues.push({
        group: "mobile",
        message: "Aucune surface mobile terrain activée.",
        keys: [...TERRAIN_MOBILE_FLAGS],
      });
    }
  }

  if (context?.surface === "formal") {
    const anyWeb = FORMAL_WEB_FLAGS.some((k) => flags[k] !== false);
    if (!anyWeb) {
      issues.push({
        group: "web",
        message: "Aucune surface web formelle activée.",
        keys: [...FORMAL_WEB_FLAGS],
      });
    }
  }

  if (flags.commerce_offline_sync_enabled !== false && flags.commerce_offline_foundation_enabled === false) {
    issues.push({
      group: "offline",
      message: "Sync offline sans fondation offline.",
      keys: ["commerce_offline_sync_enabled", "commerce_offline_foundation_enabled"],
    });
  }

  if (
    flags.commercial_activity_timeline_enabled !== false &&
    flags.commercial_activity_feed_enabled === false
  ) {
    issues.push({
      group: "activity",
      message: "Timeline activité sans fil d'activité.",
      keys: ["commercial_activity_timeline_enabled", "commercial_activity_feed_enabled"],
    });
  }

  if (missingProduction.length > 0) {
    unusedWarnings.push(
      `Flags non déclarés dans ce contexte: ${missingProduction.join(", ")}`,
    );
  }

  const ok = issues.length === 0 && perf.ok;

  return { ok, issues, unusedWarnings, missingProduction };
}
