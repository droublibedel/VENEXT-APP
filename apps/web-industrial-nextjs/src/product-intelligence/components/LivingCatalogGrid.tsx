"use client";

import { useMemo, useState } from "react";

import type { LivingCatalogCard } from "../types";
import { AdaptiveProductCard } from "./AdaptiveProductCard";

type Props = {
  cards: LivingCatalogCard[];
  pageSize?: number;
  lowBandwidth?: boolean;
  reducedMotion?: boolean;
};

/**
 * Progressive rendering — avoids mounting hundreds of heavy cards on 2GB RAM (Instruction 6 §13).
 */
export function LivingCatalogGrid({
  cards,
  pageSize = 6,
  lowBandwidth,
  reducedMotion,
}: Props) {
  const [visible, setVisible] = useState(pageSize);
  const slice = useMemo(() => cards.slice(0, visible), [cards, visible]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 [content-visibility:auto]">
        {slice.map((card) => (
          <div key={card.visibilityId} className="min-h-0 [content-visibility:auto]">
            <AdaptiveProductCard
              card={card}
              lowBandwidth={lowBandwidth}
              reducedMotion={reducedMotion}
            />
          </div>
        ))}
      </div>
      {visible < cards.length ? (
        <button
          type="button"
          className="w-full rounded border border-slate-700 py-2 text-xs text-slate-300 hover:border-cyan-500/40 hover:text-cyan-100"
          onClick={() => setVisible((v) => Math.min(v + pageSize, cards.length))}
        >
          Charger plus ({cards.length - visible} restants)
        </button>
      ) : null}
    </div>
  );
}
