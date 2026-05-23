"use client";

import Link from "next/link";

import type { CommercialTemperature, LivingCatalogCard } from "../types";
import { CommercialTemperatureIndicator } from "./CommercialTemperatureIndicator";
import { DemandIndicator } from "./DemandIndicator";
import { ProductPulseRenderer } from "./ProductPulseRenderer";
import { ProductSignalOverlay } from "./ProductSignalOverlay";
import { SponsoredVisibilityBadge } from "./SponsoredVisibilityBadge";
import { TensionIndicator } from "./TensionIndicator";

type Props = {
  card: LivingCatalogCard;
  lowBandwidth?: boolean;
  reducedMotion?: boolean;
};

function safeTemp(t: string | undefined): CommercialTemperature {
  const allowed: CommercialTemperature[] = ["COLD", "STABLE", "ACTIVE", "HOT", "CRITICAL"];
  return (allowed.includes(t as CommercialTemperature) ? t : "STABLE") as CommercialTemperature;
}

export function AdaptiveProductCard({ card, lowBandwidth, reducedMotion }: Props) {
  const { product, supplier, economicState, traceability, discussion, marketEnergy, relevance } =
    card;
  const img = product.imageUrls[0];
  const temp = economicState ? safeTemp(economicState.commercialTemperature) : "STABLE";
  const sponsoredInjection =
    card.visibilityType === "SPONSORED_INJECTION" || (economicState?.sponsoredScore ?? 0) > 0.4;

  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-slate-800/90 bg-gradient-to-b from-slate-950 to-black text-slate-100 shadow-[0_0_0_1px_rgba(34,211,238,0.06)]">
      {/* LAYER A — Identity */}
      <div className="relative flex gap-3 border-b border-slate-800/80 p-3">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border border-slate-700/80 bg-slate-900">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover opacity-90"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[9px] text-slate-500">
              SKU
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium uppercase tracking-wide text-cyan-200/80">
            {supplier.displayName}
            <span className="ml-2 font-mono text-slate-500">#{supplier.commercialId}</span>
          </p>
          <h3 className="mt-0.5 truncate text-sm font-semibold text-slate-50">{product.name}</h3>
          <p className="mt-1 line-clamp-2 text-[11px] text-slate-400">{product.description}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {product.qualityBadges.map((b) => (
              <span
                key={b}
                className="rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-emerald-100/90"
              >
                {b.replace(/_/g, " ")}
              </span>
            ))}
            {traceability?.traceabilityEnabled ? (
              <span className="rounded border border-cyan-500/30 px-1.5 py-0.5 text-[9px] text-cyan-100/90">
                Traçabilité prête
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* LAYER B — Commercial state */}
      <div className="grid grid-cols-2 gap-2 border-b border-slate-800/80 p-3 sm:grid-cols-4">
        <CommercialTemperatureIndicator temperature={temp} />
        {economicState ? (
          <>
            <DemandIndicator velocity={economicState.demandVelocity} lowBandwidth={lowBandwidth} />
            <TensionIndicator level={economicState.stockTensionLevel} />
            <div className="flex flex-col justify-end">
              <span className="text-[9px] uppercase text-slate-500">Mouvement</span>
              <ProductPulseRenderer
                intensity={economicState.movementIntensity}
                reducedMotion={reducedMotion}
              />
            </div>
          </>
        ) : (
          <p className="col-span-3 text-[10px] text-slate-500">État économique en cours de calcul…</p>
        )}
      </div>

      {/* LAYER C — Operational signals */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800/80 px-3 py-2">
        {sponsoredInjection ? (
          <SponsoredVisibilityBadge
            active
            score={economicState?.sponsoredScore ?? relevance?.relevanceScore}
          />
        ) : null}
        <span className="text-[10px] text-slate-400">
          Paiement: {product.paymentModes.slice(0, 2).join(" · ")}
        </span>
        <span className="text-[10px] text-slate-500">
          Logistique: réseau validé · confiance livraison{" "}
          {economicState ? `${Math.round((economicState.trustScore ?? 0) * 100)}%` : "—"}
        </span>
      </div>

      <ProductSignalOverlay lines={discussion.narrativeLines} />

      {/* LAYER D — Commerce actions (commerce-first, not generic chat) */}
      <div className="mt-auto flex flex-wrap gap-2 p-3">
        <Link
          href={`/product-signals/${product.id}`}
          className="rounded border border-cyan-500/40 bg-cyan-500/10 px-2 py-1.5 text-[11px] font-medium text-cyan-50 hover:bg-cyan-500/20"
        >
          Signaux produit
        </Link>
        <Link
          href={`/commerce-messaging?productId=${encodeURIComponent(product.id)}&sellerOrganizationId=${encodeURIComponent(supplier.id)}&intent=discuss`}
          className="rounded border border-cyan-500/40 bg-cyan-500/10 px-2 py-1.5 text-[11px] font-medium text-cyan-50 hover:bg-cyan-500/20"
        >
          Discuss
        </Link>
        <Link
          href={`/commerce-messaging?productId=${encodeURIComponent(product.id)}&sellerOrganizationId=${encodeURIComponent(supplier.id)}&intent=negotiate`}
          className="rounded border border-amber-500/35 bg-amber-500/10 px-2 py-1.5 text-[11px] text-amber-50 hover:bg-amber-500/20"
        >
          Negotiate
        </Link>
        <Link
          href={`/commerce-messaging?productId=${encodeURIComponent(product.id)}&sellerOrganizationId=${encodeURIComponent(supplier.id)}&intent=reserve`}
          className="rounded border border-slate-700 px-2 py-1.5 text-[11px] text-slate-200 hover:border-slate-500"
        >
          Reserve
        </Link>
        <Link
          href={`/group-buying?productId=${encodeURIComponent(product.id)}`}
          className="text-[11px] text-slate-400 underline-offset-2 hover:text-slate-200 hover:underline"
        >
          Group buy
        </Link>
      </div>

      {marketEnergy.pulses[0] ? (
        <p className="border-t border-slate-900 px-3 py-2 text-[10px] text-slate-500">
          Énergie marché: {marketEnergy.pulses[0].label}
        </p>
      ) : null}
    </article>
  );
}
