"use client";

import { useCallback, useEffect, useState } from "react";

import { fetchRelationalCart, type FetchRelationalCartResult } from "./fetch-relational-cart";

export type UseRelationalCartState =
  | { status: "idle" }
  | { status: "no_cart" }
  | { status: "loading" }
  | { status: "loaded"; result: Extract<FetchRelationalCartResult, { ok: true }>["data"] }
  | { status: "error"; message: string };

/**
 * Instruction 20.5A — client hook for relational cart API (no demo line fabrication).
 * Instruction 20.7 — exposes `refetch` after workflow mutations.
 */
export function useRelationalCart(opts: { cartId?: string; actingOrganizationId?: string; userId?: string }) {
  const [state, setState] = useState<UseRelationalCartState>({ status: "idle" });
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const cid = opts.cartId?.trim();
    const org = opts.actingOrganizationId?.trim();
    if (!cid) {
      setState({ status: "no_cart" });
      return;
    }
    if (!org) {
      setState({ status: "error", message: "actingOrganizationId requis pour charger le panier relationnel." });
      return;
    }
    let cancelled = false;
    setState({ status: "loading" });
    void fetchRelationalCart({ cartId: cid, actingOrganizationId: org, userId: opts.userId })
      .then((out) => {
        if (cancelled) return;
        if (out.ok) setState({ status: "loaded", result: out.data });
        else if (out.error === "invalid_payload") setState({ status: "error", message: "Réponse API non conforme au contrat (Zod)." });
        else setState({ status: "error", message: "Impossible de charger le panier relationnel." });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error", message: "Erreur réseau lors du chargement du panier." });
      });
    return () => {
      cancelled = true;
    };
  }, [opts.cartId, opts.actingOrganizationId, opts.userId, reloadToken]);

  const refetch = useCallback(() => {
    setReloadToken((t) => t + 1);
  }, []);

  return { state, refetch };
}
