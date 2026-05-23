import { memo } from "react";

import type { CommerceWalletBalance } from "../hooks/commerce-wallet.types";

export const CommerceWalletBalanceCard = memo(function CommerceWalletBalanceCard({
  balance,
  testId = "cw-balance-card",
}: {
  balance: CommerceWalletBalance | null;
  testId?: string;
}) {
  if (!balance) return null;
  return (
    <article className="cw-balance-card" data-testid={testId}>
      <p className="cw-balance-label">Solde disponible</p>
      <p className="cw-balance-amount" data-testid="cw-balance-available">
        {balance.availableLabel}
      </p>
      <p className="cw-balance-pending" data-testid="cw-balance-pending">
        En attente : {balance.pendingLabel}
      </p>
      <p className="cw-balance-stability" data-testid="cw-balance-stability">
        {balance.stabilityNote} · {balance.city}
      </p>
    </article>
  );
});
