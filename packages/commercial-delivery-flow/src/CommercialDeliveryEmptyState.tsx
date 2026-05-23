"use client";

import { memo } from "react";

function CommercialDeliveryEmptyStateInner({
  message = "Aucune livraison active dans votre activité commerciale.",
}: {
  message?: string;
}) {
  return (
    <div className="cdf-empty" data-testid="cdf-empty-state">
      <p className="cdf-empty-title">Livraisons relationnelles</p>
      <p className="cdf-empty-text">{message}</p>
    </div>
  );
}

export const CommercialDeliveryEmptyState = memo(CommercialDeliveryEmptyStateInner);
