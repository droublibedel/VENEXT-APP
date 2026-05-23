import {
  assertEnterpriseGovernanceRouteIsLive,
  resolveEnterpriseGovernanceApiRoute,
  warnEnterpriseGovernanceLegacyRoute,
} from "./enterprise-governance-api-contract.js";
import type { EnterpriseGovernancePanelEnvelope } from "./enterprise-governance-live-ui-client.js";
import { canRunSensitiveGovernancePanelAction } from "./enterprise-governance-live-ui-client.js";
import { shouldForceEnterpriseGovernanceMemoryFallback } from "./enterprise-governance-ui.persistence-mode.js";

function env(key: string): string | undefined {
  const g = globalThis as { process?: { env?: Record<string, string | undefined> } };
  return g.process?.env?.[key];
}

function coreBaseUrl(): string {
  const raw = env("NEXT_PUBLIC_CORE_DOMAIN_URL") || env("CORE_DOMAIN_URL") || "http://127.0.0.1:3200/v1";
  return String(raw).replace(/\/$/, "");
}

export type PanelActionResult = {
  ok: boolean;
  requiresLive: boolean;
  message?: string;
};

export async function patchEnterpriseChannelStatusFromPanel(
  enterpriseId: string,
  action: "archive" | "reactivate",
  note: string,
  meta: Pick<EnterpriseGovernancePanelEnvelope<unknown>, "dataSource" | "fallbackUsed">,
): Promise<PanelActionResult> {
  if (!canRunSensitiveGovernancePanelAction(meta) || shouldForceEnterpriseGovernanceMemoryFallback()) {
    return { ok: false, requiresLive: true, message: "Action disponible uniquement avec la persistance active." };
  }
  assertEnterpriseGovernanceRouteIsLive("channel_status_patch");
  const path = resolveEnterpriseGovernanceApiRoute("channel_status_patch", { enterpriseId });
  try {
    const res = await fetch(`${coreBaseUrl()}${path}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, note }),
      signal: AbortSignal.timeout(12_000),
    });
    return { ok: res.ok, requiresLive: false, message: res.ok ? undefined : `http_${res.status}` };
  } catch (e) {
    return { ok: false, requiresLive: false, message: e instanceof Error ? e.message : "action_failed" };
  }
}

export function warnIfLegacySecurityActionUsed(): void {
  warnEnterpriseGovernanceLegacyRoute("legacy_security_actions");
}
