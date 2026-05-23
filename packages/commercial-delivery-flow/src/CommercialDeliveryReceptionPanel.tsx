"use client";

import { memo, useMemo } from "react";

import { buildReceptionSignals } from "./commercial-delivery-intelligence";
import type { CommercialDelivery } from "./commercial-delivery-flow.types";

function CommercialDeliveryReceptionPanelInner({ delivery }: { delivery: CommercialDelivery }) {
  const signals = useMemo(() => buildReceptionSignals(delivery), [delivery]);

  return (
    <section className="cdf-panel" data-testid="cdf-reception-panel">
      <h4 className="cdf-panel-title">Réception</h4>
      <p className="cdf-panel-text">
        Réception simple auprès de {delivery.partner.displayName}.
      </p>
      <ul className="cdf-hints">
        {signals.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
    </section>
  );
}

export const CommercialDeliveryReceptionPanel = memo(CommercialDeliveryReceptionPanelInner);
