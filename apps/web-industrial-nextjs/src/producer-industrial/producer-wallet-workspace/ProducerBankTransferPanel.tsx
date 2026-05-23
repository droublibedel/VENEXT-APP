"use client";

import { memo, useMemo } from "react";

import {
  CommerceSettlementMethodCard,
  CommerceSettlementTimeline,
  buildSettlementTimeline,
  transactionToSettlement,
} from "commerce-wallet";
import type { CommerceTransaction } from "commerce-wallet";

export const ProducerBankTransferPanel = memo(function ProducerBankTransferPanel({
  transactions,
}: {
  transactions: CommerceTransaction[];
}) {
  const transfers = useMemo(
    () => transactions.filter((t) => t.settlementMethod === "bank-transfer"),
    [transactions],
  );
  const primary = transfers[0];

  if (!primary) {
    return (
      <p className="text-sm text-slate-500" data-testid="producer-bank-transfer-empty">
        Aucun virement en cours — activité commerciale stable.
      </p>
    );
  }

  const settlement = transactionToSettlement(primary);
  const steps = buildSettlementTimeline(settlement);

  return (
    <div className="space-y-4" data-testid="producer-bank-transfer-panel">
      <p className="text-sm text-slate-400">Suivi virements bancaires et règlements compte à compte.</p>
      <CommerceSettlementMethodCard settlement={settlement} testId="producer-bank-transfer-card" />
      <CommerceSettlementTimeline steps={steps} testId="producer-bank-transfer-timeline" />
    </div>
  );
});
