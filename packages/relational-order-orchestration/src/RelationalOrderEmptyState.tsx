"use client";

import { memo } from "react";

function RelationalOrderEmptyStateInner({
  message = "Aucune commande active dans votre réseau commercial.",
}: {
  message?: string;
}) {
  return (
    <div className="roo-empty" data-testid="roo-empty-state">
      <p className="roo-empty-title">Vos commandes relationnelles</p>
      <p className="roo-empty-text">{message}</p>
    </div>
  );
}

export const RelationalOrderEmptyState = memo(RelationalOrderEmptyStateInner);
