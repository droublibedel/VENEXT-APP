import { memo, useMemo } from "react";

import { buildProfessionalNetworkHints } from "./professional-commercial-network-intelligence";
import type { ProfessionalNetworkView } from "./professional-commercial-network.types";

export const ProfessionalPartnerInsightsPanel = memo(function ProfessionalPartnerInsightsPanel({
  view,
}: {
  view: ProfessionalNetworkView | null;
}) {
  const hints = useMemo(() => buildProfessionalNetworkHints(view), [view]);

  return (
    <section className="pcn-card" data-testid="pcn-insights-panel">
      <h3 style={{ margin: "0 0 8px", fontSize: 13 }}>Signaux discrets</h3>
      {hints.length === 0 ? (
        <p style={{ fontSize: 11, color: "#8a9bab" }}>Aucun signal particulier.</p>
      ) : (
        hints.map((h) => (
          <p key={h.id} className="pcn-hint" data-testid={`pcn-insight-${h.id}`}>
            {h.text}
          </p>
        ))
      )}
    </section>
  );
});
