"use client";

import { memo } from "react";

import type { CommercialDeliveryPartner } from "./commercial-delivery-flow.types";

function CommercialDeliveryPartnerCardInner({ partner }: { partner: CommercialDeliveryPartner }) {
  return (
    <article className="cdf-card cdf-partner-card" data-testid="cdf-partner-card">
      <p className="cdf-card-kicker">Partenaire</p>
      <h3 className="cdf-card-title">{partner.displayName}</h3>
      {partner.secondaryName ? <p className="cdf-card-secondary">{partner.secondaryName}</p> : null}
      <p className="cdf-card-meta">{partner.city}</p>
    </article>
  );
}

export const CommercialDeliveryPartnerCard = memo(CommercialDeliveryPartnerCardInner);
