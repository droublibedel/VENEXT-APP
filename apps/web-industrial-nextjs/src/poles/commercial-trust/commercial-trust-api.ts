import {
  CommercialTrustProfileResponseSchema,
  CommercialTrustRelationshipResponseSchema,
  type CommercialTrustProfileResponseDto,
  type CommercialTrustRelationshipResponseDto,
} from "@venext/shared-contracts";

const CORE_PREFIX = "/api/core/v1";

export type CommercialTrustFetchFailureCode =
  | "network"
  | "http"
  | "forbidden"
  | "not_found"
  | "commercial_trust_response_invalid";

export type CommercialTrustProfileResult =
  | { ok: true; data: CommercialTrustProfileResponseDto }
  | { ok: false; code: CommercialTrustFetchFailureCode };

export type CommercialTrustRelationshipResult =
  | { ok: true; data: CommercialTrustRelationshipResponseDto }
  | { ok: false; code: CommercialTrustFetchFailureCode };

/** Instruction 20.3A — Zod runtime validation at the web boundary. */
export async function fetchCommercialTrustProfile(organizationId: string): Promise<CommercialTrustProfileResult> {
  const url = `${CORE_PREFIX}/commercial-trust/profile/${encodeURIComponent(organizationId)}`;
  try {
    const r = await fetch(url, { credentials: "include", cache: "no-store" });
    if (r.status === 403) return { ok: false, code: "forbidden" };
    if (r.status === 404) return { ok: false, code: "not_found" };
    if (!r.ok) return { ok: false, code: "http" };
    const raw: unknown = await r.json();
    const parsed = CommercialTrustProfileResponseSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, code: "commercial_trust_response_invalid" };
    return { ok: true, data: parsed.data };
  } catch {
    return { ok: false, code: "network" };
  }
}

export async function fetchCommercialTrustRelationship(
  relationshipId: string,
): Promise<CommercialTrustRelationshipResult> {
  const url = `${CORE_PREFIX}/commercial-trust/relationship/${encodeURIComponent(relationshipId)}`;
  try {
    const r = await fetch(url, { credentials: "include", cache: "no-store" });
    if (r.status === 403) return { ok: false, code: "forbidden" };
    if (r.status === 404) return { ok: false, code: "not_found" };
    if (!r.ok) return { ok: false, code: "http" };
    const raw: unknown = await r.json();
    const parsed = CommercialTrustRelationshipResponseSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, code: "commercial_trust_response_invalid" };
    return { ok: true, data: parsed.data };
  } catch {
    return { ok: false, code: "network" };
  }
}
