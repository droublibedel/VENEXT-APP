import { memo } from "react";

import type { ProfessionalLinkedSettlement } from "./professional-commercial-network.types";

export const ProfessionalPartnerSettlementsPanel = memo(function ProfessionalPartnerSettlementsPanel({
  settlements,
}: {
  settlements: ProfessionalLinkedSettlement[];
}) {
  return (
    <section className="pcn-card" data-testid="pcn-settlements-panel">
      <h3 style={{ margin: "0 0 8px", fontSize: 13 }}>Règlements liés</h3>
      {settlements.length === 0 ? (
        <p style={{ fontSize: 11, color: "#8a9bab" }}>Aucun règlement contextuel.</p>
      ) : (
        <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
          {settlements.map((s) => (
            <li key={s.id} className="pcn-hint" data-testid={`pcn-settlement-${s.id}`}>
              <strong>{s.reference}</strong> — {s.amountLabel} · {s.method}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
});
