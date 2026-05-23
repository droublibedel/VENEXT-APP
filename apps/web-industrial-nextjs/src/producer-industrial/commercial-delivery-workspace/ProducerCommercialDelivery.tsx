"use client";

import { lazy, memo, Suspense } from "react";
import "commercial-delivery-flow/styles.css";

import { useIndustrialFeatureFlags } from "../../poles/hooks/useIndustrialFeatureFlags";
import { VenextInlineSkeleton } from "@/ux/VenextInlineSkeleton";

const CommercialDeliveryFlowShell = lazy(() =>
  import("commercial-delivery-flow").then((m) => ({ default: m.CommercialDeliveryFlowShell })),
);

export const ProducerCommercialDelivery = memo(function ProducerCommercialDelivery({
  enabled = true,
}: {
  enabled?: boolean;
}) {
  const { flags, hydrated } = useIndustrialFeatureFlags();
  const on = hydrated && flags.commercial_delivery_flow_enabled !== false;

  if (!on) return null;

  return (
    <Suspense fallback={<VenextInlineSkeleton />}>
      <CommercialDeliveryFlowShell
        actorRole="producteur"
        enabled={enabled}
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
