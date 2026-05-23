import {
  isBackofficeLiveGovernanceFlagEnabled,
  hasDatabaseUrl,
} from "../persistence/persistence-mode.js";

export type EnterpriseGovernancePersistenceMode = "LIVE" | "FALLBACK" | "HYBRID";

export function hasEnterpriseGovernanceDatabase(): boolean {
  return hasDatabaseUrl();
}

export function resolveEnterpriseGovernancePersistenceMode(): EnterpriseGovernancePersistenceMode {
  if (!isBackofficeLiveGovernanceFlagEnabled() || !hasEnterpriseGovernanceDatabase()) {
    return "FALLBACK";
  }
  if (process.env.ENTERPRISE_GOVERNANCE_PERSISTENCE_MODE === "HYBRID") {
    return "HYBRID";
  }
  return "LIVE";
}
