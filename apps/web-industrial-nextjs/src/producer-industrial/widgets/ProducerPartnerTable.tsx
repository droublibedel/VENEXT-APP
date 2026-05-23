"use client";

import type { ProducerPartner } from "../mocks/industrial-mock-data";
import { formatXof, getRegionById } from "../mocks/industrial-mock-data";

export function ProducerPartnerTable(props: {
  partners: ProducerPartner[];
  title?: string;
  testId?: string;
}) {
  const { partners, title, testId } = props;
  return (
    <div className="producer-industrial-card overflow-hidden" data-testid={testId}>
      {title ? (
        <p className="border-b border-slate-800/80 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          {title}
        </p>
      ) : null}
      <ul className="divide-y divide-slate-800/60">
        {partners.map((p) => {
          const region = getRegionById(p.regionId)?.name ?? p.regionId;
          const riskClass =
            p.risk === "elevated"
              ? "text-rose-400"
              : p.risk === "watch"
                ? "text-amber-400"
                : "text-emerald-400";
          return (
            <li key={p.id} className="flex items-center justify-between gap-2 px-4 py-2.5 text-xs">
              <div>
                <p className="font-medium text-slate-200">{p.name}</p>
                <p className="text-[10px] text-slate-500">
                  {region} · {p.orders7d} cmd / 7j
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-slate-300">{formatXof(p.revenueXof)}</p>
                <p className={`text-[10px] uppercase ${riskClass}`}>{p.risk}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
