import { memo } from "react";

import type { CommercePartnerPayment } from "../hooks/commerce-wallet.types";

const STATUS_LABEL: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmé",
  settled: "Réglé",
  failed: "Échec",
};

export const CommercePartnerPaymentCard = memo(function CommercePartnerPaymentCard({
  payment,
  testId,
}: {
  payment: CommercePartnerPayment;
  testId?: string;
}) {
  return (
    <article
      className="cw-partner-card"
      data-testid={testId ?? `cw-partner-${payment.id}`}
    >
      <div className="cw-partner-row">
        <strong>{payment.partnerName}</strong>
        <span className="cw-partner-amount">{payment.amountLabel}</span>
      </div>
      <p className="cw-partner-meta">
        {payment.partnerRole} · {payment.city}
      </p>
      {payment.note ? <p className="cw-partner-note">{payment.note}</p> : null}
      <span className="cw-partner-status" data-testid={`cw-partner-status-${payment.id}`}>
        {STATUS_LABEL[payment.status] ?? payment.status}
      </span>
    </article>
  );
});
