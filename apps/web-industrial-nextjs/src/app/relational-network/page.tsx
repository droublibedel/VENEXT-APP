"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { LivingCatalogCard } from "@/product-intelligence/types";

import { CommercialIdentityCard } from "@/relational-commerce/components/CommercialIdentityCard";
import { PartnerCatalogSwitcher } from "@/relational-commerce/components/PartnerCatalogSwitcher";
import { PartnerSuggestionRail } from "@/relational-commerce/components/PartnerSuggestionRail";
import { RelationshipInbox } from "@/relational-commerce/components/RelationshipInbox";
import { SponsoredProductMarker } from "@/relational-commerce/components/SponsoredProductMarker";
import {
  DEMO_REL_ORG_RETAILER,
  DEMO_REL_ORG_WHOLESALER_B,
  DEMO_REL_USER_RETAILER,
  DEMO_REL_USER_WHOLESALER_B,
  DEMO_RELATIONSHIP_WA_R1,
  GRAPH_CACHE_KEY,
} from "@/relational-commerce/constants";
import { useSegmentedPartnerFeed } from "@/relational-commerce/hooks/useSegmentedPartnerFeed";
import { VenextInlineSkeleton } from "@/ux/VenextInlineSkeleton";

type Flags = Record<string, boolean>;

type GraphSnapshot = {
  partners?: unknown;
  traverse?: unknown;
  cachedAt?: string;
};

function ProductStrip({ card }: { card: LivingCatalogCard }) {
  return (
    <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 py-2 last:border-0">
      <div className="min-w-0">
        <p className="truncate text-sm text-white">{card.product.name}</p>
        <p className="text-[10px] text-slate-500">
          {card.supplier.displayName} · ID {card.supplier.commercialId}
        </p>
      </div>
      <p className="shrink-0 text-xs text-slate-400">
        {String(card.product.basePrice)} {card.product.currency}
      </p>
    </div>
  );
}

export default function RelationalNetworkPage() {
  const [orgFocus, setOrgFocus] = useState(DEMO_REL_ORG_RETAILER);
  const [supplierFilter, setSupplierFilter] = useState<string | null>(null);
  const [flags, setFlags] = useState<Flags | null>(null);
  const [graphSnap, setGraphSnap] = useState<GraphSnapshot | null>(null);
  const [graphErr, setGraphErr] = useState<string | null>(null);

  const relationshipId = DEMO_RELATIONSHIP_WA_R1;
  const viewerOrganizationId = DEMO_REL_ORG_RETAILER;

  const { data: feed, loading: feedLoading, error: feedError, reload: reloadFeed } = useSegmentedPartnerFeed(
    relationshipId,
    viewerOrganizationId,
    supplierFilter,
  );

  const loadGraph = useCallback(async () => {
    setGraphErr(null);
    try {
      const [p, t] = await Promise.all([
        fetch(`/api/core/v1/relational-commerce/graph/${orgFocus}/partners`),
        fetch(`/api/core/v1/relational-commerce/graph/${orgFocus}/traverse?maxDepth=2`),
      ]);
      if (!p.ok || !t.ok) throw new Error("graph_fetch");
      const partners = await p.json();
      const traverse = await t.json();
      const snap: GraphSnapshot = { partners, traverse, cachedAt: new Date().toISOString() };
      try {
        sessionStorage.setItem(GRAPH_CACHE_KEY, JSON.stringify(snap));
      } catch {
        /* quota / private mode */
      }
      setGraphSnap(snap);
    } catch {
      try {
        const raw = sessionStorage.getItem(GRAPH_CACHE_KEY);
        if (raw) setGraphSnap(JSON.parse(raw) as GraphSnapshot);
        else setGraphErr("Graphe indisponible (core hors ligne).");
      } catch {
        setGraphErr("Graphe indisponible.");
      }
    }
  }, [orgFocus]);

  useEffect(() => {
    void (async () => {
      const r = await fetch(`/api/core/v1/relational-commerce/flags/snapshot?organizationId=${orgFocus}`);
      if (r.ok) setFlags((await r.json()) as Flags);
    })();
  }, [orgFocus]);

  useEffect(() => {
    void loadGraph();
  }, [loadGraph]);

  const visibleSegments = useMemo(() => feed?.partnerSegments ?? [], [feed]);

  const principles = feed?.commercePrinciples;

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800/80 px-4 py-4">
        <div className="mx-auto flex max-w-6xl flex-col gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-emerald-300/90">
            Instruction 9 — réseau commercial fermé
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Relations & catalogues partenaires</h1>
          <p className="max-w-2xl text-xs text-slate-400">
            Visibilité par graphe validé — pas de marketplace ouvert, pas de comparaison de prix entre fournisseurs.
            Chaque catalogue reste identifiable.
          </p>
          <nav className="flex flex-wrap gap-2 text-[11px]">
            <a href="/product-intelligence" className="rounded border border-slate-800 px-2 py-1 text-slate-400 hover:border-cyan-500/40">
              Catalogue vivant
            </a>
            <Link href="/commerce-messaging" className="rounded border border-slate-800 px-2 py-1 text-slate-400 hover:border-cyan-500/40">
              Messagerie
            </Link>
            <a href="/wallet" className="rounded border border-slate-800 px-2 py-1 text-slate-400 hover:border-cyan-500/40">
              Wallet
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <section className="flex flex-wrap gap-3 text-xs">
          <span className="rounded border border-slate-800 px-2 py-1 text-slate-400">Organisation focus</span>
          <button
            type="button"
            onClick={() => setOrgFocus(DEMO_REL_ORG_RETAILER)}
            className={`rounded-full px-3 py-1 ${orgFocus === DEMO_REL_ORG_RETAILER ? "bg-emerald-900/50 text-white" : "border border-slate-700 text-slate-400"}`}
          >
            Détaillant (démo)
          </button>
          <button
            type="button"
            onClick={() => setOrgFocus(DEMO_REL_ORG_WHOLESALER_B)}
            className={`rounded-full px-3 py-1 ${orgFocus === DEMO_REL_ORG_WHOLESALER_B ? "bg-emerald-900/50 text-white" : "border border-slate-700 text-slate-400"}`}
          >
            Grossiste B
          </button>
        </section>

        {flags ? (
          <section className="rounded-lg border border-slate-800 bg-black/20 p-3 text-[11px] text-slate-400">
            <span className="font-semibold text-slate-300">Feature flags</span>
            <ul className="mt-2 grid gap-1 sm:grid-cols-2">
              {Object.entries(flags).map(([k, v]) => (
                <li key={k}>
                  {k}: <span className={v ? "text-emerald-400" : "text-rose-300"}>{v ? "on" : "off"}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-white">Boîte de réception</h2>
            <RelationshipInbox organizationId={orgFocus} />
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-white">Identité & code réseau</h2>
            <CommercialIdentityCard organizationId={orgFocus} />
          </section>
        </div>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-white">Suggestions (graphe + contacts)</h2>
          <PartnerSuggestionRail userId={DEMO_REL_USER_RETAILER} />
          <p className="text-[10px] text-slate-600">Rail parallèle pour grossiste B (contacts mutuels seed) :</p>
          <PartnerSuggestionRail userId={DEMO_REL_USER_WHOLESALER_B} />
        </section>

        <section className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/30 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-white">Graphe (cache session)</h2>
            <button
              type="button"
              onClick={() => void loadGraph()}
              className="rounded border border-slate-600 px-2 py-1 text-[11px] text-slate-300"
            >
              Rafraîchir
            </button>
          </div>
          {graphErr ? <p className="text-xs text-rose-300">{graphErr}</p> : null}
          {graphSnap?.cachedAt ? (
            <p className="text-[10px] text-slate-500">Dernière capture: {graphSnap.cachedAt}</p>
          ) : null}
          <pre className="max-h-48 overflow-auto rounded bg-black/40 p-2 text-[10px] text-slate-400">
            {graphSnap ? JSON.stringify(graphSnap, null, 0).slice(0, 2800) : "…"}
          </pre>
        </section>

        <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-white">Catalogue segmenté (Instruction 9 §8–9)</h2>
              {principles ? (
                <p className="mt-1 text-[10px] text-slate-500">
                  Fermé: {String(principles.closedNetwork)} · Pas de comparaison publique:{" "}
                  {String(principles.noPublicPriceComparison)}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => void reloadFeed()}
              className="rounded border border-slate-600 px-2 py-1 text-[11px]"
            >
              Recharger flux
            </button>
          </div>

          {feedLoading ? <VenextInlineSkeleton variant="catalog" className="py-2" /> : null}
          {feedError ? <p className="text-xs text-rose-300">{feedError}</p> : null}

          {feed ? (
            <>
              <PartnerCatalogSwitcher
                segments={visibleSegments}
                selectedSupplierId={supplierFilter}
                onSelect={(id) => setSupplierFilter(id)}
              />

              {visibleSegments.map((seg) => {
                if (supplierFilter && seg.supplierOrganizationId !== supplierFilter) return null;
                return (
                  <div key={seg.supplierOrganizationId} className="rounded-lg border border-emerald-900/40 bg-black/25 p-3">
                    <p className="text-xs font-semibold text-emerald-100/90">
                      Fournisseur: {seg.supplier?.displayName ?? seg.supplierOrganizationId}
                    </p>
                    <p className="text-[10px] text-slate-500">Segment isolé — pas de mélange invisible.</p>
                    <div className="mt-2">
                      {seg.cards.length ? seg.cards.map((c) => <ProductStrip key={c.visibilityId} card={c} />) : (
                        <p className="text-xs text-slate-500">Aucune carte dans ce segment.</p>
                      )}
                    </div>
                  </div>
                );
              })}

              {feed.sponsoredInRelationship.length ? (
                <div className="rounded-lg border border-amber-900/50 bg-amber-950/20 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <SponsoredProductMarker variant="in_relationship" />
                  </div>
                  {feed.sponsoredInRelationship.map((c) => (
                    <div key={c.visibilityId}>
                      <ProductStrip card={c} />
                    </div>
                  ))}
                </div>
              ) : null}

              {feed.sponsoredDiscoveryOutsideEdge.length ? (
                <div className="rounded-lg border border-amber-800/30 p-3">
                  <SponsoredProductMarker variant="discovery" />
                  <pre className="mt-2 max-h-40 overflow-auto text-[10px] text-slate-500">
                    {JSON.stringify(feed.sponsoredDiscoveryOutsideEdge, null, 2)}
                  </pre>
                </div>
              ) : null}
            </>
          ) : null}
        </section>
      </main>
    </div>
  );
}
