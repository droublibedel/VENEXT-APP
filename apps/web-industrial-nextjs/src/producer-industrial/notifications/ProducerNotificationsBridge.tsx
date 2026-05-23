"use client";

import { CommerceNotificationsShell } from "commerce-notifications";
import { useCommercialRouter } from "commercial-context-routing";

import { useIndustrialFeatureFlags } from "@/poles/hooks/useIndustrialFeatureFlags";
import { PRODUCER_FALLBACK_ORG_ID } from "../data/producer-industrial-fallback";

export function ProducerNotificationsBridge() {
  const { flags, hydrated } = useIndustrialFeatureFlags();
  const { router } = useCommercialRouter();
  return (
    <div style={{ position: "fixed", top: 12, right: 12, zIndex: 50 }}>
      <CommerceNotificationsShell
        actorRole="PRODUCER"
        organizationId={PRODUCER_FALLBACK_ORG_ID}
        flags={flags}
        flagsHydrated={hydrated}
        router={router ?? undefined}
        variant="bell"
      />
    </div>
  );
}
