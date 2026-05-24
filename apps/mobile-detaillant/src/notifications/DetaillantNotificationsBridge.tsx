import { CommerceNotificationsShell } from "commerce-notifications";
import { useCommercialRouter } from "commercial-context-routing";

import { useDetaillantFeatureFlags } from "../hooks/useDetaillantFeatureFlags";
import { resolveDetaillantOrganizationId } from "../session/resolveDetaillantOrganizationId";

export function DetaillantNotificationsBridge() {
  const { flags, hydrated } = useDetaillantFeatureFlags();
  const { router } = useCommercialRouter();
  return (
    <CommerceNotificationsShell
      actorRole="DETAILLANT"
      organizationId={resolveDetaillantOrganizationId()}
      flags={flags}
      flagsHydrated={hydrated}
      router={router ?? undefined}
      variant="bell"
    />
  );
}
