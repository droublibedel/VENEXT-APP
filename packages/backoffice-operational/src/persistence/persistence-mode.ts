import {
  resolveOperationalPersistenceMode,
  type OperationalPersistenceMode,
} from "./operational-persistence-mode.js";

export type BackofficePersistenceMode = "LIVE" | "FALLBACK" | "HYBRID";

function readRuntimeEnv(): Record<string, string | undefined> {
  return typeof process === "undefined" ? {} : process.env;
}

export function isBackofficeLivePersistenceFlagEnabled(): boolean {
  const resolution = resolveOperationalPersistenceMode();
  if (resolution.mode === "FALLBACK_DEV_ONLY") return false;
  return true;
}

export function isBackofficeLiveGovernanceFlagEnabled(): boolean {
  const env = readRuntimeEnv();
  const raw = env.backoffice_live_governance_enabled ?? env.BACKOFFICE_LIVE_GOVERNANCE_ENABLED;
  if (raw === "false") return false;
  if (raw === "true") return true;
  return env.NODE_ENV === "production" || isBackofficeLivePersistenceFlagEnabled();
}

export function hasDatabaseUrl(): boolean {
  return Boolean(readRuntimeEnv().DATABASE_URL?.trim());
}

function mapOperationalToLegacy(mode: OperationalPersistenceMode): BackofficePersistenceMode {
  if (mode === "FALLBACK_DEV_ONLY") return "FALLBACK";
  if (mode === "HYBRID_DEBUG") return "HYBRID";
  return "LIVE";
}

/** Compatibilité — délègue à resolveOperationalPersistenceMode (BACKOFFICE-01-E). */
export function resolveBackofficePersistenceMode(): BackofficePersistenceMode {
  return mapOperationalToLegacy(resolveOperationalPersistenceMode().mode);
}
