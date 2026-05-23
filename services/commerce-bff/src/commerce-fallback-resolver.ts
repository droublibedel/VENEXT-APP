/** Instruction 20.79-A — intelligent fallback modes (no websocket, no ERP). */

export type CommerceFallbackMode = "LIVE" | "FALLBACK" | "HYBRID";

export type PersistenceAvailability = "available" | "degraded" | "unavailable";

export function resolvePersistenceAvailability(): PersistenceAvailability {
  if (process.env.VENEXT_BACKEND_PERSISTENCE === "false") return "unavailable";
  if (process.env.VENEXT_BACKEND_PERSISTENCE === "true") return "available";
  if (process.env.NODE_ENV === "production") return "degraded";
  return "available";
}

export function resolveCommerceFallbackMode(input: {
  bffRoutesEnabled: boolean;
  coreReachable: boolean;
  persistence?: PersistenceAvailability;
}): CommerceFallbackMode {
  const persistence = input.persistence ?? resolvePersistenceAvailability();
  if (!input.bffRoutesEnabled || persistence === "unavailable") return "FALLBACK";
  if (input.coreReachable && persistence === "available") return "LIVE";
  if (input.coreReachable) return "HYBRID";
  return "FALLBACK";
}

export function envelopeForMode<T>(
  mode: CommerceFallbackMode,
  livePayload: T | null,
  fallbackPayload: T,
): {
  dataSource: "live" | "fallback" | "mixed";
  fallbackUsed: boolean;
  devBadge?: boolean;
  payload: T;
} {
  if (mode === "LIVE" && livePayload !== null) {
    return { dataSource: "live", fallbackUsed: false, payload: livePayload };
  }
  if (mode === "HYBRID" && livePayload !== null) {
    return { dataSource: "mixed", fallbackUsed: true, devBadge: true, payload: livePayload };
  }
  return {
    dataSource: "fallback",
    fallbackUsed: true,
    devBadge: process.env.NODE_ENV !== "production",
    payload: fallbackPayload,
  };
}
