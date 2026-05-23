import { memo } from "react";

import type { RelationalOrderLine } from "./relational-commerce-catalog.types";

export const RelationalOrderSummary = memo(function RelationalOrderSummary({
  lines,
}: {
  lines: RelationalOrderLine[];
}) {
  const totalItems = lines.reduce((s, l) => s + l.quantity, 0);
  return (
    <section className="rcc-order-summary" data-testid="rcc-order-summary">
      <p style={{ margin: 0, fontSize: 13 }}>
        Résumé : {totalItems} article{totalItems > 1 ? "s" : ""} · commerce relationnel
      </p>
    </section>
  );
});
