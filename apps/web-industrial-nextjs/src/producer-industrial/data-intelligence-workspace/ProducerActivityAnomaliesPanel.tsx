"use client";

import { memo } from "react";

import type { IntelligencePanelProps, ProducerIntelligenceWorkspaceView } from "./producer-intelligence.types";
import { ProducerIntelligencePanelFrame } from "./ProducerIntelligencePanelFrame";

function ActivityAnomaliesInner(
  props: IntelligencePanelProps & { view: ProducerIntelligenceWorkspaceView | null },
) {
  const { view, loading, error, dataSource, fallbackUsed } = props;

  return (
    <ProducerIntelligencePanelFrame
      title="Variations d'activité"
      subtitle="Lecture calme — jamais alarmiste"
      loading={loading}
      error={error}
      empty={!view?.anomalies.length}
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
      testId="producer-activity-anomalies-panel"
    >
      <ul className="space-y-2">
        {view?.anomalies.map((a) => (
          <li
            key={a.id}
            className="rounded border border-slate-800/70 bg-slate-950/40 px-3 py-2"
            data-testid={`activity-anomaly-${a.id}`}
          >
            <p className="text-sm font-medium text-slate-200">{a.label}</p>
            <p className="mt-0.5 text-[11px] text-slate-500">{a.detail}</p>
          </li>
        ))}
      </ul>
    </ProducerIntelligencePanelFrame>
  );
}

export const ProducerActivityAnomaliesPanel = memo(ActivityAnomaliesInner);
