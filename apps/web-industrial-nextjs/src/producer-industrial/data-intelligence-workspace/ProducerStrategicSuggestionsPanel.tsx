"use client";

import { memo } from "react";

import type { IntelligencePanelProps, ProducerIntelligenceWorkspaceView } from "./producer-intelligence.types";
import { ProducerIntelligencePanelFrame } from "./ProducerIntelligencePanelFrame";

function StrategicSuggestionsInner(
  props: IntelligencePanelProps & { view: ProducerIntelligenceWorkspaceView | null },
) {
  const { view, loading, error, dataSource, fallbackUsed } = props;

  return (
    <ProducerIntelligencePanelFrame
      title="Suggestions terrain"
      subtitle="Pistes d'action — règles métier déterministes"
      loading={loading}
      error={error}
      empty={!view?.suggestions.length}
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
      testId="producer-strategic-suggestions-panel"
    >
      <ul className="space-y-2">
        {view?.suggestions.map((s) => (
          <li
            key={s.id}
            className={`rounded border-l-2 px-3 py-2 text-sm ${
              s.priority === "high"
                ? "border-emerald-500/50 bg-emerald-950/12 text-emerald-50"
                : s.priority === "medium"
                  ? "border-slate-500/40 bg-slate-950/30 text-slate-200"
                  : "border-slate-700/40 text-slate-400"
            }`}
            data-testid={`intelligence-suggestion-${s.id}`}
          >
            {s.text}
          </li>
        ))}
      </ul>
    </ProducerIntelligencePanelFrame>
  );
}

export const ProducerStrategicSuggestionsPanel = memo(StrategicSuggestionsInner);
