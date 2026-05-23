"use client";

import { memo } from "react";

import type { MarketingPanelProps, ProducerMarketingWorkspaceView } from "./producer-marketing.types";
import { ProducerMarketingPanelFrame } from "./ProducerMarketingPanelFrame";

function CampaignDynamicsInner(
  props: MarketingPanelProps & { view: ProducerMarketingWorkspaceView | null },
) {
  const { view, loading, error, dataSource, fallbackUsed } = props;
  const campaigns = view?.campaigns ?? [];

  return (
    <ProducerMarketingPanelFrame
      title="Dynamique campagnes"
      subtitle="Activations performantes, zones qui réagissent et stabilité"
      loading={loading}
      error={error}
      empty={!campaigns.length}
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
      testId="producer-campaign-dynamics-panel"
    >
      <ul className="grid gap-2 sm:grid-cols-2">
        {campaigns.map((c) => (
          <li
            key={c.id}
            className="rounded border border-slate-800/70 bg-slate-950/40 px-3 py-2 text-xs text-slate-300"
            data-testid={`marketing-campaign-${c.id}`}
          >
            <p className="font-medium text-slate-100">{c.label}</p>
            <p className="mt-1 text-[10px] text-slate-500">Zone {c.zone}</p>
            <p className="mt-1 font-mono text-emerald-400/90">
              Activité {c.activityPct}% · Stabilité {c.stability}%
            </p>
            <p className="mt-0.5 capitalize text-slate-500">
              {c.status} · {c.distributorActivity}
            </p>
          </li>
        ))}
      </ul>
    </ProducerMarketingPanelFrame>
  );
}

export const ProducerCampaignDynamicsPanel = memo(CampaignDynamicsInner);
