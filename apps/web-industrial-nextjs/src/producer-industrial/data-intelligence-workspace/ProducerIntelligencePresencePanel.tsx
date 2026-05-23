"use client";

import { memo } from "react";

import type { IntelligencePanelProps, ProducerIntelligenceWorkspaceView } from "./producer-intelligence.types";
import { ProducerIntelligencePanelFrame } from "./ProducerIntelligencePanelFrame";

function IntelligencePresenceInner(
  props: IntelligencePanelProps & { view: ProducerIntelligenceWorkspaceView | null },
) {
  const { view, loading, error, dataSource, fallbackUsed } = props;

  return (
    <ProducerIntelligencePanelFrame
      title="Présence VENEXT"
      subtitle="Une lecture discrète, utile et rassurante"
      loading={loading}
      error={error}
      empty={!view?.presence.length}
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
      testId="producer-intelligence-presence-panel"
    >
      <div
        className="space-y-3 rounded-lg border border-emerald-500/15 bg-gradient-to-br from-slate-950/90 via-slate-900/80 to-emerald-950/20 p-4"
        data-testid="intelligence-presence-zone"
      >
        {view?.presence.map((m) => (
          <p
            key={m.id}
            className="border-l-2 border-emerald-500/30 pl-3 text-sm leading-relaxed text-slate-300"
            data-testid={`presence-message-${m.id}`}
          >
            {m.text}
          </p>
        ))}
      </div>
    </ProducerIntelligencePanelFrame>
  );
}

export const ProducerIntelligencePresencePanel = memo(IntelligencePresenceInner);
