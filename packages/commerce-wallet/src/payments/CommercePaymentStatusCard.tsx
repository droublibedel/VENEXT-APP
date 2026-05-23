import { memo } from "react";

import { CommerceWalletGovernanceBadge } from "../governance/CommerceWalletGovernanceBadge";
import type { CommerceTransaction } from "../hooks/commerce-wallet.types";
import type { ResolvedWalletGovernance } from "../governance/commerce-wallet-governance.types";

const STATUS_LABEL: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmé",
  settled: "Réglé",
  failed: "Échec",
};

export const CommercePaymentStatusCard = memo(function CommercePaymentStatusCard({
  transaction,
  governance,
  testId = "cw-payment-status",
}: {
  transaction: CommerceTransaction | null;
  governance?: ResolvedWalletGovernance | null;
  testId?: string;
}) {
  if (!transaction) return null;
  return (
    <article className="cw-status-card" data-testid={testId}>
      <div className="cw-status-header">
        <h3 style={{ margin: 0, fontSize: 15 }}>Statut paiement</h3>
        {governance ? (
          <CommerceWalletGovernanceBadge mode={governance.mode} testId="cw-status-governance" />
        ) : null}
      </div>
      <p className="cw-status-amount" data-testid="cw-status-amount">
        {transaction.amountLabel}
      </p>
      <p className="cw-status-label">{transaction.label}</p>
      <p className="cw-status-meta" data-testid="cw-status-label">
        {STATUS_LABEL[transaction.status] ?? transaction.status}
        {transaction.orderId ? ` · Commande ${transaction.orderId}` : ""}
      </p>
      {governance?.notice ? (
        <p className="cw-status-notice" data-testid="cw-status-notice">
          {governance.notice}
        </p>
      ) : null}
    </article>
  );
});
