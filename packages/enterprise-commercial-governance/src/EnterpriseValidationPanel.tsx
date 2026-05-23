import type { EnterpriseActivationStatus } from "./enterprise-governance.types";
import { getEnterpriseGovernanceTranslation } from "./enterprise-governance-i18n";

type Props = {
  activationStatus: EnterpriseActivationStatus;
  locale?: string;
  onActivate?: () => void;
  onReject?: () => void;
};

export function EnterpriseValidationPanel({
  activationStatus,
  locale = "fr-CI",
  onActivate,
  onReject,
}: Props) {
  return (
    <section className="ecg-shell ecg-panel-danger" data-testid="enterprise-validation-panel">
      <h2 className="ecg-title">{getEnterpriseGovernanceTranslation("enterprise.validation.pending", locale)}</h2>
      <p data-testid="activation-status">{activationStatus}</p>
      {(onActivate || onReject) && (
        <ValidationActions onActivate={onActivate} onReject={onReject} />
      )}
    </section>
  );
}

function ValidationActions({
  onActivate,
  onReject,
}: {
  onActivate?: () => void;
  onReject?: () => void;
}) {
  return (
    <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
      {onActivate ? (
        <button type="button" data-testid="btn-activate" onClick={onActivate}>
          ACTIVATE
        </button>
      ) : null}
      {onReject ? (
        <button type="button" data-testid="btn-reject" onClick={onReject}>
          REJECT
        </button>
      ) : null}
    </div>
  );
}
