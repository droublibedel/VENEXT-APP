import { CommercialActivityFeedShell } from "commercial-activity-feed";
import { useCommercialRouter } from "commercial-context-routing";

import { useDetaillantFeatureFlags } from "../hooks/useDetaillantFeatureFlags";
import { resolveDetaillantOrganizationId } from "../session/resolveDetaillantOrganizationId";

export function DetaillantActivityFeedBridge() {
  const { flags, hydrated } = useDetaillantFeatureFlags();
  const { router } = useCommercialRouter();
  return (
    <CommercialActivityFeedShell
      actorRole="DETAILLANT"
      organizationId={resolveDetaillantOrganizationId()}
      flags={flags}
      flagsHydrated={hydrated}
      router={router ?? undefined}
      variant="mobile"
    />
  );
}
