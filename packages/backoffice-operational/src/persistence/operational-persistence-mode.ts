import { hasDatabaseUrl } from "./persistence-mode.js";

export type OperationalPersistenceMode = "LIVE" | "FALLBACK_DEV_ONLY" | "HYBRID_DEBUG";

export type OperationalPersistenceResolution = {
  mode: OperationalPersistenceMode;
  isProduction: boolean;
  databaseConfigured: boolean;
  criticalDegraded: boolean;
  warning?: string;
};

function readRuntimeEnv(): Record<string, string | undefined> {
  return typeof process === "undefined" ? {} : process.env;
}

/** Stratégie stricte BACKOFFICE-01-E — LIVE = source officielle en production. */
export function resolveOperationalPersistenceMode(): OperationalPersistenceResolution {
  const env = readRuntimeEnv();
  const isProduction = env.NODE_ENV === "production";
  const databaseConfigured = hasDatabaseUrl();
  const forcedFallback =
    env.BACKOFFICE_PERSISTENCE_MODE === "FALLBACK_DEV_ONLY" ||
    env.BACKOFFICE_PERSISTENCE_MODE === "FALLBACK" ||
    env.BACKOFFICE_FORCE_FALLBACK === "true";
  const hybridDebug =
    env.BACKOFFICE_PERSISTENCE_MODE === "HYBRID_DEBUG" ||
    env.BACKOFFICE_PERSISTENCE_MODE === "HYBRID";

  if (forcedFallback) {
    return {
      mode: "FALLBACK_DEV_ONLY",
      isProduction,
      databaseConfigured,
      criticalDegraded: isProduction,
      warning: isProduction ? "PRODUCTION en FALLBACK_DEV_ONLY explicite" : undefined,
    };
  }

  if (!databaseConfigured) {
    return {
      mode: "FALLBACK_DEV_ONLY",
      isProduction,
      databaseConfigured: false,
      criticalDegraded: isProduction,
      warning: isProduction
        ? "CRITICAL: PRODUCTION sans DATABASE_URL — mode dégradé mémoire"
        : "DATABASE_URL absente — FALLBACK_DEV_ONLY",
    };
  }

  if (hybridDebug) {
    return {
      mode: "HYBRID_DEBUG",
      isProduction,
      databaseConfigured: true,
      criticalDegraded: false,
    };
  }

  return {
    mode: "LIVE",
    isProduction,
    databaseConfigured: true,
    criticalDegraded: false,
  };
}

export function isOperationalLiveMode(): boolean {
  return resolveOperationalPersistenceMode().mode === "LIVE";
}

export function operationalPersistenceWarning(): string | undefined {
  return resolveOperationalPersistenceMode().warning;
}
