import { memo, useMemo } from "react";

import type { ProfessionalPartner } from "./professional-commercial-network.types";
import { resolveProfessionalPartnerDisplay } from "./professional-partner-display";

const STATUS_LABEL: Record<ProfessionalPartner["status"], string> = {
  invited: "Invitation envoyée",
  pending_validation: "En validation",
  active: "Partenaire actif",
  suspended: "Suspendu",
};

export const ProfessionalPartnerRelationshipCard = memo(function ProfessionalPartnerRelationshipCard({
  partner,
}: {
  partner: ProfessionalPartner;
}) {
  const identity = useMemo(() => resolveProfessionalPartnerDisplay(partner), [partner]);

  return (
    <article className="pcn-card" data-testid={`pcn-partner-card-${partner.id}`}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <div>
          <h3
            style={{ margin: 0, fontSize: 15, fontWeight: 700 }}
            data-testid={`pcn-formal-display-name-${partner.id}`}
          >
            {identity.displayName}
          </h3>
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "#8a9bab" }}>
            {identity.secondaryName ?? `${partner.city} · ${partner.contactName}`}
          </p>
        </div>
        <span className={`pcn-status pcn-status--${partner.status === "active" ? "active" : partner.status === "pending_validation" ? "pending" : ""}`}>
          {STATUS_LABEL[partner.status]}
        </span>
      </div>
      <p style={{ margin: "8px 0 0", fontSize: 10, color: "#94a3b8" }}>
        {partner.productCategories.join(" · ")} — {partner.stabilityLabel}
      </p>
    </article>
  );
});
