import { CommerceNotificationsShell } from "commerce-notifications";
import { useCommercialRouter } from "commercial-context-routing";

import { useGrossisteFeatureFlags } from "../hooks/useGrossisteFeatureFlags";
import { resolveGrossisteBOrganizationId } from "../session/resolveGrossisteBOrganizationId";

export function GrossisteBNotificationsBridge() {
  const { flags, hydrated } = useGrossisteFeatureFlags();
  const { router } = useCommercialRouter();
  return (
    <CommerceNotificationsShell
      actorRole="GROSSISTE_B"
      organizationId={resolveGrossisteBOrganizationId()}
      flags={flags}
      flagsHydrated={hydrated}
      router={router ?? undefined}
      variant="bell"
    />
  );
}
