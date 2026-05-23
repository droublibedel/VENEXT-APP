import type { EnterpriseSecurityAlert } from "./enterprise-governance.types";
import { getEnterpriseSecurityTranslation } from "./enterprise-security-i18n";

type Props = {
  alerts: EnterpriseSecurityAlert[];
  locale?: string;
  onAcknowledge?: (id: string) => void;
};

export function EnterpriseSecurityAlertsPanel({ alerts, locale = "fr-CI", onAcknowledge }: Props) {
  return (
    <section className="ecg-shell" data-testid="enterprise-security-alerts-panel">
      <h2 className="ecg-title">{getEnterpriseSecurityTranslation("security.alerts.title", locale)}</h2>
      {alerts.length === 0 ? (
        <p className="ecg-muted">Aucune alerte</p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {alerts.map((a) => (
            <li key={a.id} style={{ padding: "8px 0" }} data-testid={`alert-${a.alertType}`}>
              <span className={`ecg-badge`}>{a.severity}</span> {a.message}
              {!a.acknowledged && onAcknowledge ? (
                <button
                  type="button"
                  style={{ marginLeft: 8 }}
                  data-testid={`ack-${a.id}`}
                  onClick={() => onAcknowledge(a.id)}
                >
                  OK
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
