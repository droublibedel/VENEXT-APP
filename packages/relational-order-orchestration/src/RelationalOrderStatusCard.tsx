"use client";

import { memo, useMemo } from "react";

import { humanStatusLabel } from "./relational-order-governance";
import { buildOrderFlowSignals } from "./relational-order-intelligence";
import type { RelationalCommercialOrder } from "./relational-order-orchestration.types";

function RelationalOrderStatusCardInner({ order }: { order: RelationalCommercialOrder }) {
  const signals = useMemo(() => buildOrderFlowSignals(order), [order]);

  return (
    <article className="roo-card roo-status-card" data-testid="roo-status-card">
      <p className="roo-card-kicker">{order.reference}</p>
      <h3 className="roo-card-title">{humanStatusLabel(order.status)}</h3>
      <p className="roo-card-meta">
        {order.amountLabel} · {order.updatedAt}
      </p>
      {signals.length > 0 ? (
        <ul className="roo-signals" data-testid="roo-flow-signals">
          {signals.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

export const RelationalOrderStatusCard = memo(RelationalOrderStatusCardInner);
