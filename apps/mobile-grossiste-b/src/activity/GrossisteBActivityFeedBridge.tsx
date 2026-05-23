import { CommercialActivityFeedShell } from "commercial-activity-feed";
import { useCommercialRouter } from "commercial-context-routing";

import { useGrossisteFeatureFlags } from "../hooks/useGrossisteFeatureFlags";
import { GROSSISTE_B_ORG_ID } from "../mocks/grossiste-b-mock-data";

export function GrossisteBActivityFeedBridge() {
  const { flags, hydrated } = useGrossisteFeatureFlags();
  const { router } = useCommercialRouter();
  return (
    <CommercialActivityFeedShell
      actorRole="GROSSISTE_B"
      organizationId={GROSSISTE_B_ORG_ID}
      flags={flags}
      flagsHydrated={hydrated}
      router={router ?? undefined}
      variant="mobile"
    />
  );
}
