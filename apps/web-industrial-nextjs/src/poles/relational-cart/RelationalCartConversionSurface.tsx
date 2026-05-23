"use client";

import React, { useState } from "react";

import { VenextInlineError } from "commerce-humanized-errors";

import {
  humanizedHttpFailure,
  humanizedNetworkFailure,
} from "@/errors/industrial-humanized-feedback";

import { postRelationalCartAction } from "./post-relational-cart-action";
import type { UseRelationalCartState } from "./use-relational-cart";

export function RelationalCartConversionSurface(props: {
  cartId?: string;
  actingOrganizationId?: string;
  userId?: string;
  cartState: UseRelationalCartState;
  refetch: () => void;
}) {
  const snap = props.cartState.status === "loaded" ? props.cartState.result : null;
  const loaded = snap !== null;
  const convReady = snap?.diagnostics.conversionEligible === true;
  const canShowAction = Boolean(props.cartId?.trim()) && loaded && convReady;
  const org = props.actingOrganizationId?.trim();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function convert() {
    const cid = props.cartId?.trim();
    if (!cid || !org) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await postRelationalCartAction({
        cartId: cid,
        subPath: "convert-to-order",
        actingOrganizationId: org,
        userId: props.userId,
        body: {},
      });
      if (!r.ok) {
        const j = (await r.json().catch(() => null)) as { message?: string; code?: string } | null;
        setErr(humanizedHttpFailure(r.status, j?.message ?? j?.code ?? ""));
        return;
      }
      props.refetch();
    } catch {
      setErr(humanizedNetworkFailure());
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="rounded border border-neutral-200 p-3">
      <h3 className="font-medium">Matérialisation vers commande relationnelle</h3>
      <p className="mt-1 text-sm text-neutral-600">
        Verrouillage corridor et confirmations partenaires requis avant matérialisation côté domaine — pas d’exécution
        paiement ici, pas de caisse publique, pas de parcours caisse en ligne grand public.
        {props.cartId ? ` Réf. panier ${props.cartId}.` : ""}
      </p>
      {props.cartState.status === "error" ? (
        <div className="mt-2">
          <VenextInlineError message="Le panier n’est pas disponible pour le moment. Réessayez dans un instant." />
        </div>
      ) : null}
      {err ? (
        <div className="mt-2">
          <VenextInlineError message={err} />
        </div>
      ) : null}
      <div className="mt-4">
        <button
          type="button"
          disabled={!canShowAction || busy}
          className="rounded border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm font-medium text-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
          data-testid="relational-cart-conversion-prep-button"
          onClick={() => void convert()}
        >
          Préparer la conversion en commande relationnelle
        </button>
        <p className="mt-2 text-xs text-neutral-500">
          Action réservée au flux corridor verrouillé — ne remplace pas une étape de paiement ou de facturation.
        </p>
      </div>
    </article>
  );
}
