"use client";

import type { ProducerAlertDto } from "../data/producer-industrial-data.types";
import { useProducerAlerts } from "../hooks/useProducerIndustrialLiveData";
import { PRODUCER_ALERTS } from "../mocks/industrial-mock-data";

const FALLBACK_ALERTS: ProducerAlertDto[] = PRODUCER_ALERTS.map((a) => ({
  id: a.id,
  level: a.level,
  message: a.message,
  pole: "réseau",
  suggestedAction: "Consulter le pôle concerné",
}));

export function ProducerAlertCenter() {
  const { data, dataSource, fallbackUsed, loading } = useProducerAlerts();
  const alerts = data?.length ? data : FALLBACK_ALERTS;

  return (
    <aside
      className="hidden w-64 shrink-0 flex-col border-l border-slate-800/80 bg-[#080a0d] xl:flex"
      data-testid="producer-alert-center"
      data-source={dataSource}
      data-fallback={fallbackUsed ? "true" : "false"}
      aria-label="Centre alertes"
    >
      <p className="border-b border-slate-800/80 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
        Alertes réseau
        {!loading && fallbackUsed ? (
          <span className="ml-1 font-normal normal-case text-slate-600">· démo</span>
        ) : null}
      </p>
      <ul className="flex-1 overflow-y-auto p-2 space-y-2">
        {alerts.length === 0 ? (
          <li className="px-2 py-4 text-center text-[11px] text-slate-500">Aucune alerte active.</li>
        ) : (
          alerts.map((a) => (
            <li
              key={a.id}
              className="rounded border border-slate-800/70 bg-slate-950/60 px-2 py-2 text-[11px] text-slate-400"
            >
              <span
                className={
                  a.level === "critical" ? "text-rose-400" : a.level === "warning" ? "text-amber-400" : "text-sky-400"
                }
              >
                {a.level}
              </span>
              {a.pole ? <span className="ml-1 text-slate-600">· {a.pole}</span> : null}
              <p className="mt-1 text-slate-300">{a.message}</p>
              {a.zone ? <p className="mt-0.5 text-[10px] text-slate-500">{a.zone}</p> : null}
              {a.suggestedAction ? (
                <p className="mt-1 text-[10px] text-emerald-500/80">{a.suggestedAction}</p>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </aside>
  );
}
