import { CommerceOfflineShell } from "commerce-offline-foundation";

import { useGrossisteAFeatureFlags } from "../hooks/useGrossisteAFeatureFlags";
import { GROSSISTE_A_ORG_ID } from "../mocks/grossiste-a-mock-data";

export function GrossisteAOfflineBridge() {
  const { flags, hydrated } = useGrossisteAFeatureFlags();
  return (
    <CommerceOfflineShell
      organizationId={GROSSISTE_A_ORG_ID}
      actorRole="GROSSISTE_A"
      flags={flags}
      flagsHydrated={hydrated}
    />
  );
}
