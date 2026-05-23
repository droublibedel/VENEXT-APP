import { memo } from "react";

import { buildProfessionalActivityHints } from "./professional-commercial-network-intelligence";
import type { ProfessionalNetworkView } from "./professional-commercial-network.types";

export const ProfessionalPartnerActivityPanel = memo(function ProfessionalPartnerActivityPanel({
  view,
}: {
  view: ProfessionalNetworkView | null;
}) {
  const hints = buildProfessionalActivityHints(view);

  return (
    <section className="pcn-card" data-testid="pcn-activity-panel">
      <h3 style={{ margin: "0 0 8px", fontSize: 13 }}>Activité relation</h3>
      <p style={{ fontSize: 11, margin: "0 0 8px" }}>{view?.activitySummary ?? "—"}</p>
      {hints.map((h) => (
        <p key={h.id} className="pcn-hint" data-testid={`pcn-activity-hint-${h.id}`}>
          {h.text}
        </p>
      ))}
    </section>
  );
});
