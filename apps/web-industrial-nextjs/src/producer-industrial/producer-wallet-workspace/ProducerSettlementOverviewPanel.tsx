"use client";

import { memo } from "react";

import { CommerceWalletBalanceCard } from "commerce-wallet";
import { CommercePaymentActivityStrip } from "commerce-wallet";
import type { CommercePaymentActivity, CommerceWalletBalance } from "commerce-wallet";
import type { WalletHint } from "commerce-wallet";

export const ProducerSettlementOverviewPanel = memo(function ProducerSettlementOverviewPanel({
  balance,
  activity,
  hints,
}: {
  balance: CommerceWalletBalance | null;
  activity: CommercePaymentActivity[];
  hints: WalletHint[];
}) {
  return (
    <div className="space-y-4" data-testid="producer-settlement-overview">
      <p className="text-sm text-slate-400">
        Activité de règlement et flux commerciaux — visibilité partenaires réseau.
      </p>
      {hints.slice(0, 2).map((h) => (
        <p key={h.id} className="text-xs text-emerald-400/90" data-testid="producer-wallet-hint">
          {h.text}
        </p>
      ))}
      <CommerceWalletBalanceCard balance={balance} />
      <CommercePaymentActivityStrip activities={activity} />
    </div>
  );
});
