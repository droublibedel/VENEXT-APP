import type { VenextCanonicalPole } from "./enterprise-governance.types";
import { getEnterpriseGovernanceTranslation } from "./enterprise-governance-i18n";

type Props = {
  poles: VenextCanonicalPole[];
  activatedPoleIds?: string[];
  onActivate?: (poleId: string) => void;
  locale?: string;
};

export function EnterprisePoleActivationPanel({
  poles,
  activatedPoleIds = [],
  onActivate,
  locale = "fr-CI",
}: Props) {
  const activated = new Set(activatedPoleIds);
  return (
    <section className="ecg-shell" data-testid="enterprise-pole-activation-panel">
      <h2 className="ecg-title">
        {getEnterpriseGovernanceTranslation("enterprise.poles.existing_only", locale)}
      </h2>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {poles.map((pole) => (
          <li key={pole.poleId} style={{ padding: "6px 0", display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ flex: 1 }} data-testid={`pole-${pole.poleId}`}>
              {pole.label}
            </span>
            {activated.has(pole.poleId) ? (
              <span className="ecg-badge">Activé</span>
            ) : onActivate ? (
              <button type="button" data-testid={`btn-activate-pole-${pole.poleId}`} onClick={() => onActivate(pole.poleId)}>
                Activer
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
