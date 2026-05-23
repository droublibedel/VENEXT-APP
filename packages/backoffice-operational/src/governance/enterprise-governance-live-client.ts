import {
  listEnterpriseChannels as listMemoryChannels,
  listPoleActivations as listMemoryPoles,
} from "enterprise-commercial-governance/storage";
import { listAllGovernanceHistory as listMemoryHistory } from "enterprise-commercial-governance/history";
import { listSecurityAlerts as listMemoryAlerts } from "enterprise-commercial-governance/security-alerts";

import {
  resolveEnterpriseGovernancePersistenceMode,
  type EnterpriseGovernancePersistenceMode,
} from "./enterprise-governance.persistence-mode.js";

export type LiveChannelRow = {
  enterpriseId: string;
  companyName: string;
  contractReference: string;
  governanceStatus: string;
  activationStatus: string;
  actorKind?: string;
};

export type EnterpriseGovernanceLiveSnapshot = {
  dataSource: EnterpriseGovernancePersistenceMode;
  persistenceMode: EnterpriseGovernancePersistenceMode;
  fallbackUsed: boolean;
  channels: LiveChannelRow[];
  history: Array<{
    enterpriseId: string;
    action: string;
    author: string;
    note: string;
    previousState: string;
    newState: string;
    createdAt?: string;
  }>;
  polesByEnterprise: Map<string, string[]>;
  alertsByEnterprise: Map<string, Array<{ alertType: string; message: string; acknowledged: boolean }>>;
  lastSyncAt: string;
};

type CoreEnvelope<T> = {
  dataSource?: EnterpriseGovernancePersistenceMode;
  persistenceMode?: EnterpriseGovernancePersistenceMode;
  fallbackUsed?: boolean;
  payload: T;
};

const CORE_BASE = process.env.CORE_DOMAIN_URL ?? "http://127.0.0.1:3200/v1";

async function fetchCoreJson<T>(path: string): Promise<CoreEnvelope<T> | null> {
  const url = `${CORE_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;
    return (await res.json()) as CoreEnvelope<T>;
  } catch {
    return null;
  }
}

function memorySnapshot(): EnterpriseGovernanceLiveSnapshot {
  const channels = listMemoryChannels().map((ch) => ({
    enterpriseId: ch.enterpriseId,
    companyName: ch.companyName,
    contractReference: ch.contractReference,
    governanceStatus: ch.governanceStatus,
    activationStatus: ch.activationStatus,
    actorKind: ch.actorKind,
  }));
  const polesByEnterprise = new Map<string, string[]>();
  const alertsByEnterprise = new Map<
    string,
    Array<{ alertType: string; message: string; acknowledged: boolean }>
  >();
  for (const ch of channels) {
    polesByEnterprise.set(
      ch.enterpriseId,
      listMemoryPoles(ch.enterpriseId).map((p) => p.poleId),
    );
    alertsByEnterprise.set(
      ch.enterpriseId,
      listMemoryAlerts(ch.enterpriseId).map((a: { alertType: string; message: string; acknowledged?: boolean }) => ({
        alertType: a.alertType,
        message: a.message,
        acknowledged: Boolean(a.acknowledged),
      })),
    );
  }
  return {
    dataSource: "FALLBACK",
    persistenceMode: "FALLBACK",
    fallbackUsed: true,
    channels,
    history: listMemoryHistory().map((h) => ({
      enterpriseId: h.enterpriseId,
      action: h.action,
      author: h.author,
      note: h.note,
      previousState: h.previousState,
      newState: h.newState,
      createdAt: h.createdAt,
    })),
    polesByEnterprise,
    alertsByEnterprise,
    lastSyncAt: new Date().toISOString(),
  };
}

/** Lit la gouvernance grands comptes : core/Prisma LIVE d'abord, mémoire DEV en secours. */
export async function fetchEnterpriseGovernanceLiveSnapshot(): Promise<EnterpriseGovernanceLiveSnapshot> {
  const mode = resolveEnterpriseGovernancePersistenceMode();
  if (mode === "FALLBACK") {
    return memorySnapshot();
  }

  const channelsEnv = await fetchCoreJson<LiveChannelRow[]>("/commerce-foundation/enterprise/channels");
  if (!channelsEnv?.payload?.length) {
    if (mode === "HYBRID") {
      const mem = memorySnapshot();
      return { ...mem, dataSource: "HYBRID", persistenceMode: mode, fallbackUsed: true };
    }
    return memorySnapshot();
  }

  const channels = channelsEnv.payload;
  const polesByEnterprise = new Map<string, string[]>();
  const alertsByEnterprise = new Map<
    string,
    Array<{ alertType: string; message: string; acknowledged: boolean }>
  >();
  const history: EnterpriseGovernanceLiveSnapshot["history"] = [];

  for (const ch of channels) {
    const polesEnv = await fetchCoreJson<Array<{ poleId: string }>>(
      `/commerce-foundation/enterprise/channels/${ch.enterpriseId}/poles`,
    );
    polesByEnterprise.set(
      ch.enterpriseId,
      (polesEnv?.payload ?? []).map((p) => p.poleId),
    );

    const alertsEnv = await fetchCoreJson<
      Array<{ alertType: string; message: string; acknowledged: boolean }>
    >(`/commerce-foundation/enterprise/channels/${ch.enterpriseId}/security-alerts`);
    alertsByEnterprise.set(ch.enterpriseId, alertsEnv?.payload ?? []);

    const timelineEnv = await fetchCoreJson<
      Array<{
        action: string;
        author: string;
        note: string;
        previousState: string;
        newState: string;
        createdAt: string;
      }>
    >(`/commerce-foundation/enterprise/channels/${ch.enterpriseId}/timeline`);
    for (const row of timelineEnv?.payload ?? []) {
      history.push({
        enterpriseId: ch.enterpriseId,
        action: row.action,
        author: row.author,
        note: row.note,
        previousState: row.previousState,
        newState: row.newState,
        createdAt: row.createdAt,
      });
    }
  }

  const dataSource = channelsEnv.dataSource ?? mode;
  const fallbackUsed = Boolean(channelsEnv.fallbackUsed) || mode === "HYBRID";

  return {
    dataSource,
    persistenceMode: channelsEnv.persistenceMode ?? mode,
    fallbackUsed,
    channels,
    history,
    polesByEnterprise,
    alertsByEnterprise,
    lastSyncAt: new Date().toISOString(),
  };
}
