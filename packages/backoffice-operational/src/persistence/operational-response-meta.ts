import type { BackofficeLightweightEnvelope } from "./backoffice-lightweight-envelope.js";
import {
  resolveOperationalPersistenceMode,
  type OperationalPersistenceMode,
} from "./operational-persistence-mode.js";
import { resolveBackofficePersistenceMode } from "./persistence-mode.js";

export type BackofficeOperationalResponseMeta = {
  persistenceMode: OperationalPersistenceMode;
  legacyPersistenceMode: ReturnType<typeof resolveBackofficePersistenceMode>;
  dataSource: "LIVE" | "FALLBACK" | "MIXED";
  fallbackUsed: boolean;
  criticalDegraded: boolean;
  warning?: string;
};

export function backofficeOperationalResponseMeta(
  usedFallback = false,
): BackofficeOperationalResponseMeta {
  const resolution = resolveOperationalPersistenceMode();
  const legacy = resolveBackofficePersistenceMode();
  const fallbackUsed =
    usedFallback || resolution.mode === "FALLBACK_DEV_ONLY" || resolution.criticalDegraded;
  const dataSource: BackofficeOperationalResponseMeta["dataSource"] =
    fallbackUsed ? "FALLBACK" : resolution.mode === "HYBRID_DEBUG" && usedFallback ? "MIXED" : "LIVE";

  return {
    persistenceMode: resolution.mode,
    legacyPersistenceMode: legacy,
    dataSource,
    fallbackUsed,
    criticalDegraded: resolution.criticalDegraded,
    warning: resolution.warning,
  };
}

export function attachOperationalMeta<T extends Record<string, unknown>>(
  body: T,
  usedFallback = false,
): T & BackofficeOperationalResponseMeta {
  return { ...body, ...backofficeOperationalResponseMeta(usedFallback) };
}

export function envelopeWithOperationalMeta<T>(
  envelope: BackofficeLightweightEnvelope<T>,
  usedFallback = false,
): BackofficeLightweightEnvelope<T> {
  const meta = backofficeOperationalResponseMeta(usedFallback);
  return {
    ...envelope,
    dataSource: meta.dataSource,
    fallbackUsed: meta.fallbackUsed,
    persistenceMode: meta.persistenceMode,
  };
}
