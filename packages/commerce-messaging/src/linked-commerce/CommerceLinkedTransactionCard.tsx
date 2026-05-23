import { memo } from "react";

import type { CommerceLinkedSettlement } from "./commerce-linked-context.types";
import { CommerceLinkedSettlementStatus } from "./CommerceLinkedSettlementStatus";

export const CommerceLinkedTransactionCard = memo(function CommerceLinkedTransactionCard({
  settlement,
  partnerName,
  testId = "cm-linked-transaction-card",
}: {
  settlement: CommerceLinkedSettlement;
  partnerName?: string;
  testId?: string;
}) {
  return (
    <article className="cm-linked-card" data-testid={testId}>
      <div className="cm-linked-card-header">
        <p className="cm-linked-kicker">Règlement lié</p>
        <CommerceLinkedSettlementStatus settlement={settlement} />
      </div>
      <p className="cm-linked-amount">{settlement.amountLabel}</p>
      {partnerName ? <p className="cm-linked-meta">{partnerName}</p> : null}
      {settlement.reference ? (
        <p className="cm-linked-meta" data-testid="cm-linked-settlement-ref">
          Réf. {settlement.reference}
        </p>
      ) : null}
    </article>
  );
});
