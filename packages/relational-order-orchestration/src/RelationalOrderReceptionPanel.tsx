"use client";

import { memo } from "react";

import type { RelationalCommercialOrder } from "./relational-order-orchestration.types";

function RelationalOrderReceptionPanelInner({ order }: { order: RelationalCommercialOrder }) {
  return (
    <section className="roo-panel" data-testid="roo-reception-panel">
      <h4 className="roo-panel-title">Réception partenaire</h4>
      <p className="roo-panel-text">
        Confirmez la réception de {order.lines.length} ligne(s) auprès de {order.partner.displayName}.
      </p>
    </section>
  );
}

export const RelationalOrderReceptionPanel = memo(RelationalOrderReceptionPanelInner);
