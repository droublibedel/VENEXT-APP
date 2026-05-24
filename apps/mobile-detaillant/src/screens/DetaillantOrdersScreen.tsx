import { memo, useMemo, useState } from "react";
import type { CommercialContextReference, CommercialContextRoutingInput } from "commercial-context-routing";

import { DetaillantCommercialDelivery } from "../delivery/DetaillantCommercialDelivery";
import { DetaillantRelationalOrders } from "../orders/DetaillantRelationalOrders";
import { DetaillantDataSourceBadge } from "../components/DetaillantDataSourceBadge";
import { DetaillantScreenHeader } from "../components/DetaillantScreenHeader";
import { DetaillantVirtualList } from "../components/DetaillantVirtualList";
import type { DetaillantOrderRow, OrderStatus } from "../hooks/detaillant-data.types";
import { useDetaillantOrdersData } from "../hooks/useDetaillantOrdersData";

const STATUS_LABEL: Record<OrderStatus, string> = {
  "en-cours": "En cours",
  recue: "Reçue",
  livraison: "En livraison",
  terminee: "Terminée",
};

type Filter = "all" | "en-cours" | "recues" | "terminees";

const OrderCard = memo(function OrderCard({ order }: { order: DetaillantOrderRow }) {
  return (
    <article className="detaillant-card" data-testid={`detaillant-order-${order.id}`}>
      <div style={{ display: "flex", gap: 12 }}>
        <div className="detaillant-timeline-dot" aria-hidden />
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>{order.partner}</p>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--venext-text-muted)" }}>
            {order.city} · {order.items} articles
          </p>
          <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--venext-accent)" }}>{STATUS_LABEL[order.status]}</p>
          <p style={{ margin: "6px 0 0", fontSize: 16, fontWeight: 800 }}>{order.amountLabel}</p>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--venext-text-muted)" }}>{order.updatedAt}</p>
        </div>
      </div>
    </article>
  );
});

export const DetaillantOrdersScreen = memo(function DetaillantOrdersScreen({
  enabled,
  routingInput,
  focusReference,
}: {
  enabled: boolean;
  routingInput?: CommercialContextRoutingInput;
  focusReference?: CommercialContextReference;
}) {
  const { data, loading, dataSource, fallbackUsed, refresh } = useDetaillantOrdersData(enabled);
  const [filter, setFilter] = useState<Filter>("all");

  const orders = useMemo(() => {
    if (filter === "en-cours") return data?.enCours ?? [];
    if (filter === "recues") return data?.recues ?? [];
    if (filter === "terminees") return data?.terminees ?? [];
    return [...(data?.enCours ?? []), ...(data?.recues ?? []), ...(data?.terminees ?? [])];
  }, [data, filter]);

  return (
    <section data-testid="detaillant-screen-orders">
      <DetaillantScreenHeader title="Commandes" subtitle="Simple et clair" onRefresh={refresh} refreshing={loading} />
      <DetaillantDataSourceBadge dataSource={dataSource} fallbackUsed={fallbackUsed} loading={loading} />

      <DetaillantRelationalOrders
        enabled={enabled}
        contextRouting={routingInput}
        focusOrderId={focusReference?.orderId}
      />
      <DetaillantCommercialDelivery enabled={enabled} contextRouting={routingInput} />

      <div className="detaillant-chip-row" role="tablist" aria-label="Filtres commandes">
        {(
          [
            ["all", "Toutes"],
            ["en-cours", "En cours"],
            ["recues", "Reçues"],
            ["terminees", "Terminées"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`detaillant-chip${filter === id ? " detaillant-chip--active" : ""}`}
            onClick={() => setFilter(id)}
            data-testid={`detaillant-orders-filter-${id}`}
          >
            {label}
          </button>
        ))}
      </div>

      <DetaillantVirtualList
        items={orders}
        keyExtractor={(o) => o.id}
        testId="detaillant-orders-list"
        renderItem={(o) => <OrderCard order={o} />}
      />
    </section>
  );
});
