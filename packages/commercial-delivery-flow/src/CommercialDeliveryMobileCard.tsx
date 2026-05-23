"use client";

import { memo, useMemo } from "react";

import { humanDeliveryStatusLabel } from "./commercial-delivery-governance";
import { buildDeliveryFlowSignals } from "./commercial-delivery-intelligence";
import type { CommercialDelivery } from "./commercial-delivery-flow.types";

function CommercialDeliveryMobileCardInner({ delivery }: { delivery: CommercialDelivery }) {
  const hint = useMemo(() => buildDeliveryFlowSignals(delivery)[0], [delivery]);

  return (
    <article className="cdf-mobile-card" data-testid="cdf-mobile-card">
      <div className="cdf-mobile-row">
        <span className="cdf-mobile-partner">{delivery.partner.displayName}</span>
        <span className="cdf-mobile-amount">{delivery.amountLabel}</span>
      </div>
      <p className="cdf-mobile-status">{humanDeliveryStatusLabel(delivery.status)}</p>
      {hint ? <p className="cdf-mobile-hint">{hint}</p> : null}
    </article>
  );
}

export const CommercialDeliveryMobileCard = memo(CommercialDeliveryMobileCardInner);
