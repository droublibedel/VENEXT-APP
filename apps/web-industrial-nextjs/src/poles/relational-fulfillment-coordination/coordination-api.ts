import {
  RelationalFulfillmentTaskActionResponseSchema,
  RelationalFulfillmentTaskCreateRequestSchema,
  RelationalFulfillmentTaskListResponseSchema,
  type RelationalFulfillmentTaskActionResponseDto,
  type RelationalFulfillmentTaskListResponseDto,
} from "@venext/shared-contracts";

const BFF_PREFIX = "/api/relational-fulfillment";

export async function fetchFulfillmentTasks(
  organizationId: string,
  recordId: string,
): Promise<{ ok: true; data: RelationalFulfillmentTaskListResponseDto } | { ok: false }> {
  const qs = new URLSearchParams({ organizationId });
  const url = `${BFF_PREFIX}/v1/relational-fulfillment/${encodeURIComponent(recordId)}/tasks?${qs}`;
  try {
    const r = await fetch(url, { credentials: "include", cache: "no-store" });
    if (!r.ok) return { ok: false };
    const json: unknown = await r.json();
    const parsed = RelationalFulfillmentTaskListResponseSchema.safeParse(json);
    if (!parsed.success) return { ok: false };
    return { ok: true, data: parsed.data };
  } catch {
    return { ok: false };
  }
}

export async function postCreateTask(
  organizationId: string,
  recordId: string,
  body: unknown,
): Promise<{ ok: true; data: RelationalFulfillmentTaskActionResponseDto } | { ok: false }> {
  const parsed = RelationalFulfillmentTaskCreateRequestSchema.safeParse(body);
  if (!parsed.success) return { ok: false };
  const qs = new URLSearchParams({ organizationId });
  const url = `${BFF_PREFIX}/v1/relational-fulfillment/${encodeURIComponent(recordId)}/tasks?${qs}`;
  try {
    const r = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    if (!r.ok) return { ok: false };
    const json: unknown = await r.json();
    const out = RelationalFulfillmentTaskActionResponseSchema.safeParse(json);
    if (!out.success) return { ok: false };
    return { ok: true, data: out.data };
  } catch {
    return { ok: false };
  }
}

async function postTaskAction(
  organizationId: string,
  taskId: string,
  path: string,
  body?: Record<string, unknown>,
): Promise<{ ok: true; data: RelationalFulfillmentTaskActionResponseDto } | { ok: false }> {
  const qs = new URLSearchParams({ organizationId });
  const url = `${BFF_PREFIX}/v1/relational-fulfillment/tasks/${encodeURIComponent(taskId)}/${path}?${qs}`;
  try {
    const r = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body ?? {}),
    });
    if (!r.ok) return { ok: false };
    const json: unknown = await r.json();
    const out = RelationalFulfillmentTaskActionResponseSchema.safeParse(json);
    if (!out.success) return { ok: false };
    return { ok: true, data: out.data };
  } catch {
    return { ok: false };
  }
}

export const postStartTask = (org: string, taskId: string) => postTaskAction(org, taskId, "start");
export const postCompleteTask = (org: string, taskId: string) => postTaskAction(org, taskId, "complete");
export const postBlockTask = (org: string, taskId: string) => postTaskAction(org, taskId, "block");
