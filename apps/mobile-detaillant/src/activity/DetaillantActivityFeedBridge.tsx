import { CommercialActivityFeedShell } from "commercial-activity-feed";
import { useCommercialRouter } from "commercial-context-routing";

import { useDetaillantFeatureFlags } from "../hooks/useDetaillantFeatureFlags";
import { DETAILLANT_ORG_ID } from "../mocks/detaillant-mock-data";

export function DetaillantActivityFeedBridge() {
  const { flags, hydrated } = useDetaillantFeatureFlags();
  const { router } = useCommercialRouter();
  return (
    <CommercialActivityFeedShell
      actorRole="DETAILLANT"
      organizationId={DETAILLANT_ORG_ID}
      flags={flags}
      flagsHydrated={hydrated}
      router={router ?? undefined}
      variant="mobile"
    />
  );
}
