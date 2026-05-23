import { CommerceOfflineShell } from "commerce-offline-foundation";

import { PRODUCER_FALLBACK_ORG_ID } from "../data/producer-industrial-fallback";
import { useIndustrialFeatureFlags } from "../../poles/hooks/useIndustrialFeatureFlags";

export function ProducerOfflineBridge() {
  const { flags, hydrated } = useIndustrialFeatureFlags();
  return (
    <CommerceOfflineShell
      organizationId={PRODUCER_FALLBACK_ORG_ID}
      actorRole="PRODUCER"
      flags={flags}
      flagsHydrated={hydrated}
    />
  );
}
