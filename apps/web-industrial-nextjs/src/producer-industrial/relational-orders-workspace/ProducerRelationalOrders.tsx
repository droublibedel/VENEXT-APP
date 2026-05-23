"use client";

import { lazy, memo, Suspense } from "react";
import type { CommercialContextRoutingInput } from "commercial-context-routing";
import "relational-order-orchestration/styles.css";

import { useIndustrialFeatureFlags } from "../../poles/hooks/useIndustrialFeatureFlags";
import { useProducerCommercialRouting } from "../routing/ProducerCommercialRoutingContext";
import { VenextInlineSkeleton } from "@/ux/VenextInlineSkeleton";

const RelationalOrderOrchestrationShell = lazy(() =>
  import("relational-order-orchestration").then((m) => ({
    default: m.RelationalOrderOrchestrationShell,
  })),
);

export const ProducerRelationalOrders = memo(function ProducerRelationalOrders({
  enabled = true,
  contextRouting: contextRoutingProp,
}: {
  enabled?: boolean;
  contextRouting?: CommercialContextRoutingInput;
}) {
  const { routingInput: routingFromCtx } = useProducerCommercialRouting();
  const contextRouting = contextRoutingProp ?? routingFromCtx;
  const { flags, hydrated } = useIndustrialFeatureFlags();
  const orchestrationOn =
    hydrated && flags.relational_order_orchestration_enabled !== false;

  if (!orchestrationOn) return null;

  return (
    <Suspense fallback={<VenextInlineSkeleton />}>
      <RelationalOrderOrchestrationShell
        actorRole="producteur"
        enabled={enabled}
        contextRouting={contextRouting}
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
