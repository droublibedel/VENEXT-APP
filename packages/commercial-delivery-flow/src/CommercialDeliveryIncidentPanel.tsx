"use client";

import { memo } from "react";

import type { CommercialDelivery } from "./commercial-delivery-flow.types";

function CommercialDeliveryIncidentPanelInner({ delivery }: { delivery: CommercialDelivery }) {
  if (!delivery.incident && delivery.status !== "DELIVERY_INCIDENT") return null;

  const label = delivery.incident?.label ?? "Incident léger signalé";

  return (
    <section className="cdf-panel cdf-panel--incident" data-testid="cdf-incident-panel">
      <h4 className="cdf-panel-title">Incident léger</h4>
      <p className="cdf-panel-text">{label}</p>
      <p className="cdf-hint-inline">Pas de ticketing — continuez dans la conversation partenaire.</p>
    </section>
  );
}

export const CommercialDeliveryIncidentPanel = memo(CommercialDeliveryIncidentPanelInner);
