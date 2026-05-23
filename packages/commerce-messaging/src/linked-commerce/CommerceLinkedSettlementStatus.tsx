import { memo } from "react";

import type { CommerceLinkedSettlement } from "./commerce-linked-context.types";
import { settlementStatusLabel } from "./buildCommerceLinkedContext";

export const CommerceLinkedSettlementStatus = memo(function CommerceLinkedSettlementStatus({
  settlement,
  testId = "cm-linked-settlement-status",
}: {
  settlement: CommerceLinkedSettlement;
  testId?: string;
}) {
  return (
    <span
      className="cm-linked-settlement-badge"
      data-testid={testId}
      data-method={settlement.method}
    >
      {settlementStatusLabel(settlement)}
    </span>
  );
});
