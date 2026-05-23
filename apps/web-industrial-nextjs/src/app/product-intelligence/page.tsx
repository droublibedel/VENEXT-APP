"use client";

import { useMemo, useState } from "react";

import { LivingCatalogGrid } from "@/product-intelligence/components/LivingCatalogGrid";
import { useLivingCatalog } from "@/product-intelligence/hooks/useLivingCatalog";
import { VenextInlineSkeleton } from "@/ux/VenextInlineSkeleton";

/** Demo relationship: wholesaler A → retailer 1 (seed). */
const DEFAULT_RELATIONSHIP = "41111111-1111-1111-1111-111111111003";
const DEFAULT_VIEWER = "31111111-1111-1111-1111-111111111201";

export default function ProductIntelligencePage() {
  const [relationshipId, setRelationshipId] = useState(DEFAULT_RELATIONSHIP);
  const [viewerOrganizationId, setViewerOrganizationId] = useState(DEFAULT_VIEWER);
  const [lowBandwidth, setLowBandwidth] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const { data, loading, error, reload } = useLivingCatalog(relationshipId, viewerOrganizationId);

  const nav = useMemo(
    () => [
      { href: "/product-intelligence", label: "Catalogue vivant" },
      { href: "/product-economy", label: "Économie produit" },
      { href: "/group-buying", label: "Co-achat" },
      { href: "/sponsored-visibility", label: "Sponsorisé" },
      { href: "/traceability", label: "Traçabilité" },
      { href: "/commerce-messaging", label: "Messagerie commerce" },
      { href: "/wallet", label: "Finance opérationnelle" },
      { href: "/relational-network", label: "Réseau relationnel" },
    ],
    [],
  );

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800/80 px-4 py-4">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-cyan-300/90">
              Instruction 6 — living commerce
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Catalogue relationnel intelligent</h1>
            <p className="mt-1 max-w-2xl text-xs text-slate-400">
              Produits comme entités économiques — tension, demande, visibilité contextuelle. Pas de
              marketplace ouvert.
            </p>
          </div>
          <nav className="flex flex-wrap gap-2 text-[11px]">
            {nav.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className="rounded border border-slate-800 px-2 py-1 text-slate-400 hover:border-cyan-500/40 hover:text-cyan-100"
              >
                {n.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-4 px-4 py-6">
        <div className="flex flex-wrap items-end gap-3 rounded-md border border-slate-800/80 bg-black/30 p-3 text-xs">
          <label className="flex flex-col gap-1 text-slate-400">
            relationshipId
            <input
              className="w-72 max-w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-slate-200"
              value={relationshipId}
              onChange={(e) => setRelationshipId(e.target.value.trim())}
            />
          </label>
          <label className="flex flex-col gap-1 text-slate-400">
            viewerOrganizationId
            <input
              className="w-72 max-w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-slate-200"
              value={viewerOrganizationId}
              onChange={(e) => setViewerOrganizationId(e.target.value.trim())}
            />
          </label>
          <button
            type="button"
            onClick={() => void reload()}
            className="rounded border border-cyan-500/40 px-3 py-1.5 text-cyan-100 hover:bg-cyan-500/10"
          >
            Recharger
          </button>
          <label className="flex items-center gap-2 text-slate-400">
            <input
              type="checkbox"
              checked={lowBandwidth}
              onChange={(e) => setLowBandwidth(e.target.checked)}
            />
            Faible bande passante
          </label>
          <label className="flex items-center gap-2 text-slate-400">
            <input
              type="checkbox"
              checked={reducedMotion}
              onChange={(e) => setReducedMotion(e.target.checked)}
            />
            Réduire animations
          </label>
        </div>

        {loading ? <VenextInlineSkeleton variant="pole" className="py-2" /> : null}
        {error ? (
          <p className="text-sm text-rose-300">
            Erreur API ({error}) — vérifier CORE_DOMAIN_URL et migration Instruction 6.
          </p>
        ) : null}
        {data ? (
          <>
            <p className="text-xs text-slate-500">
              Relation {data.relationshipId.slice(0, 8)}… · statut {data.relationshipStatus} ·{" "}
              {data.cards.length} SKU visibles
            </p>
            <LivingCatalogGrid
              cards={data.cards}
              lowBandwidth={lowBandwidth}
              reducedMotion={reducedMotion}
            />
          </>
        ) : null}
      </main>
    </div>
  );
}
