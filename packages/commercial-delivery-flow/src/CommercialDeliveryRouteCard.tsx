"use client";

import { memo, useMemo } from "react";

import { buildCommercialCorridorHints } from "./commercial-delivery-intelligence";
import type { CommercialDeliveryRoute } from "./commercial-delivery-flow.types";

function CommercialDeliveryRouteCardInner({ route }: { route: CommercialDeliveryRoute }) {
  const hints = useMemo(() => buildCommercialCorridorHints(route), [route]);

  return (
    <article className="cdf-card cdf-route-card" data-testid="cdf-route-card">
      <p className="cdf-card-kicker">Corridor / destination</p>
      <p className="cdf-card-title">
        {route.originCity} → {route.destinationCity}
      </p>
      <ul className="cdf-hints">
        {hints.map((h) => (
          <li key={h}>{h}</li>
        ))}
      </ul>
    </article>
  );
}

export const CommercialDeliveryRouteCard = memo(CommercialDeliveryRouteCardInner);
