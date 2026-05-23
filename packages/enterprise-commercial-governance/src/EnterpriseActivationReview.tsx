import type { EnterpriseCollaboratorOnboarding } from "./enterprise-governance.types";

type Props = {
  collaborator: EnterpriseCollaboratorOnboarding;
  onAction?: (action: "ACTIVATE" | "BLOCK" | "REJECT" | "SUSPEND") => void;
};

export function EnterpriseActivationReview({ collaborator, onAction }: Props) {
  return (
    <section className="ecg-shell" data-testid="enterprise-activation-review">
      <h2 className="ecg-title">Revue activation</h2>
      <dl style={{ fontSize: 13 }}>
        <dt className="ecg-muted">Collaborateur</dt>
        <dd data-testid="review-name">
          {collaborator.firstName} {collaborator.lastName}
        </dd>
        <dt className="ecg-muted">Pôle</dt>
        <dd data-testid="review-pole">{collaborator.poleId}</dd>
        <dt className="ecg-muted">Pièce</dt>
        <dd>{collaborator.idDocumentNumber}</dd>
        <dt className="ecg-muted">Machine / IP</dt>
        <dd data-testid="review-device">
          {collaborator.machineFingerprint ?? "—"} / {collaborator.ipAddress ?? "—"}
        </dd>
      </dl>
      {onAction ? (
        <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 6 }}>
          {(["ACTIVATE", "BLOCK", "REJECT", "SUSPEND"] as const).map((action) => (
            <button
              key={action}
              type="button"
              data-testid={`review-${action.toLowerCase()}`}
              onClick={() => onAction(action)}
            >
              {action}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
