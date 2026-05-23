"use client";

import { memo, useMemo } from "react";

import {
  CommerceSettlementPartnerNotice,
  CommerceSettlementTimeline,
  buildSettlementTimeline,
  transactionToSettlement,
} from "commerce-wallet";
import type { CommerceTransaction } from "commerce-wallet";

export const ProducerSettlementTimelinePanel = memo(function ProducerSettlementTimelinePanel({
  transactions,
}: {
  transactions: CommerceTransaction[];
}) {
  const active = useMemo(
    () =>
      transactions.find((t) => t.status === "pending") ??
      transactions.find((t) => t.settlementMethod === "bank-transfer") ??
      transactions[0],
    [transactions],
  );

  if (!active) {
    return (
      <p className="text-sm text-slate-500" data-testid="producer-settlement-timeline-empty">
        Flux commercial régulier — aucune étape en attente.
      </p>
    );
  }

  const settlement = transactionToSettlement(active);
  const steps = buildSettlementTimeline(settlement);

  return (
    <div className="space-y-4" data-testid="producer-settlement-timeline-panel">
      <p className="text-sm text-slate-400">Confirmation partenaire et clôture d&apos;activité commerciale.</p>
      <CommerceSettlementTimeline steps={steps} testId="producer-settlement-timeline" />
      <CommerceSettlementPartnerNotice
        partnerName={settlement.partnerName}
        confirmed={settlement.partnerConfirmed}
        required={settlement.partnerConfirmationRequired}
        testId="producer-settlement-partner-notice"
      />
    </div>
  );
});
