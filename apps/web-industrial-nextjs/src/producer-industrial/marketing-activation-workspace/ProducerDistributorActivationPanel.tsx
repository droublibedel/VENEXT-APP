"use client";

import { memo, useMemo, useRef, useState } from "react";

import type {
  MarketingDistributorActivationRow,
  MarketingPanelProps,
  ProducerMarketingWorkspaceView,
} from "./producer-marketing.types";
import { ProducerMarketingPanelFrame } from "./ProducerMarketingPanelFrame";

const ROW_H = 40;

function VirtualDistributorActivationTable(props: { rows: MarketingDistributorActivationRow[] }) {
  const { rows } = props;
  const ref = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const start = Math.floor(scrollTop / ROW_H);
  const slice = rows.slice(start, start + 9);
  const offset = start * ROW_H;

  return (
    <div
      ref={ref}
      className="max-h-[340px] overflow-y-auto rounded border border-slate-800/60"
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      data-testid="marketing-distributor-virtual-list"
    >
      <div style={{ height: rows.length * ROW_H, position: "relative" }}>
        <table className="absolute w-full text-[11px]" style={{ top: offset }}>
          <thead className="sticky top-0 bg-slate-950/95 text-[10px] uppercase text-slate-500">
            <tr>
              <th className="px-2 py-2 text-left">Distributeur</th>
              <th className="px-2 py-2 text-left">Ville</th>
              <th className="px-2 py-2 text-left">Activité activation</th>
              <th className="px-2 py-2 text-left">Croissance</th>
              <th className="px-2 py-2 text-right">Commandes</th>
              <th className="px-2 py-2 text-right">Produits poussés</th>
              <th className="px-2 py-2 text-right">Stabilité</th>
              <th className="px-2 py-2 text-left">Statut</th>
            </tr>
          </thead>
          <tbody>
            {slice.map((row) => (
              <tr key={row.id} className="border-t border-slate-800/50 text-slate-300" style={{ height: ROW_H }}>
                <td className="px-2 py-1 font-medium text-slate-100">{row.distributor}</td>
                <td className="px-2 py-1">{row.city}</td>
                <td className="px-2 py-1 capitalize">{row.activationActivity}</td>
                <td className="px-2 py-1">{row.growth}</td>
                <td className="px-2 py-1 text-right font-mono text-emerald-400/90">{row.orders}</td>
                <td className="px-2 py-1 text-right font-mono">{row.productsPushed}</td>
                <td className="px-2 py-1 text-right font-mono">{row.stability}%</td>
                <td className="px-2 py-1 capitalize">{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DistributorActivationInner(
  props: MarketingPanelProps & { view: ProducerMarketingWorkspaceView | null },
) {
  const { view, loading, error, dataSource, fallbackUsed } = props;
  const [city, setCity] = useState("");
  const [activity, setActivity] = useState("");
  const [growth, setGrowth] = useState("");

  const filtered = useMemo(() => {
    let rows = view?.distributors ?? [];
    if (city) rows = rows.filter((r) => r.city === city);
    if (activity) rows = rows.filter((r) => r.activationActivity === activity);
    if (growth) rows = rows.filter((r) => r.growth === growth);
    return rows;
  }, [view?.distributors, city, activity, growth]);

  return (
    <ProducerMarketingPanelFrame
      title="Activation distributeurs"
      subtitle="Qui pousse réellement les produits sur le terrain"
      loading={loading}
      error={error}
      empty={!filtered.length}
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
      testId="producer-distributor-activation-panel"
    >
      <div className="mb-3 flex flex-wrap gap-2">
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="rounded border border-slate-700/80 bg-slate-950 px-2 py-1 text-[11px] text-slate-300"
          aria-label="Filtrer par ville"
        >
          <option value="">Toutes villes</option>
          {view?.cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={activity}
          onChange={(e) => setActivity(e.target.value)}
          className="rounded border border-slate-700/80 bg-slate-950 px-2 py-1 text-[11px] text-slate-300"
          aria-label="Filtrer par activité"
        >
          <option value="">Toute activité</option>
          <option value="forte">Forte</option>
          <option value="moyenne">Moyenne</option>
          <option value="faible">Faible</option>
        </select>
        <select
          value={growth}
          onChange={(e) => setGrowth(e.target.value)}
          className="rounded border border-slate-700/80 bg-slate-950 px-2 py-1 text-[11px] text-slate-300"
          aria-label="Filtrer par croissance"
        >
          <option value="">Toute croissance</option>
          <option value="Hausse">Hausse</option>
          <option value="Stable">Stable</option>
        </select>
      </div>
      <VirtualDistributorActivationTable rows={filtered} />
    </ProducerMarketingPanelFrame>
  );
}

export const ProducerDistributorActivationPanel = memo(DistributorActivationInner);
