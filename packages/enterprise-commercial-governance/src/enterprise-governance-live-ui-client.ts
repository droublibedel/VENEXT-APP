import type {
  EnterpriseCollaboratorOnboarding,
  EnterpriseCommercialChannel,
  EnterpriseGovernanceHistoryEntry,
  EnterprisePoleActivation,
  EnterpriseSecureInvitation,
  EnterpriseSecurityAlert,
  EnterpriseTrustedDevice,
} from "./enterprise-governance.types";
import {
  assertEnterpriseGovernanceRouteIsLive,
  resolveEnterpriseGovernanceApiRoute,
} from "./enterprise-governance-api-contract.js";
import {
  memoryFallbackAllGovernanceHistory,
  memoryFallbackChannelDetail,
  memoryFallbackChannels,
  memoryFallbackCollaborators,
  memoryFallbackGovernanceHistory,
  memoryFallbackInvitations,
  memoryFallbackPoleActivations,
  memoryFallbackSecurityAlerts,
  memoryFallbackTrustedDevices,
} from "./enterprise-governance-memory-fallback-adapter.js";
import type { EnterpriseGovernanceDataSource } from "./enterprise-governance-ui.persistence-mode.js";
import { shouldForceEnterpriseGovernanceMemoryFallback } from "./enterprise-governance-ui.persistence-mode.js";

export type EnterpriseGovernancePanelEnvelope<T> = {
  data: T;
  dataSource: EnterpriseGovernanceDataSource;
  fallbackUsed: boolean;
  lastSyncAt: string;
  error?: string;
};

type CoreMeta = {
  dataSource?: EnterpriseGovernanceDataSource;
  fallbackUsed?: boolean;
  persistenceMode?: string;
  payload?: unknown;
};

function env(key: string): string | undefined {
  const g = globalThis as { process?: { env?: Record<string, string | undefined> } };
  return g.process?.env?.[key];
}

function coreBaseUrl(): string {
  const raw = env("NEXT_PUBLIC_CORE_DOMAIN_URL") || env("CORE_DOMAIN_URL") || "http://127.0.0.1:3200/v1";
  return String(raw).replace(/\/$/, "");
}

async function fetchLiveJson<T>(path: string): Promise<{ ok: true; body: CoreMeta & { payload: T } } | { ok: false; error: string }> {
  const url = `${coreBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(12_000) });
    if (!res.ok) return { ok: false, error: `http_${res.status}` };
    const body = (await res.json()) as CoreMeta & { payload: T };
    return { ok: true, body };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "fetch_failed" };
  }
}

function envelope<T>(
  data: T,
  dataSource: EnterpriseGovernanceDataSource,
  fallbackUsed: boolean,
  error?: string,
): EnterpriseGovernancePanelEnvelope<T> {
  return {
    data,
    dataSource,
    fallbackUsed,
    lastSyncAt: new Date().toISOString(),
    error,
  };
}

function mapLiveMeta(body: CoreMeta, fallbackUsed: boolean): Pick<EnterpriseGovernancePanelEnvelope<unknown>, "dataSource" | "fallbackUsed"> {
  const ds = (body.dataSource ?? (fallbackUsed ? "FALLBACK" : "LIVE")) as EnterpriseGovernanceDataSource;
  return { dataSource: ds, fallbackUsed: Boolean(body.fallbackUsed ?? fallbackUsed) };
}

async function withLiveOrMemory<T>(
  livePath: string,
  memoryFn: () => T,
): Promise<EnterpriseGovernancePanelEnvelope<T>> {
  if (shouldForceEnterpriseGovernanceMemoryFallback()) {
    return envelope(memoryFn(), "FALLBACK", true);
  }
  const live = await fetchLiveJson<T>(livePath);
  if (live.ok) {
    const meta = mapLiveMeta(live.body, false);
    return {
      data: live.body.payload as T,
      ...meta,
      lastSyncAt: new Date().toISOString(),
    };
  }
  return envelope(memoryFn(), "HYBRID", true, live.error);
}

export async function fetchEnterpriseChannelsForPanel(): Promise<
  EnterpriseGovernancePanelEnvelope<EnterpriseCommercialChannel[]>
> {
  assertEnterpriseGovernanceRouteIsLive("channels_list");
  return withLiveOrMemory(resolveEnterpriseGovernanceApiRoute("channels_list"), memoryFallbackChannels);
}

export async function fetchEnterpriseChannelDetailForPanel(
  enterpriseId: string,
): Promise<EnterpriseGovernancePanelEnvelope<EnterpriseCommercialChannel | null>> {
  assertEnterpriseGovernanceRouteIsLive("channel_detail");
  if (shouldForceEnterpriseGovernanceMemoryFallback()) {
    return envelope(memoryFallbackChannelDetail(enterpriseId) ?? null, "FALLBACK", true);
  }
  const live = await fetchLiveJson<EnterpriseCommercialChannel>(
    resolveEnterpriseGovernanceApiRoute("channel_detail", { enterpriseId }),
  );
  if (live.ok) {
    const meta = mapLiveMeta(live.body, false);
    return { data: live.body.payload, ...meta, lastSyncAt: new Date().toISOString() };
  }
  return envelope(memoryFallbackChannelDetail(enterpriseId) ?? null, "HYBRID", true, live.error);
}

export async function fetchEnterprisePoleActivationsForPanel(
  enterpriseId: string,
): Promise<EnterpriseGovernancePanelEnvelope<EnterprisePoleActivation[]>> {
  assertEnterpriseGovernanceRouteIsLive("channel_poles");
  return withLiveOrMemory(
    resolveEnterpriseGovernanceApiRoute("channel_poles", { enterpriseId }),
    () => memoryFallbackPoleActivations(enterpriseId),
  );
}

export async function fetchEnterpriseInvitationsForPanel(
  enterpriseId: string,
): Promise<EnterpriseGovernancePanelEnvelope<EnterpriseSecureInvitation[]>> {
  assertEnterpriseGovernanceRouteIsLive("channel_invitations");
  return withLiveOrMemory(
    resolveEnterpriseGovernanceApiRoute("channel_invitations", { enterpriseId }),
    () => memoryFallbackInvitations(enterpriseId),
  );
}

export async function fetchEnterpriseCollaboratorsForPanel(
  enterpriseId: string,
): Promise<EnterpriseGovernancePanelEnvelope<EnterpriseCollaboratorOnboarding[]>> {
  assertEnterpriseGovernanceRouteIsLive("channel_collaborators");
  return withLiveOrMemory(
    resolveEnterpriseGovernanceApiRoute("channel_collaborators", { enterpriseId }),
    () => memoryFallbackCollaborators(enterpriseId),
  );
}

export async function fetchEnterpriseSecurityAlertsForPanel(
  enterpriseId: string,
): Promise<EnterpriseGovernancePanelEnvelope<EnterpriseSecurityAlert[]>> {
  assertEnterpriseGovernanceRouteIsLive("channel_security_alerts");
  return withLiveOrMemory(
    resolveEnterpriseGovernanceApiRoute("channel_security_alerts", { enterpriseId }),
    () => memoryFallbackSecurityAlerts(enterpriseId),
  );
}

export async function fetchEnterpriseGovernanceHistoryForPanel(
  enterpriseId: string,
): Promise<EnterpriseGovernancePanelEnvelope<EnterpriseGovernanceHistoryEntry[]>> {
  assertEnterpriseGovernanceRouteIsLive("channel_timeline");
  return withLiveOrMemory(
    resolveEnterpriseGovernanceApiRoute("channel_timeline", { enterpriseId }),
    () => memoryFallbackGovernanceHistory(enterpriseId),
  );
}

export async function fetchEnterpriseGovernanceHistoryGlobalForPanel(): Promise<
  EnterpriseGovernancePanelEnvelope<EnterpriseGovernanceHistoryEntry[]>
> {
  return envelope(memoryFallbackAllGovernanceHistory(), "FALLBACK", true);
}

export async function fetchEnterpriseTrustedDevicesForPanel(
  enterpriseId: string,
): Promise<EnterpriseGovernancePanelEnvelope<EnterpriseTrustedDevice[]>> {
  return envelope(memoryFallbackTrustedDevices(enterpriseId), "FALLBACK", true);
}

export function canRunSensitiveGovernancePanelAction(meta: {
  dataSource: EnterpriseGovernanceDataSource;
  fallbackUsed: boolean;
}): boolean {
  return meta.dataSource === "LIVE" && !meta.fallbackUsed;
}

export function sensitiveActionUnavailableMessage(): string {
  return "Action disponible uniquement avec la persistance active.";
}
