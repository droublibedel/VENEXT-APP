"use client";

import { EnterpriseGovernanceDataSourceBadge } from "./EnterpriseGovernanceDataSourceBadge";
import { EnterpriseInternalSecurityWorkspace } from "./EnterpriseInternalSecurityWorkspace";
import {
  canRunSensitiveGovernancePanelAction,
  sensitiveActionUnavailableMessage,
} from "./enterprise-governance-live-ui-client";
import {
  useEnterpriseGovernanceLiveCollaborators,
  useEnterpriseGovernanceLiveSecurityAlerts,
  useEnterpriseGovernanceLiveTimeline,
} from "./enterprise-governance-live-hooks";
import { memoryFallbackTrustedDevices } from "./enterprise-governance-memory-fallback-adapter";

type Props = {
  enterpriseId: string;
  locale?: string;
};

export function EnterpriseInternalSecurityWorkspaceLive({ enterpriseId, locale = "fr-CI" }: Props) {
  const collaborators = useEnterpriseGovernanceLiveCollaborators(enterpriseId);
  const alerts = useEnterpriseGovernanceLiveSecurityAlerts(enterpriseId);
  const history = useEnterpriseGovernanceLiveTimeline(enterpriseId);

  const meta = collaborators.envelope ?? alerts.envelope ?? history.envelope;
  const actionsEnabled = meta ? canRunSensitiveGovernancePanelAction(meta) : false;
  const loading = collaborators.loading || alerts.loading || history.loading;

  if (loading) {
    return <p className="ecg-muted">Chargement sécurité interne…</p>;
  }

  return (
    <div>
      {meta ? (
        <EnterpriseGovernanceDataSourceBadge
          dataSource={meta.dataSource}
          fallbackUsed={meta.fallbackUsed}
          error={meta.error}
        />
      ) : null}
      {!actionsEnabled ? (
        <p className="ecg-muted" data-testid="internal-security-live-required">
          {sensitiveActionUnavailableMessage()}
        </p>
      ) : null}
      <EnterpriseInternalSecurityWorkspace
        enterpriseId={enterpriseId}
        collaborators={collaborators.envelope?.data ?? []}
        devices={memoryFallbackTrustedDevices(enterpriseId)}
        alerts={alerts.envelope?.data ?? []}
        history={history.envelope?.data ?? []}
        locale={locale}
        onSuspendUser={
          actionsEnabled
            ? () => {
                /* branché via actions LIVE ultérieures */
              }
            : undefined
        }
        onApproveDevice={actionsEnabled ? () => {} : undefined}
      />
    </div>
  );
}
