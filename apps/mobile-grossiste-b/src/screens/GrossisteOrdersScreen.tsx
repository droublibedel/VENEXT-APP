import { memo, useMemo, useState } from "react";
import type { CommercialContextRoutingInput } from "commercial-context-routing";

import { GrossisteBRelationalOrders } from "../orders/GrossisteBRelationalOrders";
import { GrossisteDataSourceBadge } from "../components/GrossisteDataSourceBadge";
import { GrossisteScreenHeader } from "../components/GrossisteScreenHeader";
import { GrossisteVirtualList } from "../components/GrossisteVirtualList";
import type { GrossisteOrderRow, OrderStatus } from "../hooks/grossiste-b-data.types";
import { useGrossisteOrdersData } from "../hooks/useGrossisteOrdersData";

const STATUS_LABEL: Record<OrderStatus, string> = {
  preparation: "En préparation",
  validation: "À valider",
  delivery: "En livraison",
  done: "Terminée",
};

type Filter = "all" | "received" | "sent";

const OrderCard = memo(function OrderCard({ order }: { order: GrossisteOrderRow }) {
  return (
    <article className="grossiste-b-card" data-testid={`grossiste-order-${order.id}`}>
      <div style={{ display: "flex", gap: 10 }}>
        <div className="grossiste-b-timeline-dot" aria-hidden />
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{order.partner}</p>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#8fa39a" }}>
            {order.city} · {order.items} articles
          </p>
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "#00a884" }}>{STATUS_LABEL[order.status]}</p>
          <p style={{ margin: "4px 0 0", fontSize: 15, fontWeight: 700 }}>{order.amountLabel}</p>
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "#6b8078" }}>{order.updatedAt}</p>
          {order.late ? (
            <p style={{ margin: "6px 0 0", fontSize: 12, color: "#e8b84a" }}>Légèrement en retard</p>
          ) : null}
        </div>
      </div>
    </article>
  );
});

export const GrossisteOrdersScreen = memo(function GrossisteOrdersScreen({
  enabled,
  routingInput,
  focusReference,
}: {
  enabled: boolean;
  routingInput?: CommercialContextRoutingInput;
  focusReference?: { orderId?: string };
}) {
  const { data, loading, dataSource, fallbackUsed, refresh } = useGrossisteOrdersData(enabled);
  const [filter, setFilter] = useState<Filter>("all");

  const orders = useMemo(() => {
    const received = (data?.received ?? []).map((o) => ({ ...o, direction: "received" as const }));
    const sent = (data?.sent ?? []).map((o) => ({ ...o, direction: "sent" as const }));
    if (filter === "received") return received;
    if (filter === "sent") return sent;
    return [...received, ...sent];
  }, [data, filter]);

  return (
    <section data-testid="grossiste-screen-orders">
      <GrossisteScreenHeader title="Commandes" subtitle="Reçues et envoyées" onRefresh={refresh} refreshing={loading} />
      <GrossisteDataSourceBadge dataSource={dataSource} fallbackUsed={fallbackUsed} loading={loading} />

      <GrossisteBRelationalOrders
        enabled={enabled}
        contextRouting={routingInput}
        focusOrderId={focusReference?.orderId}
      />

      <div className="grossiste-b-filter-row" role="tablist" aria-label="Filtres commandes">
        {(
          [
            ["all", "Toutes"],
            ["received", "Reçues"],
            ["sent", "Envoyées"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`grossiste-b-chip${filter === id ? " grossiste-b-chip--active" : ""}`}
            onClick={() => setFilter(id)}
            data-testid={`grossiste-orders-filter-${id}`}
          >
            {label}
          </button>
        ))}
      </div>

      <GrossisteVirtualList
        items={orders}
        keyExtractor={(o) => o.id}
        testId="grossiste-orders-list"
        renderItem={(o) => <OrderCard order={o} />}
      />
    </section>
  );
});
