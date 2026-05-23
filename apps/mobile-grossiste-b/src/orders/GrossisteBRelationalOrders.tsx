import { lazy, memo, Suspense } from "react";
import type { CommercialContextRoutingInput } from "commercial-context-routing";
import "relational-order-orchestration/styles.css";

import { useGrossisteFeatureFlags } from "../hooks/useGrossisteFeatureFlags";
import { VenextScreenLoader } from "../ux/VenextScreenLoader";

const RelationalOrderOrchestrationShell = lazy(() =>
  import("relational-order-orchestration").then((m) => ({
    default: m.RelationalOrderOrchestrationShell,
  })),
);

export const GrossisteBRelationalOrders = memo(function GrossisteBRelationalOrders({
  enabled,
  contextRouting,
  focusOrderId,
}: {
  enabled: boolean;
  contextRouting?: CommercialContextRoutingInput;
  focusOrderId?: string | null;
}) {
  const { flags, hydrated } = useGrossisteFeatureFlags();
  const orchestrationOn =
    hydrated && flags.relational_order_orchestration_enabled !== false;

  if (!orchestrationOn) return null;

  return (
    <Suspense fallback={<VenextScreenLoader variant="orders" />}>
      <RelationalOrderOrchestrationShell
        actorRole="grossiste_b"
        enabled={enabled}
        contextRouting={contextRouting}
        focusOrderId={focusOrderId}
        flags={{
          relational_order_orchestration_enabled: flags.relational_order_orchestration_enabled,
          commercial_delivery_flow_enabled: flags.commercial_delivery_flow_enabled,
          commercial_settlement_flow_enabled: flags.commercial_settlement_flow_enabled,
          commerce_linked_context_enabled: flags.commerce_linked_context_enabled,
          commerce_linked_timeline_enabled: flags.commerce_linked_timeline_enabled,
        }}
      />
    </Suspense>
  );
});
