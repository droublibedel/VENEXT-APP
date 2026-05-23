"use client";

import React, { useState } from "react";

import { VenextInlineError } from "commerce-humanized-errors";

import {
  humanizedHttpFailure,
  humanizedNetworkFailure,
} from "@/errors/industrial-humanized-feedback";

import { useIndustrialFeatureFlags } from "../hooks/useIndustrialFeatureFlags";

import { postRelationalCartAction } from "./post-relational-cart-action";
import type { UseRelationalCartState } from "./use-relational-cart";

export function RelationalCartReviewSurface(props: {
  cartId?: string;
  actingOrganizationId?: string;
  userId?: string;
  cartState: UseRelationalCartState;
  refetch: () => void;
}) {
  const { flags, hydrated } = useIndustrialFeatureFlags();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const snap = props.cartState.status === "loaded" ? props.cartState.result : null;
  const loaded = snap !== null;
  const org = props.actingOrganizationId?.trim();
  const cid = props.cartId?.trim();

  const reviewDisabled = hydrated && flags.relational_cart_review_enabled === false;
  const dualDisabled = hydrated && flags.relational_cart_dual_confirmation_enabled === false;
  const lockDisabled = hydrated && flags.relational_cart_lock_enabled === false;

  const isBuyer = !!(snap && org && org === snap.cart.buyerOrganizationId);
  const isSeller = !!(snap && org && org === snap.cart.sellerOrganizationId);

  const d = snap?.diagnostics;
  const buyerOk = d?.buyerConfirmed === true;
  const sellerOk = d?.sellerConfirmed === true;
  const lockReady = d?.lockEligible === true;
  const convReady = d?.conversionEligible === true;

  async function run(subPath: Parameters<typeof postRelationalCartAction>[0]["subPath"], body?: unknown) {
    if (!cid || !org) return;
    setBusy(true);
    setError(null);
    try {
      const r = await postRelationalCartAction({
        cartId: cid,
        subPath,
        actingOrganizationId: org,
        userId: props.userId,
        body,
      });
      if (!r.ok) {
        const j = (await r.json().catch(() => null)) as { message?: string; code?: string } | null;
        const raw = j?.message ?? j?.code ?? "";
        setError(humanizedHttpFailure(r.status, raw));
        return;
      }
      props.refetch();
    } catch {
      setError(humanizedNetworkFailure());
    } finally {
      setBusy(false);
    }
  }

  if (!cid || !org) return null;
  if (!loaded || !snap) return null;

  return (
    <article className="rounded border border-neutral-200 p-3" data-testid="relational-cart-review-surface">
      <h3 className="font-medium">Revue & double confirmation corridor</h3>
      <p className="mt-1 text-sm text-neutral-600">
        Confirmation côté corridor — pas un paiement, pas une commande définitive tant que la conversion relationnelle
        n’est pas exécutée côté domaine.
      </p>
      <dl className="mt-3 grid gap-1 text-xs text-neutral-700">
        <div className="flex justify-between gap-2">
          <dt className="text-neutral-500">Acheteur confirmé</dt>
          <dd className="font-medium">{buyerOk ? "oui" : "non"}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-neutral-500">Vendeur confirmé</dt>
          <dd className="font-medium">{sellerOk ? "oui" : "non"}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-neutral-500">Prêt pour verrouillage</dt>
          <dd className="font-medium">{lockReady ? "oui" : "non"}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-neutral-500">Prêt pour matérialisation (panier verrouillé)</dt>
          <dd className="font-medium">{convReady ? "oui" : "non"}</dd>
        </div>
        {d?.confirmationsResetBecauseCartChanged ? (
          <p className="mt-1 text-amber-800" data-testid="relational-cart-confirmations-reset-banner">
            Confirmations réinitialisées — contenu panier modifié (corridor).
          </p>
        ) : null}
      </dl>

      {error ? (
        <div className="mt-2">
          <VenextInlineError message={error} />
        </div>
      ) : null}

      <div className="mt-4 flex flex-col gap-2">
        <button
          type="button"
          disabled={busy || reviewDisabled}
          className="rounded border border-neutral-300 bg-white px-3 py-2 text-sm disabled:opacity-50"
          data-testid="relational-cart-review-mark-reviewed"
          onClick={() => void run("review")}
        >
          Marquer comme relu (revue corridor)
        </button>

        <button
          type="button"
          disabled={busy || dualDisabled || !isBuyer}
          className="rounded border border-neutral-300 bg-white px-3 py-2 text-sm disabled:opacity-50"
          data-testid="relational-cart-confirm-buyer"
          onClick={() => void run("confirm-buyer")}
        >
          Confirmer côté acheteur
        </button>

        <button
          type="button"
          disabled={busy || dualDisabled || !isSeller}
          className="rounded border border-neutral-300 bg-white px-3 py-2 text-sm disabled:opacity-50"
          data-testid="relational-cart-confirm-seller"
          onClick={() => void run("confirm-seller")}
        >
          Confirmer côté vendeur
        </button>

        <button
          type="button"
          disabled={busy || lockDisabled || !lockReady}
          className="rounded border border-neutral-300 bg-white px-3 py-2 text-sm disabled:opacity-50"
          data-testid="relational-cart-lock-for-order"
          onClick={() => void run("lock")}
        >
          Verrouiller pour commande relationnelle
        </button>

        <label className="text-xs text-neutral-600">
          Motif rejet (optionnel)
          <input
            className="mt-1 w-full rounded border border-neutral-300 px-2 py-1 text-sm"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </label>
        <button
          type="button"
          disabled={busy || reviewDisabled}
          className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 disabled:opacity-50"
          data-testid="relational-cart-reject"
          onClick={() => void run("reject", { reason: rejectReason.trim() || undefined })}
        >
          Rejeter le panier relationnel
        </button>
      </div>
    </article>
  );
}
