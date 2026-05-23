import type { LightweightEnvelope } from "./commerce-performance.types";

const HEAVY_KEYS = new Set([
  "stack",
  "stackTrace",
  "debug",
  "rawPayload",
  "internalMetadata",
  "auditTrail",
]);

export function trimPayload<T extends Record<string, unknown>>(
  payload: T,
  maxArrayItems = 50,
): T {
  const out = { ...payload } as Record<string, unknown>;
  for (const key of Object.keys(out)) {
    if (HEAVY_KEYS.has(key)) {
      delete out[key];
      continue;
    }
    const val = out[key];
    if (Array.isArray(val) && val.length > maxArrayItems) {
      out[key] = val.slice(0, maxArrayItems);
      out[`${key}Truncated`] = true;
    }
  }
  return out as T;
}

export function lightweightEnvelope<T>(
  payload: T,
  dataSource: LightweightEnvelope<T>["dataSource"] = "live",
  opts?: { fallbackUsed?: boolean; maxItems?: number },
): LightweightEnvelope<T> {
  let shaped = payload;
  let trimmed = false;
  if (Array.isArray(payload) && opts?.maxItems) {
    if (payload.length > opts.maxItems) {
      shaped = payload.slice(0, opts.maxItems) as T;
      trimmed = true;
    }
  } else if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    shaped = trimPayload(payload as Record<string, unknown>, opts?.maxItems ?? 50) as T;
    trimmed = shaped !== payload;
  }
  return {
    dataSource,
    fallbackUsed: opts?.fallbackUsed ?? dataSource !== "live",
    payload: shaped,
    trimmed: trimmed || undefined,
    itemCount: Array.isArray(shaped) ? shaped.length : undefined,
  };
}
