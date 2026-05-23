import {
  RelationalFulfillmentActionResponseSchema,
  type RelationalFulfillmentActionResponseDto,
  type RelationalFulfillmentIncidentTypeDto,
  type RelationalFulfillmentProofTypeDto,
  type RelationalFulfillmentStatusDto,
} from "@venext/shared-contracts";

const BFF_PREFIX = "/api/relational-fulfillment";

export type FulfillmentActionResult =
  | { ok: true; data: RelationalFulfillmentActionResponseDto }
  | { ok: false; code: "relational_fulfillment_action_response_invalid" }
  | { ok: false; code: "http_error" };

async function postAction(
  organizationId: string,
  recordId: string,
  path: string,
  body: Record<string, unknown>,
): Promise<FulfillmentActionResult> {
  const qs = new URLSearchParams({ organizationId });
  const url = `${BFF_PREFIX}/v1/relational-fulfillment/${encodeURIComponent(recordId)}/${path}?${qs.toString()}`;
  try {
    const r = await fetch(url, {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) return { ok: false, code: "http_error" };
    const json: unknown = await r.json();
    const parsed = RelationalFulfillmentActionResponseSchema.safeParse(json);
    if (!parsed.success) return { ok: false, code: "relational_fulfillment_action_response_invalid" };
    return { ok: true, data: parsed.data };
  } catch {
    return { ok: false, code: "http_error" };
  }
}

export function nextGenericFulfillmentStatus(
  current: RelationalFulfillmentStatusDto,
): RelationalFulfillmentStatusDto | null {
  const linear: Partial<Record<RelationalFulfillmentStatusDto, RelationalFulfillmentStatusDto>> = {
    PREPARING_FULFILLMENT: "READY_FOR_LOADING",
    READY_FOR_LOADING: "LOADING_CONFIRMED",
    LOADING_CONFIRMED: "IN_TRANSFER",
    IN_TRANSFER: "ARRIVED_AT_DESTINATION",
    ARRIVED_AT_DESTINATION: "RECEPTION_PENDING_VALIDATION",
  };
  return linear[current] ?? null;
}

export async function postFulfillmentTransition(
  organizationId: string,
  recordId: string,
  targetStatus: RelationalFulfillmentStatusDto,
): Promise<FulfillmentActionResult> {
  return postAction(organizationId, recordId, "transitions", { targetStatus });
}

export async function postFulfillmentProof(
  organizationId: string,
  recordId: string,
  proofType: RelationalFulfillmentProofTypeDto,
  fileUrl: string,
): Promise<FulfillmentActionResult> {
  return postAction(organizationId, recordId, "proofs", { proofType, fileUrl });
}

export async function postFulfillmentValidateReception(
  organizationId: string,
  recordId: string,
  notes?: string,
): Promise<FulfillmentActionResult> {
  return postAction(organizationId, recordId, "validate-reception", notes ? { notes } : {});
}

export async function postFulfillmentIncident(
  organizationId: string,
  recordId: string,
  incidentType: RelationalFulfillmentIncidentTypeDto,
  description: string,
): Promise<FulfillmentActionResult> {
  return postAction(organizationId, recordId, "report-incident", { incidentType, description, severity: "MEDIUM" });
}

async function postIncidentEndpoint(
  organizationId: string,
  incidentId: string,
  path: string,
  body: Record<string, unknown> = {},
): Promise<FulfillmentActionResult> {
  const qs = new URLSearchParams({ organizationId });
  const url = `${BFF_PREFIX}/v1/relational-fulfillment/incidents/${encodeURIComponent(incidentId)}/${path}?${qs.toString()}`;
  try {
    const r = await fetch(url, {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) return { ok: false, code: "http_error" };
    const json: unknown = await r.json();
    const parsed = RelationalFulfillmentActionResponseSchema.safeParse(json);
    if (!parsed.success) return { ok: false, code: "relational_fulfillment_action_response_invalid" };
    return { ok: true, data: parsed.data };
  } catch {
    return { ok: false, code: "http_error" };
  }
}

export async function postRejectReception(
  organizationId: string,
  recordId: string,
  reason: string,
): Promise<FulfillmentActionResult> {
  return postAction(organizationId, recordId, "reject-reception", { reason, incidentType: "QUANTITY_MISMATCH" });
}

export async function postPartialReception(
  organizationId: string,
  recordId: string,
  notes: string,
): Promise<FulfillmentActionResult> {
  return postAction(organizationId, recordId, "validate-partial-reception", {
    notes,
    incidentType: "PARTIAL_RECEPTION",
  });
}

export async function postProposeIncidentResolution(
  organizationId: string,
  incidentId: string,
  resolutionProposal: string,
  resolutionNotes?: string,
): Promise<FulfillmentActionResult> {
  return postIncidentEndpoint(organizationId, incidentId, "propose-resolution", {
    resolutionProposal,
    ...(resolutionNotes ? { resolutionNotes } : {}),
  });
}

export async function postAcceptResolutionBuyer(
  organizationId: string,
  incidentId: string,
): Promise<FulfillmentActionResult> {
  return postIncidentEndpoint(organizationId, incidentId, "accept-resolution-buyer");
}

export async function postAcceptResolutionSeller(
  organizationId: string,
  incidentId: string,
): Promise<FulfillmentActionResult> {
  return postIncidentEndpoint(organizationId, incidentId, "accept-resolution-seller");
}
