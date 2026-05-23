"use client";

import { memo } from "react";

import type { RelationalOrderPartner } from "./relational-order-orchestration.types";

function RelationalOrderPartnerCardInner({ partner }: { partner: RelationalOrderPartner }) {
  return (
    <article className="roo-card roo-partner-card" data-testid="roo-partner-card">
      <p className="roo-card-kicker">Partenaire</p>
      <h3 className="roo-card-title">{partner.displayName}</h3>
      {partner.secondaryName ? (
        <p className="roo-card-secondary">{partner.secondaryName}</p>
      ) : null}
      <p className="roo-card-meta">
        {partner.city} · {partner.partnerType}
      </p>
    </article>
  );
}

export const RelationalOrderPartnerCard = memo(RelationalOrderPartnerCardInner);
