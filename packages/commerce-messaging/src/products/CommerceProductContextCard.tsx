import { memo } from "react";

import type { CommerceProductContext } from "../hooks/commerce-messaging.types";

export const CommerceProductContextCard = memo(function CommerceProductContextCard({
  context,
  testId = "cm-product-context",
}: {
  context: CommerceProductContext | null;
  testId?: string;
}) {
  if (!context) return null;
  return (
    <article className="cm-context-card" data-testid={testId}>
      <p style={{ margin: 0, fontSize: 11, color: "#8fa39a", textTransform: "uppercase" }}>Produit</p>
      <p style={{ margin: "6px 0 0", fontWeight: 700, fontSize: 15 }}>{context.name}</p>
      <p style={{ margin: "6px 0 0", fontSize: 13 }}>{context.availability}</p>
      <p style={{ margin: "4px 0 0", fontSize: 12, color: "#00a884" }}>
        {context.demand} · {context.networkStatus} · {context.city}
      </p>
      <p style={{ margin: "4px 0 0", fontSize: 11, color: "#6b8078" }}>{context.recentActivity}</p>
    </article>
  );
});
