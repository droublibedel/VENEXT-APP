"use client";

import { memo, useMemo } from "react";

import { humanDeliveryStatusLabel } from "./commercial-delivery-governance";
import { buildDeliveryFlowSignals } from "./commercial-delivery-intelligence";
import type { CommercialDelivery } from "./commercial-delivery-flow.types";

function CommercialDeliveryStatusCardInner({ delivery }: { delivery: CommercialDelivery }) {
  const signals = useMemo(() => buildDeliveryFlowSignals(delivery), [delivery]);

  return (
    <article className="cdf-card cdf-status-card" data-testid="cdf-status-card">
      <p className="cdf-card-kicker">{delivery.reference}</p>
      <h3 className="cdf-card-title">{humanDeliveryStatusLabel(delivery.status)}</h3>
      <p className="cdf-card-meta">
        {delivery.amountLabel} · {delivery.updatedAt}
      </p>
      {signals.length > 0 ? (
        <ul className="cdf-signals" data-testid="cdf-flow-signals">
          {signals.map((s, i) => (
            <li key={`${s}-${i}`}>{s}</li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

export const CommercialDeliveryStatusCard = memo(CommercialDeliveryStatusCardInner);
