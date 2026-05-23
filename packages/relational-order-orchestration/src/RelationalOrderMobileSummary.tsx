"use client";

import { memo, useMemo } from "react";

import { humanStatusLabel } from "./relational-order-governance";
import { buildOrderFlowSignals } from "./relational-order-intelligence";
import type { RelationalCommercialOrder } from "./relational-order-orchestration.types";

function RelationalOrderMobileSummaryInner({ order }: { order: RelationalCommercialOrder }) {
  const signals = useMemo(() => buildOrderFlowSignals(order).slice(0, 2), [order]);

  return (
    <article className="roo-mobile-summary" data-testid="roo-mobile-summary">
      <div className="roo-mobile-summary-row">
        <span className="roo-mobile-partner">{order.partner.displayName}</span>
        <span className="roo-mobile-amount">{order.amountLabel}</span>
      </div>
      <p className="roo-mobile-status">{humanStatusLabel(order.status)}</p>
      {signals[0] ? <p className="roo-mobile-hint">{signals[0]}</p> : null}
    </article>
  );
}

export const RelationalOrderMobileSummary = memo(RelationalOrderMobileSummaryInner);
