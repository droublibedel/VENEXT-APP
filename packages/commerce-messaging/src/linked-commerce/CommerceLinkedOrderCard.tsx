import { memo } from "react";

import type { CommerceOrderContext } from "../hooks/commerce-messaging.types";

export const CommerceLinkedOrderCard = memo(function CommerceLinkedOrderCard({
  order,
  compact,
  testId = "cm-linked-order-card",
}: {
  order: CommerceOrderContext;
  compact?: boolean;
  testId?: string;
}) {
  return (
    <article
      className={`cm-linked-card${compact ? " cm-linked-card--compact" : ""}`}
      data-testid={testId}
    >
      <p className="cm-linked-kicker">Commande liée</p>
      <p className="cm-linked-title">{order.partner}</p>
      <p className="cm-linked-status">{order.status}</p>
      {!compact ? (
        <>
          <p className="cm-linked-meta">Préparation : {order.preparation}</p>
          <p className="cm-linked-meta">Livraison : {order.delivery}</p>
          {order.lateNote ? <p className="cm-linked-warn">{order.lateNote}</p> : null}
        </>
      ) : null}
      <p className="cm-linked-amount">{order.amountLabel}</p>
    </article>
  );
});
