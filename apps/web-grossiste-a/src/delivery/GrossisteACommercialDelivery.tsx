import { lazy, memo, Suspense } from "react";
import type { CommercialContextRoutingInput } from "commercial-context-routing";
import "commercial-delivery-flow/styles.css";

import { useGrossisteAFeatureFlags } from "../hooks/useGrossisteAFeatureFlags";
import { VenextWorkspaceLoader } from "../ux/VenextWorkspaceLoader";

const CommercialDeliveryFlowShell = lazy(() =>
  import("commercial-delivery-flow").then((m) => ({ default: m.CommercialDeliveryFlowShell })),
);

export const GrossisteACommercialDelivery = memo(function GrossisteACommercialDelivery({
  enabled,
  contextRouting,
}: {
  enabled: boolean;
  contextRouting?: CommercialContextRoutingInput;
}) {
  const { flags, hydrated } = useGrossisteAFeatureFlags();
  const on = hydrated && flags.commercial_delivery_flow_enabled !== false;

  if (!on) return null;

  return (
    <Suspense fallback={<VenextWorkspaceLoader variant="orders" />}>
      <CommercialDeliveryFlowShell
        actorRole="grossiste_a"
        enabled={enabled}
        contextRouting={contextRouting}
        flags={{
          commercial_delivery_flow_enabled: flags.commercial_delivery_flow_enabled,
          commercial_reception_confirmation_enabled: flags.commercial_reception_confirmation_enabled,
          commercial_delivery_activity_enabled: flags.commercial_delivery_activity_enabled,
          commerce_linked_context_enabled: flags.commerce_linked_context_enabled,
        }}
      />
    </Suspense>
  );
});
