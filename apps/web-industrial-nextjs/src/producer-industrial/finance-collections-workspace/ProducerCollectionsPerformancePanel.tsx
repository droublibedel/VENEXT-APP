"use client";

import { memo, useMemo, useRef, useState } from "react";

import type { FinanceCollectionRow, FinancePanelProps, ProducerFinanceWorkspaceView } from "./producer-finance.types";
import { ProducerFinancePanelFrame } from "./ProducerFinancePanelFrame";

const ROW_H = 40;

function VirtualCollectionsTable(props: { rows: FinanceCollectionRow[] }) {
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
      data-testid="finance-collections-virtual-list"
    >
      <div style={{ height: rows.length * ROW_H, position: "relative" }}>
        <table className="absolute w-full text-[11px]" style={{ top: offset }}>
          <thead className="sticky top-0 bg-slate-950/95 text-[10px] uppercase text-slate-500">
            <tr>
              <th className="px-2 py-2 text-left">Partenaire</th>
              <th className="px-2 py-2 text-left">Ville</th>
              <th className="px-2 py-2 text-right">Volume</th>
              <th className="px-2 py-2 text-right">Stabilité</th>
              <th className="px-2 py-2 text-left">Retards</th>
              <th className="px-2 py-2 text-left">Activité</th>
              <th className="px-2 py-2 text-left">Évolution</th>
              <th className="px-2 py-2 text-left">Statut</th>
            </tr>
          </thead>
          <tbody>
            {slice.map((row) => (
              <tr key={row.id} className="border-t border-slate-800/50 text-slate-300" style={{ height: ROW_H }}>
                <td className="px-2 py-1 font-medium text-slate-100">{row.partner}</td>
                <td className="px-2 py-1">{row.city}</td>
                <td className="px-2 py-1 text-right font-mono text-emerald-400/90">{row.volume}</td>
                <td className="px-2 py-1 text-right font-mono">{row.stability}%</td>
                <td className="px-2 py-1">{row.delays}</td>
                <td className="px-2 py-1 capitalize">{row.activity}</td>
                <td className="px-2 py-1">{row.evolution}</td>
                <td className="px-2 py-1 capitalize">{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CollectionsPerformanceInner(props: FinancePanelProps & { view: ProducerFinanceWorkspaceView | null }) {
  const { view, loading, error, dataSource, fallbackUsed } = props;
  const [city, setCity] = useState("");
  const [status, setStatus] = useState("");
  const [stability, setStability] = useState("");

  const filtered = useMemo(() => {
    let rows = view?.collections ?? [];
    if (city) rows = rows.filter((r) => r.city === city);
    if (status) rows = rows.filter((r) => r.status === status);
    if (stability === "high") rows = rows.filter((r) => r.stability >= 75);
    if (stability === "low") rows = rows.filter((r) => r.stability < 65);
    return rows;
  }, [view?.collections, city, status, stability]);

  return (
    <ProducerFinancePanelFrame
      title="Performance encaissements"
      subtitle="Partenaires, volumes et retards — lecture réseau"
      loading={loading}
      error={error}
      empty={!filtered.length}
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
      testId="producer-collections-performance-panel"
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
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded border border-slate-700/80 bg-slate-950 px-2 py-1 text-[11px] text-slate-300"
          aria-label="Filtrer par statut"
        >
          <option value="">Tous statuts</option>
          <option value="stable">Stable</option>
          <option value="surveiller">Surveiller</option>
          <option value="critique">Critique</option>
        </select>
        <select
          value={stability}
          onChange={(e) => setStability(e.target.value)}
          className="rounded border border-slate-700/80 bg-slate-950 px-2 py-1 text-[11px] text-slate-300"
          aria-label="Filtrer par stabilité"
          data-testid="finance-filter-stability"
        >
          <option value="">Toute stabilité</option>
          <option value="high">Élevée</option>
          <option value="low">À surveiller</option>
        </select>
      </div>
      <VirtualCollectionsTable rows={filtered} />
    </ProducerFinancePanelFrame>
  );
}

export const ProducerCollectionsPerformancePanel = memo(CollectionsPerformanceInner);
