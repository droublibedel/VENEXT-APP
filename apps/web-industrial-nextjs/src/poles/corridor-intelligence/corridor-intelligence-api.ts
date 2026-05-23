import { CommercialCorridorProfileSchema, type CommercialCorridorProfileDto } from "@venext/shared-contracts";

const CORE_PREFIX = "/api/core/v1";

export type CorridorIntelligenceFetchFailureCode =
  | "network"
  | "http"
  | "forbidden"
  | "not_found"
  | "corridor_intelligence_response_invalid";

export type CorridorIntelligenceProfileResult =
  | { ok: true; data: CommercialCorridorProfileDto }
  | { ok: false; code: CorridorIntelligenceFetchFailureCode };

/** Instruction 20.4 — Zod runtime validation at the web boundary. */
export async function fetchCorridorIntelligenceProfile(
  relationshipId: string,
): Promise<CorridorIntelligenceProfileResult> {
  const url = `${CORE_PREFIX}/relationship-intelligence/profile/${encodeURIComponent(relationshipId)}`;
  try {
    const r = await fetch(url, { credentials: "include", cache: "no-store" });
    if (r.status === 403) return { ok: false, code: "forbidden" };
    if (r.status === 404) return { ok: false, code: "not_found" };
    if (!r.ok) return { ok: false, code: "http" };
    const raw: unknown = await r.json();
    const parsed = CommercialCorridorProfileSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, code: "corridor_intelligence_response_invalid" };
    return { ok: true, data: parsed.data };
  } catch {
    return { ok: false, code: "network" };
  }
}
