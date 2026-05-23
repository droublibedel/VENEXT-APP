"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo } from "react";

import { VenextInlineSkeleton } from "@/ux/VenextInlineSkeleton";
import {
  DEMO_ACTOR,
  DEMO_NEGOTIATION_RAW,
  DEMO_PRODUCT_RAW,
  DEMO_SELLER_ORG,
  DEMO_THREADS,
  venextActorHeaders,
} from "@/commerce-messaging/constants";

function HubInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const productId = sp.get("productId");
  const intent = sp.get("intent") ?? "discuss";

  useEffect(() => {
    if (!productId) return;
    let cancelled = false;
    void (async () => {
      const r = await fetch("/api/core/v1/commerce-messaging/threads/from-product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...venextActorHeaders(DEMO_ACTOR),
        },
        body: JSON.stringify({
          productId,
          negotiationId: DEMO_NEGOTIATION_RAW,
        }),
      });
      if (!r.ok || cancelled) return;
      const th = (await r.json()) as { id: string };
      router.replace(`/commerce-messaging/${th.id}?intent=${encodeURIComponent(intent)}`);
    })();
    return () => {
      cancelled = true;
    };
  }, [productId, intent, router]);

  const links = useMemo(
    () => [
      { id: DEMO_THREADS.negotiationRaw, label: "Négociation matière (actif)", hint: "NEGOTIATION_CONTEXT" },
      { id: DEMO_THREADS.delivery, label: "Livraison commande amont", hint: "DELIVERY_CONTEXT" },
      { id: DEMO_THREADS.rejectedSponsor, label: "Sponsoring refusé", hint: "REJECTION_EVENT" },
      { id: DEMO_THREADS.cartConverted, label: "Panier converti", hint: "CART_CONVERSION_EVENT" },
      { id: DEMO_THREADS.paymentProof, label: "Preuve paiement", hint: "PAYMENT_CONTEXT" },
    ],
    [],
  );

  return (
    <div className="min-h-dvh bg-slate-950 px-4 py-6 text-slate-100">
      <div className="mx-auto max-w-3xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-cyan-300/90">
          Instruction 7 — messagerie commerce
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Fils contextuels</h1>
        <p className="mt-2 text-sm text-slate-400">
          Chaque conversation reste ancrée produit, commande, livraison ou paiement — pas un clone de chat
          grand public.
        </p>
        {productId ? (
          <p className="mt-4 rounded border border-cyan-800/50 bg-cyan-950/30 px-3 py-2 text-xs text-cyan-100/90">
            Ouverture fil pour produit <span className="font-mono">{productId}</span>… redirection.
          </p>
        ) : null}
        <ul className="mt-6 space-y-2">
          {links.map((l) => (
            <li key={l.id}>
              <Link
                href={`/commerce-messaging/${l.id}`}
                className="flex flex-col rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-3 hover:border-cyan-600/40"
              >
                <span className="text-sm font-medium text-slate-50">{l.label}</span>
                <span className="text-[10px] text-slate-500">{l.hint}</span>
                <span className="mt-1 font-mono text-[10px] text-slate-600">{l.id}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-[11px] text-slate-500">
          Entrée catalogue : depuis un produit (ex.{" "}
          <Link
            className="text-cyan-400 hover:underline"
            href={`/commerce-messaging?productId=${DEMO_PRODUCT_RAW}&sellerOrganizationId=${DEMO_SELLER_ORG}`}
          >
            matière première démo
          </Link>
          ).
        </p>
        <nav className="mt-8 flex flex-wrap gap-2 text-[11px]">
          <Link className="text-cyan-400 hover:underline" href="/product-context">
            Contexte produit
          </Link>
          <span className="text-slate-700">·</span>
          <Link className="text-cyan-400 hover:underline" href="/negotiation-engine">
            Moteur négociation
          </Link>
          <span className="text-slate-700">·</span>
          <Link className="text-cyan-400 hover:underline" href="/conversation-actions">
            Actions
          </Link>
          <span className="text-slate-700">·</span>
          <Link className="text-cyan-400 hover:underline" href="/voice-commerce">
            Voix
          </Link>
          <span className="text-slate-700">·</span>
          <Link className="text-cyan-400 hover:underline" href="/offline-messaging">
            Hors-ligne
          </Link>
          <span className="text-slate-700">·</span>
          <Link className="text-amber-300/90 hover:underline" href="/sponsored-discovery">
            Découverte sponsorisée (20.2)
          </Link>
        </nav>
      </div>
    </div>
  );
}

export default function CommerceMessagingHubPage() {
  return (
    <Suspense
      fallback={<VenextInlineSkeleton variant="messaging" className="p-8" />}
    >
      <HubInner />
    </Suspense>
  );
}
