import { CommerceOfflineShell } from "commerce-offline-foundation";

import { useDetaillantFeatureFlags } from "../hooks/useDetaillantFeatureFlags";
import { resolveDetaillantOrganizationId } from "../session/resolveDetaillantOrganizationId";

export function DetaillantOfflineBridge() {
  const { flags, hydrated } = useDetaillantFeatureFlags();
  return (
    <CommerceOfflineShell
      organizationId={resolveDetaillantOrganizationId()}
      actorRole="DETAILLANT"
      flags={flags}
      flagsHydrated={hydrated}
      showQueue
    />
  );
}
