"use client";

import { memo } from "react";

import type { RelationalCommercialOrder } from "./relational-order-orchestration.types";

function RelationalOrderIncidentPanelInner({ order }: { order: RelationalCommercialOrder }) {
  if (!order.incident) return null;

  return (
    <section className="roo-panel roo-panel--incident" data-testid="roo-incident-panel">
      <h4 className="roo-panel-title">Incident léger</h4>
      <p className="roo-panel-text">{order.incident.label}</p>
      {order.incident.reportedAt ? (
        <p className="roo-card-meta">Signalé {order.incident.reportedAt}</p>
      ) : null}
      <p className="roo-hint-inline">Pas de ticketing — votre partenaire peut répondre dans la conversation.</p>
    </section>
  );
}

export const RelationalOrderIncidentPanel = memo(RelationalOrderIncidentPanelInner);
