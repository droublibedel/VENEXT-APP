import {
  fetchEnterpriseGovernanceLiveSnapshot,
  type EnterpriseGovernanceLiveSnapshot,
} from "./enterprise-governance-live-client.js";
import { resolveEnterpriseGovernancePersistenceMode } from "./enterprise-governance.persistence-mode.js";

export type EnterpriseGovernanceResponseMeta = {
  dataSource: "LIVE" | "FALLBACK" | "HYBRID";
  persistenceMode: "LIVE" | "FALLBACK" | "HYBRID";
  fallbackUsed: boolean;
  lastSyncAt?: string;
};

export function governanceResponseMeta(
  snapshot: Pick<
    EnterpriseGovernanceLiveSnapshot,
    "dataSource" | "persistenceMode" | "fallbackUsed" | "lastSyncAt"
  >,
): EnterpriseGovernanceResponseMeta {
  return {
    dataSource: snapshot.dataSource,
    persistenceMode: snapshot.persistenceMode,
    fallbackUsed: snapshot.fallbackUsed,
    lastSyncAt: snapshot.lastSyncAt,
  };
}

export async function loadEnterpriseGovernanceContext(): Promise<EnterpriseGovernanceLiveSnapshot> {
  return fetchEnterpriseGovernanceLiveSnapshot();
}

export function defaultGovernanceMeta(): EnterpriseGovernanceResponseMeta {
  const mode = resolveEnterpriseGovernancePersistenceMode();
  return {
    dataSource: mode,
    persistenceMode: mode,
    fallbackUsed: mode === "FALLBACK",
  };
}
