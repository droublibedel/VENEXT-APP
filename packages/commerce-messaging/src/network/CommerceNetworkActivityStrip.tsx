import { memo } from "react";

import type { CommerceNetworkStrip } from "../hooks/commerce-messaging.types";

export const CommerceNetworkActivityStrip = memo(function CommerceNetworkActivityStrip({
  strip,
  testId = "cm-network-strip",
}: {
  strip: CommerceNetworkStrip | null;
  testId?: string;
}) {
  if (!strip) return null;
  return (
    <div className="cm-strip" data-testid={testId} aria-label="Activité réseau">
      {strip.corridor ? <span>Corridor : {strip.corridor}</span> : null}
      {strip.activeCity ? <span>Ville : {strip.activeCity}</span> : null}
      {strip.demandedProduct ? <span>Produit : {strip.demandedProduct}</span> : null}
      {strip.activePartner ? <span>Partenaire actif : {strip.activePartner}</span> : null}
    </div>
  );
});
