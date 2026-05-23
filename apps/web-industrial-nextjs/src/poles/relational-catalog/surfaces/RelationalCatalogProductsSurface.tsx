"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import type { RelationalAccessibleProduct } from "@venext/shared-contracts";

import { humanizedUserNotice } from "@/errors/industrial-humanized-feedback";

import { postRelationalCartFromCatalog } from "../post-relational-cart-from-catalog";

export function RelationalCatalogProductsSurface(props: {
  products: RelationalAccessibleProduct[];
  viewerOrganizationId: string;
  directCatalogEnabled: boolean;
  actingUserId?: string;
}) {
  const rows = props.products.slice(0, 48);
  const [qtyByProduct, setQtyByProduct] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [lastCartId, setLastCartId] = useState<string | null>(null);

  const defaultQty = useCallback(
    (pid: string) => {
      const v = qtyByProduct[pid];
      return v !== undefined && v !== "" ? v : "1";
    },
    [qtyByProduct],
  );

  const canUseDirectCart = props.directCatalogEnabled;

  const addLine = useCallback(
    async (p: RelationalAccessibleProduct) => {
      const relId = p.cartEligibleRelationshipId;
      if (!relId || !canUseDirectCart) return;
      if (props.viewerOrganizationId === p.sourceOrganizationId) return;
      const qtyRaw = defaultQty(p.productId).trim();
      const qty = Number(qtyRaw);
      if (!Number.isFinite(qty) || qty <= 0) {
        setToast(humanizedUserNotice("Quantité invalide."));
        return;
      }
      if (!window.confirm(`Ajouter ${qtyRaw} ${p.unitLabel} au panier relationnel pour ce corridor ?`)) {
        return;
      }
      setBusyId(p.productId);
      setToast(null);
      const buyerOrganizationId = props.viewerOrganizationId;
      const sellerOrganizationId = p.sourceOrganizationId;
      const out = await postRelationalCartFromCatalog({
        actingOrganizationId: props.viewerOrganizationId,
        userId: props.actingUserId,
        body: {
          relationshipId: relId,
          buyerOrganizationId,
          sellerOrganizationId,
          productId: p.productId,
          catalogId: p.catalogId,
          quantity: qty,
          unit: p.unitLabel,
        },
      });
      setBusyId(null);
      if (!out.ok) {
        setToast(
          humanizedUserNotice(
            "L’ajout au panier n’a pas abouti pour le moment. Le panier relationnel reste inchangé.",
          ),
        );
        return;
      }
      setLastCartId(out.data.cart.id);
      setToast("Ajouté au panier relationnel.");
    },
    [canUseDirectCart, defaultQty, props.actingUserId, props.viewerOrganizationId],
  );

  const cartLink = useMemo(() => {
    if (!lastCartId) return null;
    return `/poles/relational-cart?cartId=${encodeURIComponent(lastCartId)}`;
  }, [lastCartId]);

  return (
    <section className="rounded border border-slate-800 bg-slate-950/70 p-3" data-testid="relational-catalog-products">
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">Articles accessibles (relationnel)</h3>
      <p className="mb-2 text-[9px] text-amber-200/85">
        Pas de catalogue public — pas de recherche globale — statuts indicatifs, pas inventaire temps réel.
      </p>
      {toast ? (
        <p className="mb-2 text-[10px] text-emerald-200/90" data-testid="relational-catalog-direct-cart-toast">
          {toast}{" "}
          {cartLink ? (
            <Link href={cartLink} className="ml-1 underline">
              Ouvrir le panier relationnel
            </Link>
          ) : null}
        </p>
      ) : null}
      <ul className="flex max-h-[320px] flex-col gap-1 overflow-auto pr-1">
        {rows.map((p) => (
          <li key={p.productId} className="rounded border border-slate-800/80 bg-black/35 px-2 py-1.5 text-[10px]">
            <p className="font-medium text-slate-200">{p.sourceOrganizationName}</p>
            <p className="font-mono text-[9px] text-slate-500">{p.productId}</p>
            <p className="text-slate-400">
              visibilité <span className="font-mono">{p.visibilityScope}</span> · distance{" "}
              <span className="font-mono">{p.relationshipDistance}</span>
              {p.sponsored ? <span className="ml-2 text-amber-200/90">sponsor contrôlé</span> : null}
            </p>
            <p className="mt-0.5 text-[9px] text-slate-500">{p.explanation}</p>
            {canUseDirectCart &&
            p.cartEligibleRelationshipId &&
            props.viewerOrganizationId !== p.sourceOrganizationId ? (
              <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-slate-800/60 pt-2">
                <label className="flex items-center gap-1 text-[9px] text-slate-400">
                  Qté
                  <input
                    className="w-14 rounded border border-slate-700 bg-slate-900 px-1 py-0.5 font-mono text-slate-200"
                    inputMode="decimal"
                    value={defaultQty(p.productId)}
                    onChange={(e) =>
                      setQtyByProduct((m) => ({
                        ...m,
                        [p.productId]: e.target.value,
                      }))
                    }
                  />
                </label>
                <span className="text-[9px] text-slate-500">
                  unité <span className="font-mono text-slate-300">{p.unitLabel}</span>
                </span>
                <button
                  type="button"
                  disabled={busyId === p.productId}
                  className="rounded border border-emerald-800/80 bg-emerald-950/40 px-2 py-1 text-[9px] font-medium text-emerald-100 hover:border-emerald-500/50 disabled:opacity-50"
                  data-testid="relational-catalog-add-to-relational-cart"
                  onClick={() => void addLine(p)}
                >
                  {busyId === p.productId ? "…" : "Ajouter au panier relationnel"}
                </button>
              </div>
            ) : canUseDirectCart ? (
              <p className="mt-2 text-[9px] text-slate-600">Ajout corridor : produit interne ou corridor non résolu.</p>
            ) : (
              <p className="mt-2 text-[9px] text-slate-600">Ajout catalogue relationnel désactivé par politique.</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
