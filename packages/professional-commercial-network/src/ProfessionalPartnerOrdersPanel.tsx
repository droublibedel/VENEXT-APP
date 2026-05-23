import { memo } from "react";

import type { ProfessionalLinkedOrder } from "./professional-commercial-network.types";

export const ProfessionalPartnerOrdersPanel = memo(function ProfessionalPartnerOrdersPanel({
  orders,
}: {
  orders: ProfessionalLinkedOrder[];
}) {
  return (
    <section className="pcn-card" data-testid="pcn-orders-panel">
      <h3 style={{ margin: "0 0 8px", fontSize: 13 }}>Commandes liées</h3>
      {orders.length === 0 ? (
        <p style={{ fontSize: 11, color: "#8a9bab" }}>Aucune commande liée.</p>
      ) : (
        <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
          {orders.map((o) => (
            <li key={o.id} className="pcn-hint" data-testid={`pcn-order-${o.id}`}>
              <strong>{o.reference}</strong> — {o.status} · {o.amountLabel}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
});
