"use client";

import React from "react";

import type { RelationalCartResponseDto } from "@venext/shared-contracts";

import { VenextInlineError } from "commerce-humanized-errors";

import { humanizedUserNotice } from "@/errors/industrial-humanized-feedback";

import type { UseRelationalCartState } from "./use-relational-cart";
import { VenextInlineSkeleton } from "@/ux/VenextInlineSkeleton";

export function RelationalCartItemsSurface(props: {
  cartId?: string;
  cartState: UseRelationalCartState;
  snapshot: RelationalCartResponseDto | null;
}) {
  if (!props.cartId?.trim()) {
    return (
      <article className="rounded border border-neutral-200 p-3">
        <h3 className="font-medium">Lignes de préparation</h3>
        <p className="mt-1 text-sm text-amber-800">Aucun panier relationnel sélectionné — pas de lignes affichées.</p>
      </article>
    );
  }

  if (props.cartState.status === "error") {
    return (
      <article className="rounded border border-neutral-200 p-3">
        <h3 className="font-medium">Lignes de préparation</h3>
        <div className="mt-2">
          <VenextInlineError
            message={humanizedUserNotice(
              props.cartState.message ?? "Les lignes ne sont pas disponibles pour le moment.",
            )}
          />
        </div>
      </article>
    );
  }

  if (props.cartState.status === "loading" || props.cartState.status === "idle") {
    return (
      <article className="rounded border border-neutral-200 p-3">
        <h3 className="font-medium">Lignes de préparation</h3>
        <VenextInlineSkeleton variant="orders" className="mt-1 py-2" />
      </article>
    );
  }

  if (!props.snapshot) {
    return (
      <article className="rounded border border-neutral-200 p-3">
        <h3 className="font-medium">Lignes de préparation</h3>
        <p className="mt-1 text-sm text-neutral-600">Réponse API non encore disponible.</p>
      </article>
    );
  }

  const items = props.snapshot.cart.items;
  if (items.length === 0) {
    return (
      <article className="rounded border border-neutral-200 p-3">
        <h3 className="font-medium">Lignes de préparation</h3>
        <p className="mt-1 text-sm text-neutral-600">Aucune ligne dans ce panier relationnel.</p>
      </article>
    );
  }

  return (
    <article className="rounded border border-neutral-200 p-3" data-testid="relational-cart-items">
      <h3 className="font-medium">Lignes de préparation</h3>
      <ul className="mt-2 space-y-2 text-sm">
        {items.map((it) => (
          <li key={it.id} className="rounded border border-neutral-100 p-2">
            <div className="font-mono text-xs text-neutral-500">{it.productId}</div>
            <div className="text-neutral-800">
              Qté {it.quantity} {it.unit} — validation {it.lineValidationStatus}
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}
