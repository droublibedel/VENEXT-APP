import { CommerceNotificationsShell } from "commerce-notifications";
import { useCommercialRouter } from "commercial-context-routing";

import { useGrossisteAFeatureFlags } from "../hooks/useGrossisteAFeatureFlags";
import { GROSSISTE_A_ORG_ID } from "../mocks/grossiste-a-mock-data";

export function GrossisteANotificationsBridge() {
  const { flags, hydrated } = useGrossisteAFeatureFlags();
  const { router } = useCommercialRouter();
  return (
    <div style={{ position: "fixed", top: 12, right: 12, zIndex: 50 }}>
      <CommerceNotificationsShell
        actorRole="GROSSISTE_A"
        organizationId={GROSSISTE_A_ORG_ID}
        flags={flags}
        flagsHydrated={hydrated}
        router={router ?? undefined}
        variant="bell"
      />
    </div>
  );
}
