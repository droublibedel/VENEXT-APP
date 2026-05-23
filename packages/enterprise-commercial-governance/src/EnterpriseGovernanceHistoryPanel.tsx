import type { EnterpriseGovernanceHistoryEntry } from "./enterprise-governance.types";
import { getEnterpriseSecurityTranslation } from "./enterprise-security-i18n";

type Props = {
  entries: EnterpriseGovernanceHistoryEntry[];
  locale?: string;
};

export function EnterpriseGovernanceHistoryPanel({ entries, locale = "fr-CI" }: Props) {
  return (
    <section className="ecg-shell" data-testid="enterprise-governance-history-panel">
      <h2 className="ecg-title">{getEnterpriseSecurityTranslation("security.history.title", locale)}</h2>
      {entries.length === 0 ? (
        <p className="ecg-muted">Aucun événement</p>
      ) : (
        <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {entries.map((e) => (
            <li key={e.id} className="ecg-timeline-step" data-testid={`history-${e.id}`}>
              <span className="ecg-badge">{e.action}</span>
              <span style={{ flex: 1 }}>
                {e.target} — {e.previousState} → {e.newState}
              </span>
              <span className="ecg-muted">{new Date(e.createdAt).toLocaleDateString()}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
