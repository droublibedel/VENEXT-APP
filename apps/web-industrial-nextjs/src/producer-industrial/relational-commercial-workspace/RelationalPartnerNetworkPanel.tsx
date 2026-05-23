"use client";

import { memo, useMemo, useRef, useState } from "react";

import type { ProducerDataSource } from "../data/producer-industrial-data.types";
import type { RelationalCommercialWorkspaceView, RelationalPartnerRow } from "./relational-commercial-workspace.types";
import { RelationalPanelFrame } from "./RelationalPanelFrame";

const ROW_HEIGHT = 44;
const VIEWPORT_ROWS = 8;

function VirtualPartnerRows(props: { rows: RelationalPartnerRow[] }) {
  const { rows } = props;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const { start, end, offset } = useMemo(() => {
    const startIdx = Math.floor(scrollTop / ROW_HEIGHT);
    const visible = Math.min(rows.length - startIdx, VIEWPORT_ROWS + 2);
    return {
      start: startIdx,
      end: startIdx + visible,
      offset: startIdx * ROW_HEIGHT,
    };
  }, [scrollTop, rows.length]);

  const slice = rows.slice(start, end);

  return (
    <div
      ref={scrollRef}
      className="max-h-[360px] overflow-y-auto rounded border border-slate-800/60"
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      data-testid="relational-partner-virtual-list"
    >
      <div style={{ height: rows.length * ROW_HEIGHT, position: "relative" }}>
        <table className="absolute left-0 right-0 w-full text-[11px]" style={{ top: offset }}>
          <thead className="sticky top-0 z-10 bg-slate-950/95 text-[10px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-2 py-2 text-left font-medium">Partenaire</th>
              <th className="px-2 py-2 text-left">Ville</th>
              <th className="px-2 py-2 text-left">Activité</th>
              <th className="px-2 py-2 text-right">Stabilité</th>
              <th className="px-2 py-2 text-right">Commandes</th>
              <th className="px-2 py-2 text-left">Tendance</th>
              <th className="px-2 py-2 text-left">Corridor</th>
            </tr>
          </thead>
          <tbody>
            {slice.map((row) => (
              <tr key={row.id} className="border-t border-slate-800/50 text-slate-300" style={{ height: ROW_HEIGHT }}>
                <td className="px-2 py-2 font-medium text-slate-100">{row.partner}</td>
                <td className="px-2 py-2">{row.city}</td>
                <td className="px-2 py-2 capitalize">{row.activity}</td>
                <td className="px-2 py-2 text-right font-mono text-emerald-400/90">{row.stability}%</td>
                <td className="px-2 py-2 text-right font-mono">{row.orders}</td>
                <td className="px-2 py-2 capitalize">{row.trend}</td>
                <td className="px-2 py-2 text-slate-400">{row.corridor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PartnerNetworkPanelInner(props: {
  view: RelationalCommercialWorkspaceView | null;
  loading: boolean;
  error: string | null;
  dataSource: ProducerDataSource;
  fallbackUsed: boolean;
}) {
  const { view, loading, error, dataSource, fallbackUsed } = props;
  const seg = view?.partnerSegments;

  return (
    <RelationalPanelFrame
      title="Réseau partenaires"
      subtitle="Grossistes, détaillants et dépendances du réseau CI"
      loading={loading}
      error={error}
      empty={!view?.partners.length}
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
      testId="relational-partner-network-panel"
    >
      {seg ? (
        <div className="mb-3 flex flex-wrap gap-2 text-[10px] text-slate-400">
          <span>Actifs <strong className="text-slate-200">{seg.actifs}</strong></span>
          <span>Croissance <strong className="text-emerald-400">{seg.croissance}</strong></span>
          <span>Silencieux <strong className="text-amber-400">{seg.silencieux}</strong></span>
          <span>Nouveaux <strong className="text-sky-400">{seg.nouveaux}</strong></span>
          <span>Critiques <strong className="text-rose-400">{seg.critiques}</strong></span>
          <span>Dépendances <strong className="text-violet-300">{seg.dependances}</strong></span>
        </div>
      ) : null}
      {view ? <VirtualPartnerRows rows={view.partners} /> : null}
    </RelationalPanelFrame>
  );
}

export const RelationalPartnerNetworkPanel = memo(PartnerNetworkPanelInner);
