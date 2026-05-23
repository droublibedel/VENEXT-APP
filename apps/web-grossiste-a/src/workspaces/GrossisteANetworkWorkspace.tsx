import { lazy, memo, Suspense } from "react";
import type { CommercialContextRoutingInput } from "commercial-context-routing";

import { useGrossisteAFeatureFlags } from "../hooks/useGrossisteAFeatureFlags";
import { VenextWorkspaceLoader } from "../ux/VenextWorkspaceLoader";

const GrossisteAProfessionalNetworkWorkspace = lazy(() =>
  import("./network/GrossisteAProfessionalNetworkWorkspace").then((m) => ({
    default: m.GrossisteAProfessionalNetworkWorkspace,
  })),
);

export const GrossisteANetworkWorkspace = memo(function GrossisteANetworkWorkspace({
  enabled,
  routingInput,
}: {
  enabled: boolean;
  routingInput?: CommercialContextRoutingInput;
}) {
  const { flags, hydrated } = useGrossisteAFeatureFlags();
  const pcnOn =
    hydrated &&
    flags.professional_commercial_network_enabled !== false &&
    flags.grossiste_a_partner_network_enabled !== false;

  if (!pcnOn) {
    return (
      <section data-testid="ga-workspace-network-legacy">
        <p style={{ padding: 16, color: "#8a9bab" }}>Réseau commercial — activez le module professionnel.</p>
      </section>
    );
  }

  return (
    <Suspense fallback={<VenextWorkspaceLoader variant="dashboard" />}>
      <GrossisteAProfessionalNetworkWorkspace enabled={enabled} routingInput={routingInput} />
    </Suspense>
  );
});
