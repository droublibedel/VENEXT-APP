"use client";

import { memo, useMemo } from "react";

import { buildCommercialProgressHints } from "./relational-order-intelligence";
import type { RelationalCommercialOrder } from "./relational-order-orchestration.types";

function RelationalOrderPreparationPanelInner({ order }: { order: RelationalCommercialOrder }) {
  const hints = useMemo(() => buildCommercialProgressHints(order.status), [order.status]);

  return (
    <section className="roo-panel" data-testid="roo-preparation-panel">
      <h4 className="roo-panel-title">Préparation commande</h4>
      <ul className="roo-lines">
        {order.lines.map((line) => (
          <li key={line.productId}>
            {line.productName} × {line.quantity} — {line.priceLabel}
          </li>
        ))}
      </ul>
      <ul className="roo-hints">
        {hints.map((h) => (
          <li key={h}>{h}</li>
        ))}
      </ul>
    </section>
  );
}

export const RelationalOrderPreparationPanel = memo(RelationalOrderPreparationPanelInner);
