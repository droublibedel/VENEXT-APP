import type { CommercePerformanceFlags } from "./commerce-performance.types";

const COHERENT_GROUPS: { label: string; keys: (keyof CommercePerformanceFlags)[] }[] = [
  {
    label: "notifications",
    keys: ["commerce_notifications_enabled", "venext_bff_routes_enabled"],
  },
  {
    label: "offline",
    keys: ["commerce_offline_foundation_enabled", "venext_bff_routes_enabled"],
  },
  {
    label: "activity",
    keys: ["commercial_activity_feed_enabled", "venext_bff_routes_enabled"],
  },
  {
    label: "routing",
    keys: ["commercial_context_routing_enabled", "commerce_access_control_enabled"],
  },
  {
    label: "auth-i18n",
    keys: ["venext_auth_foundation_enabled", "venext_i18n_enabled"],
  },
];

export type FeatureFlagAuditIssue = {
  group: string;
  message: string;
};

export function auditFeatureFlagConsistency(
  flags: CommercePerformanceFlags,
): { ok: boolean; issues: FeatureFlagAuditIssue[] } {
  const issues: FeatureFlagAuditIssue[] = [];

  if (flags.commerce_performance_foundation_enabled === false) {
    return { ok: true, issues };
  }

  for (const group of COHERENT_GROUPS) {
    const enabled = group.keys.filter((k) => flags[k] !== false);
    const disabled = group.keys.filter((k) => flags[k] === false);
    if (enabled.length > 0 && disabled.length > 0) {
      issues.push({
        group: group.label,
        message: `Flags partiellement désactivés: ${disabled.join(", ")}`,
      });
    }
  }

  if (
    flags.commerce_notifications_enabled !== false &&
    flags.venext_bff_routes_enabled === false
  ) {
    issues.push({
      group: "notifications",
      message: "Notifications sans BFF — fallback local uniquement (OK si voulu).",
    });
  }

  return { ok: issues.length === 0, issues };
}

export function isCommercePerformanceEnabled(flags: CommercePerformanceFlags = {}): boolean {
  return flags.commerce_performance_foundation_enabled !== false;
}

export function isCommerceSecureCleanupEnabled(flags: CommercePerformanceFlags = {}): boolean {
  return (
    isCommercePerformanceEnabled(flags) && flags.commerce_secure_cleanup_enabled !== false
  );
}

export function isCommerceLightVirtualizationEnabled(
  flags: CommercePerformanceFlags = {},
): boolean {
  return (
    isCommercePerformanceEnabled(flags) &&
    flags.commerce_light_virtualization_enabled !== false
  );
}

export function isCommerceSecureWalletNavigationEnabled(
  flags: CommercePerformanceFlags = {},
): boolean {
  return (
    isCommercePerformanceEnabled(flags) &&
    flags.commerce_secure_wallet_navigation_enabled !== false
  );
}
