import { memo, useMemo } from "react";
import type { CommercialContextReference, CommercialContextRoutingInput } from "commercial-context-routing";

import { GrossisteARelationalOrders } from "../orders/GrossisteARelationalOrders";
import { GrossisteAVirtualList } from "../components/GrossisteAVirtualList";
import { GrossisteAWorkspaceFrame } from "../components/GrossisteAWorkspaceFrame";
import type { GrossisteAOrderRow } from "../hooks/grossiste-a-data.types";
import { useGrossisteAOrdersData } from "../hooks/useGrossisteAOrdersData";

const STATUS: Record<GrossisteAOrderRow["status"], string> = {
  validation: "À valider",
  preparation: "En préparation",
  livraison: "En livraison",
  retard: "Légèrement en retard",
};

export const GrossisteAOrdersWorkspace = memo(function GrossisteAOrdersWorkspace({
  enabled,
  routingInput,
  focusReference,
}: {
  enabled: boolean;
  routingInput?: CommercialContextRoutingInput;
  focusReference?: CommercialContextReference;
}) {
  const { data, loading, dataSource, fallbackUsed, refresh } = useGrossisteAOrdersData(enabled);
  const all = useMemo(
    () => [...(data?.enCours ?? []), ...(data?.recent ?? [])],
    [data],
  );

  return (
    <GrossisteAWorkspaceFrame
      title="Commandes"
      subtitle="Timeline claire et humaine"
      loading={loading}
      onRefresh={refresh}
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
      testId="ga-workspace-orders"
    >
      <GrossisteARelationalOrders
        enabled={enabled}
        contextRouting={routingInput}
        focusOrderId={focusReference?.orderId}
      />
      <GrossisteAVirtualList
        items={all}
        keyExtractor={(o) => o.id}
        testId="ga-orders-list"
        renderItem={(o) => (
          <article className="ga-card" data-testid={`ga-order-${o.id}`} style={{ display: "flex", gap: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#00a884", marginTop: 6 }} />
            <div>
              <strong>{o.partner}</strong>
              <p style={{ margin: "4px 0", fontSize: 13, color: "#8fa39a" }}>
                {o.city} · {STATUS[o.status]}
              </p>
              <p style={{ margin: 0, fontWeight: 700 }}>{o.amountLabel}</p>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6b8078" }}>{o.updatedAt}</p>
            </div>
          </article>
        )}
      />
    </GrossisteAWorkspaceFrame>
  );
});
