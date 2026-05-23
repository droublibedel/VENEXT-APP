import { CommerceOfflineShell } from "commerce-offline-foundation";

import { useGrossisteFeatureFlags } from "../hooks/useGrossisteFeatureFlags";
import { GROSSISTE_B_ORG_ID } from "../mocks/grossiste-b-mock-data";

export function GrossisteBOfflineBridge() {
  const { flags, hydrated } = useGrossisteFeatureFlags();
  return (
    <CommerceOfflineShell
      organizationId={GROSSISTE_B_ORG_ID}
      actorRole="GROSSISTE_B"
      flags={flags}
      flagsHydrated={hydrated}
      showQueue
    />
  );
}
