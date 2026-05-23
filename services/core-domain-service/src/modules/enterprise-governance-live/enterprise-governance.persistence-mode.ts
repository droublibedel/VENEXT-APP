export type EnterpriseGovernancePersistenceMode = "LIVE" | "FALLBACK" | "HYBRID";

export function isEnterpriseGovernanceLiveFlagEnabled(): boolean {
  const raw =
    process.env.backoffice_live_governance_enabled ?? process.env.BACKOFFICE_LIVE_GOVERNANCE_ENABLED;
  if (raw === "false") return false;
  if (raw === "true") return true;
  return process.env.NODE_ENV !== "production";
}

export function hasEnterpriseGovernanceDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function resolveEnterpriseGovernancePersistenceMode(): EnterpriseGovernancePersistenceMode {
  if (!isEnterpriseGovernanceLiveFlagEnabled() || !hasEnterpriseGovernanceDatabase()) {
    return "FALLBACK";
  }
  if (process.env.ENTERPRISE_GOVERNANCE_PERSISTENCE_MODE === "HYBRID") {
    return "HYBRID";
  }
  return "LIVE";
}
