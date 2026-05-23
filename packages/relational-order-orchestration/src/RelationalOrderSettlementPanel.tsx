"use client";

import { memo, useMemo } from "react";

import { buildSettlementProgressHints } from "./relational-order-intelligence";
import type { RelationalCommercialOrder } from "./relational-order-orchestration.types";

function RelationalOrderSettlementPanelInner({
  order,
  onOpenWallet,
}: {
  order: RelationalCommercialOrder;
  onOpenWallet?: (transactionId: string) => void;
}) {
  const hints = useMemo(() => buildSettlementProgressHints(order.settlement), [order.settlement]);

  if (!order.settlement) {
    return (
      <section className="roo-panel" data-testid="roo-settlement-panel">
        <h4 className="roo-panel-title">Règlement</h4>
        <p className="roo-panel-text">Règlement optionnel — la commande peut avancer sans wallet.</p>
      </section>
    );
  }

  const { settlement } = order;

  return (
    <section className="roo-panel" data-testid="roo-settlement-panel">
      <h4 className="roo-panel-title">Règlement lié</h4>
      <p className="roo-panel-amount">{settlement.amountLabel}</p>
      <p className="roo-panel-text">{settlement.statusLabel}</p>
      <ul className="roo-hints">
        {hints.map((h) => (
          <li key={h}>{h}</li>
        ))}
      </ul>
      {settlement.id && onOpenWallet ? (
        <button
          type="button"
          className="roo-btn roo-btn--link"
          data-testid="roo-open-wallet"
          onClick={() => onOpenWallet(settlement.id!)}
        >
          Voir règlement
        </button>
      ) : null}
    </section>
  );
}

export const RelationalOrderSettlementPanel = memo(RelationalOrderSettlementPanelInner);
