import { CommerceOfflineShell } from "commerce-offline-foundation";

import { useDetaillantFeatureFlags } from "../hooks/useDetaillantFeatureFlags";
import { DETAILLANT_ORG_ID } from "../mocks/detaillant-mock-data";

export function DetaillantOfflineBridge() {
  const { flags, hydrated } = useDetaillantFeatureFlags();
  return (
    <CommerceOfflineShell
      organizationId={DETAILLANT_ORG_ID}
      actorRole="DETAILLANT"
      flags={flags}
      flagsHydrated={hydrated}
      showQueue
    />
  );
}
