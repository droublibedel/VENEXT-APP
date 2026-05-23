import { CommerceNotificationsShell } from "commerce-notifications";
import { useCommercialRouter } from "commercial-context-routing";

import { useGrossisteFeatureFlags } from "../hooks/useGrossisteFeatureFlags";
import { GROSSISTE_B_ORG_ID } from "../mocks/grossiste-b-mock-data";

export function GrossisteBNotificationsBridge() {
  const { flags, hydrated } = useGrossisteFeatureFlags();
  const { router } = useCommercialRouter();
  return (
    <CommerceNotificationsShell
      actorRole="GROSSISTE_B"
      organizationId={GROSSISTE_B_ORG_ID}
      flags={flags}
      flagsHydrated={hydrated}
      router={router ?? undefined}
      variant="bell"
    />
  );
}
