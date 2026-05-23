/**
 * Instruction 15A — minimal WebSocket subscribe authorization foundation.
 * Open subscribe when: NODE_ENV !== "production" OR DEV_AUTH_BYPASS OR no VENEXT_WS_SUBSCRIBE_SECRET.
 * Strict when: production + secret set + not bypassing — requires matching auth.token.
 */

export type SubscribeMessage = {
  type?: string;
  poles?: string[];
  organizationId?: string;
  auth?: { organizationId?: string; token?: string };
};

export function isRealtimeSubscribeAuthStrict(): boolean {
  const bypass =
    process.env.DEV_AUTH_BYPASS === "true" ||
    process.env.DEV_AUTH_BYPASS === "1" ||
    process.env.NODE_ENV !== "production";
  if (bypass) return false;
  return Boolean(process.env.VENEXT_WS_SUBSCRIBE_SECRET?.trim());
}

export function validateRealtimeSubscribeAuth(
  msg: SubscribeMessage,
): { ok: true; organizationId?: string } | { ok: false; reason: string } {
  if (!isRealtimeSubscribeAuthStrict()) {
    return { ok: true, organizationId: msg.auth?.organizationId ?? msg.organizationId };
  }
  const org = msg.auth?.organizationId?.trim();
  const token = msg.auth?.token?.trim();
  const secret = process.env.VENEXT_WS_SUBSCRIBE_SECRET?.trim();
  if (!org || !token || !secret || token !== secret) {
    return { ok: false, reason: "subscribe_auth_invalid" };
  }
  return { ok: true, organizationId: org };
}
