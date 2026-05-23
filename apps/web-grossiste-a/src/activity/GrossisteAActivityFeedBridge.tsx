import { CommercialActivityFeedShell } from "commercial-activity-feed";
import { useCommercialRouter } from "commercial-context-routing";

import { useGrossisteAFeatureFlags } from "../hooks/useGrossisteAFeatureFlags";
import { GROSSISTE_A_ORG_ID } from "../mocks/grossiste-a-mock-data";

export function GrossisteAActivityFeedBridge() {
  const { flags, hydrated } = useGrossisteAFeatureFlags();
  const { router } = useCommercialRouter();
  return (
    <CommercialActivityFeedShell
      actorRole="GROSSISTE_A"
      organizationId={GROSSISTE_A_ORG_ID}
      flags={flags}
      flagsHydrated={hydrated}
      router={router ?? undefined}
    />
  );
}
