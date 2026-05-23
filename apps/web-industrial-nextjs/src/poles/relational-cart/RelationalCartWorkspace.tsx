"use client";

import React from "react";

import { RelationalCartConversionSurface } from "./RelationalCartConversionSurface";
import { RelationalCartGovernanceSurface } from "./RelationalCartGovernanceSurface";
import { RelationalCartItemsSurface } from "./RelationalCartItemsSurface";
import { RelationalCartOverviewSurface } from "./RelationalCartOverviewSurface";
import { RelationalCartRealtimeStrip } from "./RelationalCartRealtimeStrip";
import { RelationalCartReviewSurface } from "./RelationalCartReviewSurface";
import { useRelationalCart } from "./use-relational-cart";

export type RelationalCartWorkspaceProps = {
  cartId?: string;
  relationshipId?: string;
  /** When unset, falls back to `NEXT_PUBLIC_RELATIONAL_CART_ACTING_ORG_ID` for demo loads. */
  actingOrganizationId?: string;
  userId?: string;
};

/** Instruction 20.5 — relational preparation workspace (not marketplace, not public caisse). */
export function RelationalCartWorkspace(props: RelationalCartWorkspaceProps) {
  const acting =
    props.actingOrganizationId?.trim() ||
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_RELATIONAL_CART_ACTING_ORG_ID?.trim()) ||
    "";
  const userId =
    props.userId?.trim() ||
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_RELATIONAL_CART_USER_ID?.trim()) ||
    undefined;
  const { state: cartState, refetch } = useRelationalCart({
    cartId: props.cartId,
    actingOrganizationId: acting || undefined,
    userId,
  });

  const snapshot = cartState.status === "loaded" ? cartState.result : null;

  return (
    <section data-pole="relational-cart" className="flex flex-col gap-4 p-4">
      <header>
        <h2 className="text-lg font-semibold">Préparation de commande relationnelle</h2>
        <p className="text-sm text-neutral-600">
          Panier relationnel privé — revue partenaire, validation corridor, conversion contrôlée vers commande
          relationnelle — sans caisse publique, sans parcours caisse grand public, sans exécution paiement.
        </p>
        {!props.cartId?.trim() ? (
          <p className="mt-2 text-sm text-amber-800" data-testid="relational-cart-no-selection-banner">
            Aucun panier relationnel sélectionné.
          </p>
        ) : null}
      </header>
      <RelationalCartRealtimeStrip cartId={props.cartId} relationshipId={props.relationshipId} />
      <div className="grid gap-4 md:grid-cols-2">
        <RelationalCartOverviewSurface cartId={props.cartId} cartState={cartState} snapshot={snapshot} />
        <RelationalCartGovernanceSurface
          relationshipId={props.relationshipId ?? snapshot?.cart.relationshipId}
          sourceReadiness={snapshot?.diagnostics.sourceTypeReadiness ?? null}
        />
      </div>
      <RelationalCartItemsSurface cartId={props.cartId} cartState={cartState} snapshot={snapshot} />
      <RelationalCartReviewSurface
        cartId={props.cartId}
        actingOrganizationId={acting || undefined}
        userId={userId}
        cartState={cartState}
        refetch={refetch}
      />
      <RelationalCartConversionSurface
        cartId={props.cartId}
        actingOrganizationId={acting || undefined}
        userId={userId}
        cartState={cartState}
        refetch={refetch}
      />
    </section>
  );
}
