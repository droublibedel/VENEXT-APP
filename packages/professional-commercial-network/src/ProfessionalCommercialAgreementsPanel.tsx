import { memo } from "react";

import type { ProfessionalCommercialAgreement } from "./professional-commercial-network.types";

export const ProfessionalCommercialAgreementsPanel = memo(function ProfessionalCommercialAgreementsPanel({
  agreements,
}: {
  agreements: ProfessionalCommercialAgreement[];
}) {
  return (
    <section className="pcn-card" data-testid="pcn-agreements-panel">
      <h3 style={{ margin: "0 0 8px", fontSize: 13 }}>Accords commerciaux</h3>
      {agreements.length === 0 ? (
        <p style={{ fontSize: 11, color: "#8a9bab" }}>Aucun accord enregistré.</p>
      ) : (
        <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
          {agreements.map((a) => (
            <li key={a.id} className="pcn-hint" style={{ marginBottom: 6 }} data-testid={`pcn-agreement-${a.id}`}>
              <strong>{a.label}</strong>
              <span style={{ display: "block", fontSize: 10, marginTop: 2 }}>
                {a.status === "active" ? "Actif" : a.status === "review" ? "En revue" : "Brouillon"}
                {a.validUntil ? ` · jusqu'au ${a.validUntil}` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
});
