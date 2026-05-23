import type { EnterpriseCollaboratorOnboarding } from "./enterprise-governance.types";

type Props = {
  pending: EnterpriseCollaboratorOnboarding[];
  onSelect?: (id: string) => void;
};

export function EnterpriseActivationQueue({ pending, onSelect }: Props) {
  return (
    <section className="ecg-shell" data-testid="enterprise-activation-queue">
      <h2 className="ecg-title">File validation humaine</h2>
      {pending.length === 0 ? (
        <p className="ecg-muted">Aucun dossier en attente</p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {pending.map((row) => (
            <li key={row.internalEnterpriseUserId} style={{ padding: "8px 0" }}>
              <button
                type="button"
                data-testid={`queue-item-${row.internalEnterpriseUserId}`}
                onClick={() => onSelect?.(row.internalEnterpriseUserId)}
              >
                {row.firstName} {row.lastName} — {row.poleId}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
