import { hasDatabaseUrl } from "./persistence-mode.js";

export type OperationalPersistenceMode = "LIVE" | "FALLBACK_DEV_ONLY" | "HYBRID_DEBUG";

export type OperationalPersistenceResolution = {
  mode: OperationalPersistenceMode;
  isProduction: boolean;
  databaseConfigured: boolean;
  criticalDegraded: boolean;
  warning?: string;
};

/** Stratégie stricte BACKOFFICE-01-E — LIVE = source officielle en production. */
export function resolveOperationalPersistenceMode(): OperationalPersistenceResolution {
  const isProduction = process.env.NODE_ENV === "production";
  const databaseConfigured = hasDatabaseUrl();
  const forcedFallback =
    process.env.BACKOFFICE_PERSISTENCE_MODE === "FALLBACK_DEV_ONLY" ||
    process.env.BACKOFFICE_PERSISTENCE_MODE === "FALLBACK" ||
    process.env.BACKOFFICE_FORCE_FALLBACK === "true";
  const hybridDebug =
    process.env.BACKOFFICE_PERSISTENCE_MODE === "HYBRID_DEBUG" ||
    process.env.BACKOFFICE_PERSISTENCE_MODE === "HYBRID";

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
