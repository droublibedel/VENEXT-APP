import { CommercialActivityFeedShell } from "commercial-activity-feed";
import { useCommercialRouter } from "commercial-context-routing";

import { useGrossisteFeatureFlags } from "../hooks/useGrossisteFeatureFlags";
import { resolveGrossisteBOrganizationId } from "../session/resolveGrossisteBOrganizationId";

export function GrossisteBActivityFeedBridge() {
  const { flags, hydrated } = useGrossisteFeatureFlags();
  const { router } = useCommercialRouter();
  return (
    <CommercialActivityFeedShell
      actorRole="GROSSISTE_B"
      organizationId={resolveGrossisteBOrganizationId()}
      flags={flags}
      flagsHydrated={hydrated}
      router={router ?? undefined}
      variant="mobile"
    />
  );
}
