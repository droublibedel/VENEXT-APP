"use client";

import { memo } from "react";

import type { FinancePanelProps, ProducerFinanceWorkspaceView } from "./producer-finance.types";
import { ProducerFinancePanelFrame } from "./ProducerFinancePanelFrame";

function PartnerRiskInner(props: FinancePanelProps & { view: ProducerFinanceWorkspaceView | null }) {
  const { view, loading, error, dataSource, fallbackUsed } = props;

  return (
    <ProducerFinancePanelFrame
      title="Risque partenaires"
      subtitle="Partenaires fiables, ralentis et situations critiques"
      loading={loading}
      error={error}
      empty={!view?.partnerRisks.length}
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
      testId="producer-partner-risk-panel"
    >
      <ul className="space-y-2">
        {view?.partnerRisks.map((p) => (
          <li
            key={p.id}
            className={`flex flex-wrap items-start justify-between gap-2 rounded border px-3 py-2 ${
              p.category === "critique"
                ? "border-rose-500/30 bg-rose-950/12"
                : p.category === "ralenti"
                  ? "border-amber-500/25 bg-amber-950/10"
                  : p.category === "irrégulier"
                    ? "border-slate-600/40 bg-slate-950/30"
                    : "border-emerald-500/20 bg-emerald-950/8"
            }`}
            data-testid={`finance-risk-${p.id}`}
          >
            <div>
              <p className="text-sm font-medium text-slate-100">{p.name}</p>
              <p className="text-[10px] text-slate-500">{p.city}</p>
            </div>
            <div className="text-right text-[11px]">
              <p className="capitalize text-slate-300">{p.category}</p>
              <p className="text-slate-500">{p.note}</p>
            </div>
          </li>
        ))}
      </ul>
    </ProducerFinancePanelFrame>
  );
}

export const ProducerPartnerRiskPanel = memo(PartnerRiskInner);
