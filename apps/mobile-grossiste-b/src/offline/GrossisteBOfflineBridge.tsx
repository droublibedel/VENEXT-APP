import { CommerceOfflineShell } from "commerce-offline-foundation";

import { useGrossisteFeatureFlags } from "../hooks/useGrossisteFeatureFlags";
import { resolveGrossisteBOrganizationId } from "../session/resolveGrossisteBOrganizationId";

export function GrossisteBOfflineBridge() {
  const { flags, hydrated } = useGrossisteFeatureFlags();
  return (
    <CommerceOfflineShell
      organizationId={resolveGrossisteBOrganizationId()}
      actorRole="GROSSISTE_B"
      flags={flags}
      flagsHydrated={hydrated}
      showQueue={false}
      terrainMinimal
    />
  );
}
