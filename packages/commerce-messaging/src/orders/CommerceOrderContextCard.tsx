import { memo } from "react";

import type { CommerceOrderContext } from "../hooks/commerce-messaging.types";

export const CommerceOrderContextCard = memo(function CommerceOrderContextCard({
  context,
  testId = "cm-order-context",
}: {
  context: CommerceOrderContext | null;
  testId?: string;
}) {
  if (!context) return null;
  return (
    <article className="cm-context-card" data-testid={testId}>
      <p style={{ margin: 0, fontSize: 11, color: "#526059", textTransform: "uppercase" }}>Commande</p>
      <p style={{ margin: "6px 0 0", fontWeight: 700 }}>{context.partner}</p>
      <p style={{ margin: "6px 0 0", fontSize: 14, color: "#00a884" }}>{context.status}</p>
      <p style={{ margin: "4px 0 0", fontSize: 13 }}>Préparation : {context.preparation}</p>
      <p style={{ margin: "4px 0 0", fontSize: 13 }}>Livraison : {context.delivery}</p>
      {context.lateNote ? (
        <p style={{ margin: "6px 0 0", fontSize: 12, color: "#e8b84a" }}>{context.lateNote}</p>
      ) : null}
      <p style={{ margin: "8px 0 0", fontWeight: 700 }}>{context.amountLabel}</p>
    </article>
  );
});
