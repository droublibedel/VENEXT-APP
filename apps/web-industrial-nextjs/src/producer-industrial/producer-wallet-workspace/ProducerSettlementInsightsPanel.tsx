"use client";

import { memo } from "react";

import type { WalletHint } from "commerce-wallet";

export const ProducerSettlementInsightsPanel = memo(function ProducerSettlementInsightsPanel({
  hints,
}: {
  hints: WalletHint[];
}) {
  return (
    <div className="space-y-3" data-testid="producer-settlement-insights-panel">
      <p className="text-sm text-slate-400">Signaux discrets pour vos règlements partenaires.</p>
      {hints.length === 0 ? (
        <p className="text-sm text-slate-500">Activité commerciale régulière.</p>
      ) : (
        hints.map((h) => (
          <p
            key={h.id}
            className="rounded border border-slate-800/80 bg-slate-900/40 px-3 py-2 text-xs text-slate-300"
            data-testid="producer-settlement-insight"
          >
            {h.text}
          </p>
        ))
      )}
    </div>
  );
});
