import type {
  EnterpriseCollaboratorOnboarding,
  EnterpriseGovernanceHistoryEntry,
  EnterpriseSecurityAlert,
  EnterpriseTrustedDevice,
} from "./enterprise-governance.types";
import { getEnterpriseSecurityTranslation } from "./enterprise-security-i18n";
import { getSuspendedUserPublicMessage } from "./enterprise-security-governance";
import { EnterpriseSecurityAlertsPanel } from "./EnterpriseSecurityAlertsPanel";
import { EnterpriseGovernanceHistoryPanel } from "./EnterpriseGovernanceHistoryPanel";
import { EnterpriseArchiveWorkflow } from "./EnterpriseArchiveWorkflow";

type Props = {
  enterpriseId: string;
  collaborators: EnterpriseCollaboratorOnboarding[];
  devices: EnterpriseTrustedDevice[];
  alerts: EnterpriseSecurityAlert[];
  history: EnterpriseGovernanceHistoryEntry[];
  locale?: string;
  onSuspendUser?: (internalId: string) => void;
  onApproveDevice?: (deviceId: string) => void;
};

export function EnterpriseInternalSecurityWorkspace({
  enterpriseId,
  collaborators,
  devices,
  alerts,
  history,
  locale = "fr-CI",
  onSuspendUser,
  onApproveDevice,
}: Props) {
  return (
    <div data-testid="enterprise-internal-security-workspace" style={{ display: "grid", gap: 16 }}>
      <header style={{ marginBottom: 12 }}>
        <h1 style={{ fontSize: 18, margin: 0 }}>
          {getEnterpriseSecurityTranslation("security.internal.workspace", locale)}
        </h1>
        <p className="ecg-muted" data-testid="security-enterprise-id">
          {enterpriseId} — accès internes uniquement
        </p>
      </header>

      <section className="ecg-shell" data-testid="security-collaborators">
        <h2 className="ecg-title">Collaborateurs</h2>
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {collaborators.map((c) => (
            <li key={c.internalEnterpriseUserId} style={{ padding: "6px 0", display: "flex", gap: 8 }}>
              <span style={{ flex: 1 }}>
                {c.firstName} {c.lastName} — {c.status}
              </span>
              {c.status === "SUSPENDED" ? (
                <span className="ecg-muted" data-testid="suspended-hint">
                  {getSuspendedUserPublicMessage(locale)}
                </span>
              ) : null}
              {onSuspendUser && c.status === "ACTIVE" ? (
                <button
                  type="button"
                  data-testid={`suspend-${c.internalEnterpriseUserId}`}
                  onClick={() => onSuspendUser(c.internalEnterpriseUserId)}
                >
                  Suspendre
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="ecg-shell" data-testid="security-devices">
        <h2 className="ecg-title">Machines</h2>
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {devices.map((d) => (
            <li key={d.id} style={{ padding: "6px 0" }}>
              {d.label} — {d.status}
              {onApproveDevice && d.status !== "APPROVED" ? (
                <button type="button" style={{ marginLeft: 8 }} onClick={() => onApproveDevice(d.id)}>
                  Approuver
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <EnterpriseSecurityAlertsPanel alerts={alerts} locale={locale} />
      <EnterpriseGovernanceHistoryPanel entries={history} locale={locale} />
      <EnterpriseArchiveWorkflow enterpriseId={enterpriseId} authorLevel="PARTNER_SECURITY" />
    </div>
  );
}
