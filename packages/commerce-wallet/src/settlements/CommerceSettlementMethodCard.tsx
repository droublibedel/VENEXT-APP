import { memo } from "react";

import type { CommerceSettlement } from "./commerce-settlement.types";
import { SETTLEMENT_METHOD_LABELS } from "./commerce-settlement.types";
import { CommerceSettlementStatusBadge } from "./CommerceSettlementStatusBadge";

export const CommerceSettlementMethodCard = memo(function CommerceSettlementMethodCard({
  settlement,
  testId = "cw-settlement-method-card",
}: {
  settlement: CommerceSettlement;
  testId?: string;
}) {
  return (
    <article className="cw-settlement-card" data-testid={testId}>
      <div className="cw-settlement-card-header">
        <strong>{SETTLEMENT_METHOD_LABELS[settlement.method]}</strong>
        <CommerceSettlementStatusBadge method={settlement.method} mode={settlement.mode} />
      </div>
      <p className="cw-settlement-amount" data-testid="cw-settlement-amount">
        {settlement.amountLabel}
      </p>
      {settlement.partnerName ? (
        <p className="cw-settlement-meta">
          {settlement.partnerName}
          {settlement.city ? ` · ${settlement.city}` : ""}
        </p>
      ) : null}
      {settlement.reference ? (
        <p className="cw-settlement-ref" data-testid="cw-settlement-reference">
          Réf. {settlement.reference}
        </p>
      ) : null}
      {settlement.terrainNote ? (
        <p className="cw-settlement-note">{settlement.terrainNote}</p>
      ) : null}
      {settlement.offPlatform ? (
        <p className="cw-settlement-offplatform" data-testid="cw-off-platform-notice">
          Suivi hors plateforme — paiement électronique non requis
        </p>
      ) : null}
    </article>
  );
});
