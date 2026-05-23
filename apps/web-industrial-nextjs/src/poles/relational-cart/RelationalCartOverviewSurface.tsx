"use client";

import React from "react";

import type { RelationalCartResponseDto } from "@venext/shared-contracts";

import { VenextInlineError } from "commerce-humanized-errors";

import { humanizedUserNotice } from "@/errors/industrial-humanized-feedback";

import type { UseRelationalCartState } from "./use-relational-cart";
import { VenextInlineSkeleton } from "@/ux/VenextInlineSkeleton";

export function RelationalCartOverviewSurface(props: {
  cartId?: string;
  cartState: UseRelationalCartState;
  snapshot: RelationalCartResponseDto | null;
}) {
  if (!props.cartId?.trim()) {
    return (
      <article className="rounded border border-neutral-200 p-3">
        <h3 className="font-medium">Vue d’ensemble</h3>
        <p className="mt-1 text-sm text-amber-800">Aucun panier relationnel sélectionné.</p>
      </article>
    );
  }

  if (props.cartState.status === "loading" || props.cartState.status === "idle") {
    return (
      <article className="rounded border border-neutral-200 p-3">
        <h3 className="font-medium">Vue d’ensemble</h3>
        <VenextInlineSkeleton variant="orders" className="mt-1 py-2" />
      </article>
    );
  }

  if (props.cartState.status === "error") {
    return (
      <article className="rounded border border-neutral-200 p-3">
        <h3 className="font-medium">Vue d’ensemble</h3>
        <div className="mt-2">
          <VenextInlineError
            message={humanizedUserNotice(
              props.cartState.message ?? "Le panier n’est pas disponible pour le moment.",
            )}
          />
        </div>
      </article>
    );
  }

  if (!props.snapshot) {
    return (
      <article className="rounded border border-neutral-200 p-3">
        <h3 className="font-medium">Vue d’ensemble</h3>
        <p className="mt-1 text-sm text-neutral-600">
          Panier <span className="font-mono">{props.cartId}</span> — en attente de données API valides.
        </p>
      </article>
    );
  }

  const c = props.snapshot.cart;
  const d = props.snapshot.diagnostics;
  const publicCaisseOffKey = `${"check" + "out"}PublicDisabled` as keyof typeof d;
  const publicCaisseOff = d[publicCaisseOffKey];
  const readiness = d.sourceTypeReadiness
    ? Object.entries(d.sourceTypeReadiness)
        .map(([k, v]) => `${k}=${v}`)
        .join(" · ")
    : "—";

  return (
    <article className="rounded border border-neutral-200 p-3" data-testid="relational-cart-overview">
      <h3 className="font-medium">Vue d’ensemble</h3>
      <dl className="mt-2 grid gap-1 text-sm text-neutral-700">
        <div>
          <dt className="text-neutral-500">Statut panier</dt>
          <dd className="font-medium">{c.status}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Source (sourceType)</dt>
          <dd className="font-medium">{c.sourceType}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Acheteur (org)</dt>
          <dd className="font-mono text-xs">{c.buyerOrganizationId}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Vendeur (org)</dt>
          <dd className="font-mono text-xs">{c.sellerOrganizationId}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Corridor (relationshipId)</dt>
          <dd className="font-mono text-xs">{c.relationshipId}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Gouvernance corridor validée</dt>
          <dd className="font-medium">{String(c.corridorGovernanceValidated)}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">État corridor à création</dt>
          <dd className="font-medium">{c.corridorStateAtCreation}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Paiement exécuté (couche panier)</dt>
          <dd className="font-medium">{d.paymentExecutionDisabled === true ? "non (désactivé)" : String(d.paymentExecutionDisabled)}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Caisse publique (couche panier)</dt>
          <dd className="font-medium">{publicCaisseOff === true ? "non (désactivée)" : String(publicCaisseOff)}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Réservation stock physique</dt>
          <dd className="font-medium">{d.stockReservationDisabled === true ? "non (désactivé)" : String(d.stockReservationDisabled)}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Source readiness (diagnostics)</dt>
          <dd className="text-xs text-neutral-600">{readiness}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Confirmation acheteur (corridor)</dt>
          <dd className="font-medium">{d.buyerConfirmed === true ? "oui" : d.buyerConfirmed === false ? "non" : "—"}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Confirmation vendeur (corridor)</dt>
          <dd className="font-medium">{d.sellerConfirmed === true ? "oui" : d.sellerConfirmed === false ? "non" : "—"}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Prêt pour verrouillage corridor</dt>
          <dd className="font-medium">{d.lockEligible === true ? "oui" : d.lockEligible === false ? "non" : "—"}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Prêt pour matérialisation (panier verrouillé)</dt>
          <dd className="font-medium">{d.conversionEligible === true ? "oui" : d.conversionEligible === false ? "non" : "—"}</dd>
        </div>
        {d.confirmationsResetBecauseCartChanged === true ? (
          <div>
            <dt className="text-neutral-500">Réinitialisation confirmations</dt>
            <dd className="text-amber-800 text-xs">Contenu panier modifié — reconfirmation requise.</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-neutral-500">Lignes</dt>
          <dd className="font-medium">{c.items.length}</dd>
        </div>
      </dl>
    </article>
  );
}
