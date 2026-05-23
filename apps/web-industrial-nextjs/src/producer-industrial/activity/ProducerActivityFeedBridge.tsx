import { CommercialActivityFeedShell } from "commercial-activity-feed";
import { useCommercialRouter } from "commercial-context-routing";

import { useIndustrialFeatureFlags } from "../../poles/hooks/useIndustrialFeatureFlags";
import { PRODUCER_FALLBACK_ORG_ID } from "../data/producer-industrial-fallback";

export function ProducerActivityFeedBridge() {
  const { flags, hydrated } = useIndustrialFeatureFlags();
  const { router } = useCommercialRouter();
  return (
    <CommercialActivityFeedShell
      actorRole="PRODUCER"
      organizationId={PRODUCER_FALLBACK_ORG_ID}
      flags={flags}
      flagsHydrated={hydrated}
      router={router ?? undefined}
    />
  );
}
