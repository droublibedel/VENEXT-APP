import type { BackofficeFeatureFlagState } from "../types/platform.types.js";

export type FeatureFlagAuditIssue = {
  key: string;
  rule: string;
  severity: "warning" | "critical";
};

const PROD_DANGEROUS = new Set([
  "venext_live_data_fallback_enabled",
  "DEV_AUTH_BYPASS",
]);

export function auditFeatureFlagExposure(flags: BackofficeFeatureFlagState[]): {
  ok: boolean;
  issues: FeatureFlagAuditIssue[];
} {
  const issues: FeatureFlagAuditIssue[] = [];
  const byKey = new Map(flags.map((f) => [f.key, f]));

  for (const f of flags) {
    if (f.environment === "production" && f.enabled && PROD_DANGEROUS.has(f.key)) {
      issues.push({ key: f.key, rule: "flag_prod_dangereux", severity: "critical" });
    }
    if (f.key.startsWith("backoffice_") && f.enabled && f.environment === "production") {
      const livePersist = byKey.get("backoffice_live_persistence_enabled");
      if (f.key.includes("observability") && !livePersist?.enabled) {
        issues.push({ key: f.key, rule: "flag_incoherent_sans_persistence", severity: "warning" });
      }
    }
  }

  const auth = byKey.get("backoffice_auth_enabled");
  const persist = byKey.get("backoffice_live_persistence_enabled");
  if (auth?.enabled && !persist?.enabled && persist?.environment === "production") {
    issues.push({
      key: "backoffice_auth_enabled",
      rule: "auth_sans_persistence_prod",
      severity: "warning",
    });
  }

  return { ok: issues.length === 0, issues };
}
