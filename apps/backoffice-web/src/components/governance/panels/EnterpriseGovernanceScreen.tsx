"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  EnterpriseActivationQueue,
  EnterpriseChannelWorkspace,
  EnterpriseOnboardingTimeline,
  EnterprisePoleActivationPanel,
  EnterpriseSecurityControlPanel,
  EnterpriseInternalSecurityWorkspace,
  EnterpriseGlobalGovernanceControlPanel,
  listCollaboratorsByEnterprise,
  listTrustedDevices,
  buildEnterpriseInvitationTemplate,
  computeOnboardingProgress,
  createEnterpriseChannel,
  listAvailablePolesForActivation,
  listPendingCollaborators,
  listPoleActivations,
  activateEnterprisePole,
  resetEnterpriseGovernanceStorage,
  type EnterpriseCommercialChannel,
  type EnterpriseOnboardingStepId,
  listGovernanceHistory,
  listSecurityAlerts,
} from "enterprise-commercial-governance";
import { VenextSkeletonScreen } from "commerce-ux-harmony";
import { fetchGovernanceJson } from "@/lib/governance-api";

export function EnterpriseGovernanceScreen() {
  const [channel, setChannel] = useState<EnterpriseCommercialChannel | null>(null);
  const [completedSteps, setCompletedSteps] = useState<EnterpriseOnboardingStepId[]>([]);
  const [liveChannels, setLiveChannels] = useState<unknown[]>([]);

  const refresh = useCallback(() => {
    void fetchGovernanceJson<{ payload?: unknown[] }>("/commerce-foundation/enterprise/channels").then(
      (r) => {
        const payload = r.data && typeof r.data === "object" && "payload" in r.data ? r.data.payload : r.data;
        if (r.ok && Array.isArray(payload)) setLiveChannels(payload);
      },
    );
  }, []);

  useEffect(() => {
    resetEnterpriseGovernanceStorage();
    const demo = createEnterpriseChannel({
      enterpriseId: "ent-demo-producteur",
      actorKind: "producteur",
      contractReference: "CTR-2026-001",
      companyName: "Producteur Démo SA",
      headquarters: "Abidjan",
      governanceStatus: "ONBOARDING",
      activationStatus: "PENDING_VALIDATION",
    });
    setChannel(demo);
    setCompletedSteps(["commercial_meeting", "contract_signed", "channel_open"]);
    refresh();
  }, [refresh]);

  const poles = listAvailablePolesForActivation();
  const activations = channel ? listPoleActivations(channel.enterpriseId) : [];
  const pending = listPendingCollaborators();

  const handleActivatePole = (poleId: string) => {
    if (!channel) return;
    activateEnterprisePole({ enterpriseId: channel.enterpriseId, poleId });
    buildEnterpriseInvitationTemplate({
      companyName: channel.companyName,
      poleLabel: poleId,
      privateUrl: `https://venext.co/e/${channel.enterpriseId}/${poleId}/demo`,
      activationCode: "VEN-000000",
    });
    setChannel({ ...channel, onboardingProgress: computeOnboardingProgress(completedSteps) });
  };

  if (!channel) {
    return (
      <div style={{ padding: 24 }} data-testid="enterprise-governance-skeleton">
        <VenextSkeletonScreen variant="dashboard" />
      </div>
    );
  }

  return (
    <div data-testid="enterprise-governance-screen">
      <header style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, margin: 0 }}>Gouvernance grands comptes</h1>
        <p style={{ opacity: 0.7, fontSize: 13 }}>
          Onboarding supervisé — pôles VENEXT existants uniquement. Canaux live : {liveChannels.length}
        </p>
      </header>
      <Grid>
        <EnterpriseChannelWorkspace channel={channel} />
        <EnterpriseOnboardingTimeline completedStepIds={completedSteps} />
        <EnterprisePoleActivationPanel
          poles={poles}
          activatedPoleIds={activations.map((a) => a.poleId)}
          onActivate={handleActivatePole}
        />
        <EnterpriseActivationQueue pending={pending} />
        <EnterpriseSecurityControlPanel channel={channel} poleActivations={activations} />
        <EnterpriseInternalSecurityWorkspace
          enterpriseId={channel.enterpriseId}
          collaborators={listCollaboratorsByEnterprise(channel.enterpriseId)}
          devices={listTrustedDevices(channel.enterpriseId)}
          alerts={listSecurityAlerts(channel.enterpriseId)}
          history={listGovernanceHistory(channel.enterpriseId)}
        />
        <EnterpriseGlobalGovernanceControlPanel />
      </Grid>
    </div>
  );
}

function Grid({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
      {children}
    </div>
  );
}
