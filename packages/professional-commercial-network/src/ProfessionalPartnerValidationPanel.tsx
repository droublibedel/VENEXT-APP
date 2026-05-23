import { memo } from "react";

import type { ProfessionalPartner } from "./professional-commercial-network.types";

export const ProfessionalPartnerValidationPanel = memo(function ProfessionalPartnerValidationPanel({
  partner,
  onValidate,
  onReject,
}: {
  partner: ProfessionalPartner | null;
  onValidate?: (partnerId: string) => void;
  onReject?: (partnerId: string) => void;
}) {
  if (!partner) {
    return (
      <section className="pcn-card" data-testid="pcn-validation-empty">
        <p style={{ fontSize: 11, color: "#8a9bab" }}>Sélectionnez un partenaire à valider.</p>
      </section>
    );
  }

  return (
    <section className="pcn-card" data-testid="pcn-validation-panel">
      <h3 style={{ margin: "0 0 8px", fontSize: 13 }}>Validation partenaire</h3>
      <dl style={{ margin: 0, fontSize: 11 }}>
        <dt style={{ color: "#64748b" }}>Société</dt>
        <dd style={{ margin: "0 0 8px" }} data-testid="pcn-validation-company">
          {partner.companyName}
        </dd>
        <dt style={{ color: "#64748b" }}>Activité</dt>
        <dd style={{ margin: "0 0 8px" }}>{partner.activityType}</dd>
        <dt style={{ color: "#64748b" }}>Couverture</dt>
        <dd style={{ margin: "0 0 8px" }}>{partner.coverageLabel}</dd>
        <dt style={{ color: "#64748b" }}>Catégories produits</dt>
        <dd style={{ margin: "0 0 8px" }}>{partner.productCategories.join(", ")}</dd>
        <dt style={{ color: "#64748b" }}>Stabilité réseau</dt>
        <dd style={{ margin: "0 0 8px" }}>{partner.stabilityLabel}</dd>
        <dt style={{ color: "#64748b" }}>Historique</dt>
        <dd style={{ margin: "0 0 12px" }}>{partner.lastActivity}</dd>
      </dl>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          className="pcn-btn pcn-btn--primary"
          onClick={() => onValidate?.(partner.id)}
          data-testid="pcn-validate-partner"
        >
          Valider la relation
        </button>
        <button type="button" className="pcn-btn" onClick={() => onReject?.(partner.id)} data-testid="pcn-reject-partner">
          Refuser
        </button>
      </div>
    </section>
  );
});
