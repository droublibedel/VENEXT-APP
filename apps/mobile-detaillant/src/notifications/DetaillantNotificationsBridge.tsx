import { CommerceNotificationsShell } from "commerce-notifications";
import { useCommercialRouter } from "commercial-context-routing";

import { useDetaillantFeatureFlags } from "../hooks/useDetaillantFeatureFlags";
import { DETAILLANT_ORG_ID } from "../mocks/detaillant-mock-data";

export function DetaillantNotificationsBridge() {
  const { flags, hydrated } = useDetaillantFeatureFlags();
  const { router } = useCommercialRouter();
  return (
    <CommerceNotificationsShell
      actorRole="DETAILLANT"
      organizationId={DETAILLANT_ORG_ID}
      flags={flags}
      flagsHydrated={hydrated}
      router={router ?? undefined}
      variant="bell"
    />
  );
}
