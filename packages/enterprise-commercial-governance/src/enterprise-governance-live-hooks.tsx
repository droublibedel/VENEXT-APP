"use client";

import { useCallback, useEffect, useState } from "react";

import type {
  EnterpriseCollaboratorOnboarding,
  EnterpriseCommercialChannel,
  EnterpriseGovernanceHistoryEntry,
  EnterprisePoleActivation,
  EnterpriseSecureInvitation,
  EnterpriseSecurityAlert,
} from "./enterprise-governance.types";
import type { EnterpriseGovernancePanelEnvelope } from "./enterprise-governance-live-ui-client.js";
import {
  fetchEnterpriseChannelDetailForPanel,
  fetchEnterpriseChannelsForPanel,
  fetchEnterpriseCollaboratorsForPanel,
  fetchEnterpriseGovernanceHistoryForPanel,
  fetchEnterpriseInvitationsForPanel,
  fetchEnterprisePoleActivationsForPanel,
  fetchEnterpriseSecurityAlertsForPanel,
} from "./enterprise-governance-live-ui-client.js";

type HookState<T> = {
  loading: boolean;
  envelope: EnterpriseGovernancePanelEnvelope<T> | null;
  reload: () => void;
};

function usePanelEnvelope<T>(loader: () => Promise<EnterpriseGovernancePanelEnvelope<T>>, deps: unknown[]): HookState<T> {
  const [loading, setLoading] = useState(true);
  const [envelope, setEnvelope] = useState<EnterpriseGovernancePanelEnvelope<T> | null>(null);

  const reload = useCallback(() => {
    setLoading(true);
    void loader()
      .then((row) => setEnvelope(row))
      .catch((e) =>
        setEnvelope({
          data: [] as T,
          dataSource: "FALLBACK",
          fallbackUsed: true,
          lastSyncAt: new Date().toISOString(),
          error: e instanceof Error ? e.message : "load_failed",
        }),
      )
      .finally(() => setLoading(false));
  }, deps);

  useEffect(() => {
    reload();
  }, [reload]);

  return { loading, envelope, reload };
}

export function useEnterpriseGovernanceLiveChannels() {
  return usePanelEnvelope(fetchEnterpriseChannelsForPanel, []);
}

export function useEnterpriseGovernanceLiveChannelDetail(enterpriseId: string | null) {
  return usePanelEnvelope(
    () => (enterpriseId ? fetchEnterpriseChannelDetailForPanel(enterpriseId) : Promise.resolve({
      data: null,
      dataSource: "FALLBACK",
      fallbackUsed: true,
      lastSyncAt: new Date().toISOString(),
    })),
    [enterpriseId],
  );
}

export function useEnterpriseGovernanceLiveTimeline(enterpriseId: string | null) {
  return usePanelEnvelope(
    () =>
      enterpriseId
        ? fetchEnterpriseGovernanceHistoryForPanel(enterpriseId)
        : Promise.resolve({
            data: [] as EnterpriseGovernanceHistoryEntry[],
            dataSource: "FALLBACK",
            fallbackUsed: true,
            lastSyncAt: new Date().toISOString(),
          }),
    [enterpriseId],
  );
}

export function useEnterpriseGovernanceLiveSecurityAlerts(enterpriseId: string | null) {
  return usePanelEnvelope(
    () =>
      enterpriseId
        ? fetchEnterpriseSecurityAlertsForPanel(enterpriseId)
        : Promise.resolve({
            data: [] as EnterpriseSecurityAlert[],
            dataSource: "FALLBACK",
            fallbackUsed: true,
            lastSyncAt: new Date().toISOString(),
          }),
    [enterpriseId],
  );
}

export function useEnterpriseGovernanceLiveInvitations(enterpriseId: string | null) {
  return usePanelEnvelope(
    () =>
      enterpriseId
        ? fetchEnterpriseInvitationsForPanel(enterpriseId)
        : Promise.resolve({
            data: [] as EnterpriseSecureInvitation[],
            dataSource: "FALLBACK",
            fallbackUsed: true,
            lastSyncAt: new Date().toISOString(),
          }),
    [enterpriseId],
  );
}

export function useEnterpriseGovernanceLiveCollaborators(enterpriseId: string | null) {
  return usePanelEnvelope(
    () =>
      enterpriseId
        ? fetchEnterpriseCollaboratorsForPanel(enterpriseId)
        : Promise.resolve({
            data: [] as EnterpriseCollaboratorOnboarding[],
            dataSource: "FALLBACK",
            fallbackUsed: true,
            lastSyncAt: new Date().toISOString(),
          }),
    [enterpriseId],
  );
}

export function useEnterpriseGovernanceLivePoles(enterpriseId: string | null) {
  return usePanelEnvelope(
    () =>
      enterpriseId
        ? fetchEnterprisePoleActivationsForPanel(enterpriseId)
        : Promise.resolve({
            data: [] as EnterprisePoleActivation[],
            dataSource: "FALLBACK",
            fallbackUsed: true,
            lastSyncAt: new Date().toISOString(),
          }),
    [enterpriseId],
  );
}

export type { EnterpriseCommercialChannel };
