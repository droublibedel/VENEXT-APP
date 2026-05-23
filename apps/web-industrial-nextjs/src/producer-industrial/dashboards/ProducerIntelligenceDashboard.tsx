"use client";

import type { ProducerAlertDto } from "../data/producer-industrial-data.types";
import { useProducerAlerts, useProducerDataIntelligence } from "../hooks/useProducerIndustrialLiveData";
import { PRODUCER_ALERTS, PRODUCER_INTELLIGENCE_INSIGHTS } from "../mocks/industrial-mock-data";

const FALLBACK_ALERTS: ProducerAlertDto[] = PRODUCER_ALERTS.map((a) => ({
  id: a.id,
  level: a.level,
  message: a.message,
  pole: "réseau",
  suggestedAction: "Consulter le pôle concerné",
}));
import { ProducerDataSourceHint } from "../shared/ProducerDataSourceHint";
import { ProducerSectionHeader } from "../shared/ProducerSectionHeader";

const SEVERITY_STYLES = {
  high: "border-rose-500/40 bg-rose-950/30 text-rose-200",
  medium: "border-amber-500/30 bg-amber-950/20 text-amber-100",
  low: "border-emerald-500/25 bg-emerald-950/15 text-emerald-100",
} as const;

export function ProducerIntelligenceDashboard() {
  const intel = useProducerDataIntelligence();
  const alertsState = useProducerAlerts();
  const insights = intel.data?.insights?.length ? intel.data.insights : PRODUCER_INTELLIGENCE_INSIGHTS;
  const alerts = alertsState.data?.length ? alertsState.data : FALLBACK_ALERTS;

  return (
    <section data-testid="producer-dashboard-intelligence">
      <ProducerSectionHeader
        kicker="Data & Intelligence"
        title="Intelligence réseau accessible"
        subtitle="Insights issus de la couverture relationnelle — formulés pour la décision terrain, sans jargon technique."
      />
      <ProducerDataSourceHint
        dataSource={intel.dataSource}
        fallbackUsed={intel.fallbackUsed}
        loading={intel.loading}
      />
      <ul className="grid gap-3 md:grid-cols-2">
        {insights.map((item) => (
          <li
            key={item.id}
            className={`producer-industrial-card border-l-2 p-4 ${SEVERITY_STYLES[item.severity]}`}
            data-testid={`insight-${item.id}`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{item.severity}</p>
            <p className="mt-1 text-sm font-medium">{item.title}</p>
            <p className="mt-2 text-xs opacity-90">{item.detail}</p>
          </li>
        ))}
      </ul>
      <div className="mt-6">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Alertes actives</p>
        <ul className="space-y-2">
          {alerts.map((a) => (
            <li
              key={a.id}
              className="flex items-start gap-2 rounded border border-slate-800/80 bg-slate-950/50 px-3 py-2 text-xs text-slate-300"
              data-testid={`alert-${a.id}`}
            >
              <span
                className={
                  a.level === "critical"
                    ? "text-rose-400"
                    : a.level === "warning"
                      ? "text-amber-400"
                      : "text-sky-400"
                }
              >
                ●
              </span>
              <div>
                <p>{a.message}</p>
                {a.zone ? <p className="mt-0.5 text-[10px] text-slate-500">Zone : {a.zone}</p> : null}
                {a.suggestedAction ? (
                  <p className="mt-0.5 text-[10px] text-emerald-400/80">{a.suggestedAction}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
