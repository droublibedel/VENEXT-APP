"use client";

import React from "react";

export function RelationalCartRealtimeStrip(props: { cartId?: string; relationshipId?: string }) {
  return (
    <aside className="rounded bg-neutral-50 p-2 text-xs text-neutral-700">
      Flux temps réel minimal — événements `relational.cart.*` sans prix détaillés ni données paiement.
      {props.cartId ? ` Panier ${props.cartId}.` : ""}
      {props.relationshipId ? ` Corridor ${props.relationshipId}.` : ""}
    </aside>
  );
}
