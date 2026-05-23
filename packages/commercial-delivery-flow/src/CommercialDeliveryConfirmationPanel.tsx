"use client";

import { memo, useMemo } from "react";

import { buildDeliveryProgressHints } from "./commercial-delivery-intelligence";
import type { CommercialDelivery } from "./commercial-delivery-flow.types";

function CommercialDeliveryConfirmationPanelInner({ delivery }: { delivery: CommercialDelivery }) {
  const hints = useMemo(() => buildDeliveryProgressHints(delivery.status), [delivery.status]);

  return (
    <section className="cdf-panel" data-testid="cdf-confirmation-panel">
      <h4 className="cdf-panel-title">Confirmation terrain</h4>
      <p className="cdf-panel-text">Confirmation rapide — pas de formulaire long.</p>
      <ul className="cdf-hints">
        {hints.map((h) => (
          <li key={h}>{h}</li>
        ))}
      </ul>
    </section>
  );
}

export const CommercialDeliveryConfirmationPanel = memo(CommercialDeliveryConfirmationPanelInner);
