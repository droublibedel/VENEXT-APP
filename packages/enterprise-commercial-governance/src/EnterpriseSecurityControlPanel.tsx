import type { EnterpriseCommercialChannel, EnterprisePoleActivation } from "./enterprise-governance.types";
import { getEnterpriseGovernanceTranslation } from "./enterprise-governance-i18n";

type Props = {
  channel: EnterpriseCommercialChannel;
  poleActivations?: EnterprisePoleActivation[];
  locale?: string;
  onSuspendUser?: () => void;
  onRevokeSession?: () => void;
  onCloseChannel?: () => void;
};

export function EnterpriseSecurityControlPanel({
  channel,
  poleActivations = [],
  locale = "fr-CI",
  onSuspendUser,
  onRevokeSession,
  onCloseChannel,
}: Props) {
  return (
    <section className="ecg-shell ecg-panel-danger" data-testid="enterprise-security-control-panel">
      <h2 className="ecg-title">
        {getEnterpriseGovernanceTranslation("enterprise.security.control", locale)}
      </h2>
      <p className="ecg-muted">{channel.enterpriseId}</p>
      <ul data-testid="pole-activation-list">
        {poleActivations.map((p) => (
          <li key={p.id}>
            {p.poleLabel} — {p.activated ? "actif" : "inactif"}
          </li>
        ))}
      </ul>
      <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
        {onSuspendUser ? (
          <button type="button" data-testid="btn-suspend-user" onClick={onSuspendUser}>
            Suspendre utilisateur
          </button>
        ) : null}
        {onRevokeSession ? (
          <button type="button" data-testid="btn-revoke-session" onClick={onRevokeSession}>
            Révoquer session
          </button>
        ) : null}
        {onCloseChannel ? (
          <button type="button" data-testid="btn-close-channel" onClick={onCloseChannel}>
            Fermer canal
          </button>
        ) : null}
      </div>
    </section>
  );
}
