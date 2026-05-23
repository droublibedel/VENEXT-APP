import { memo } from "react";

import type { ProfessionalTerritoryView } from "./professional-commercial-network.types";

export const ProfessionalPartnerTerritoryPanel = memo(function ProfessionalPartnerTerritoryPanel({
  territory,
}: {
  territory: ProfessionalTerritoryView;
}) {
  return (
    <section className="pcn-card" data-testid="pcn-territory-panel">
      <h3 style={{ margin: "0 0 8px", fontSize: 13 }}>Territoires & corridors</h3>
      <p style={{ fontSize: 11, color: "#93c5fd", margin: "0 0 10px" }}>{territory.stabilityNote}</p>
      <p style={{ fontSize: 10, color: "#8a9bab" }}>
        <strong>Villes :</strong> {territory.cities.join(" · ")}
      </p>
      <p style={{ fontSize: 10, color: "#8a9bab", marginTop: 8 }}>
        <strong>Corridors :</strong> {territory.corridors.join(" · ")}
      </p>
      <p style={{ fontSize: 10, color: "#8a9bab", marginTop: 8 }} data-testid="pcn-active-zones">
        <strong>Zones actives :</strong> {territory.activeZones.join(" · ")}
      </p>
    </section>
  );
});
