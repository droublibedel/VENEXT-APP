import { memo } from "react";

import { CommerceWalletVirtualList } from "../components/CommerceWalletVirtualList";
import type { CommerceTransaction } from "../hooks/commerce-wallet.types";
import { CommerceSettlementStatusBadge } from "../settlements/CommerceSettlementStatusBadge";

const STATUS_LABEL: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmé",
  settled: "Réglé",
  failed: "Échec",
};

export const CommerceTransactionList = memo(function CommerceTransactionList({
  transactions,
  activeId,
  onSelect,
  testId = "cw-transaction-list",
}: {
  transactions: CommerceTransaction[];
  activeId?: string | null;
  onSelect?: (id: string) => void;
  testId?: string;
}) {
  return (
    <CommerceWalletVirtualList
      className="cw-tx-list"
      testId={testId}
      items={transactions}
      keyExtractor={(t) => t.id}
      renderItem={(t) => (
        <button
          type="button"
          className={`cw-tx-item${activeId === t.id ? " cw-tx-item--active" : ""}`}
          data-testid={`cw-tx-${t.id}`}
          onClick={() => onSelect?.(t.id)}
        >
          <div className="cw-tx-row">
            <strong>{t.label}</strong>
            <span className="cw-tx-amount">{t.amountLabel}</span>
          </div>
          <p className="cw-tx-meta">
            {t.partnerName ? `${t.partnerName} · ` : ""}
            {t.city} · {t.at}
          </p>
          <div className="cw-tx-footer">
            <span className="cw-tx-status" data-testid={`cw-tx-status-${t.id}`}>
              {STATUS_LABEL[t.status] ?? t.status}
            </span>
            {t.settlementMethod ? (
              <CommerceSettlementStatusBadge
                method={t.settlementMethod}
                mode={t.settlementMode}
                testId={`cw-tx-settlement-${t.id}`}
              />
            ) : null}
          </div>
        </button>
      )}
    />
  );
});
