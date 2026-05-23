"use client";

import { memo, useMemo } from "react";

import type { ProducerDataSource } from "../data/producer-industrial-data.types";
import type { RelationalCommercialWorkspaceView } from "./relational-commercial-workspace.types";
import { RelationalPanelFrame } from "./RelationalPanelFrame";

function TerritoryCoveragePanelInner(props: {
  view: RelationalCommercialWorkspaceView | null;
  loading: boolean;
  error: string | null;
  dataSource: ProducerDataSource;
  fallbackUsed: boolean;
}) {
  const { view, loading, error, dataSource, fallbackUsed } = props;
  const zones = view?.territories ?? [];

  const dots = useMemo(() => {
    return zones.map((z, i) => {
      const x = 50 + (i % 3) * 100 + (i > 2 ? 30 : 0);
      const y = 40 + Math.floor(i / 3) * 55;
      const r = 6 + (z.coveragePct / 100) * 12;
      const fill =
        z.tension === "high"
          ? "rgba(248,113,113,0.7)"
          : `rgba(0,168,132,${0.25 + z.coveragePct / 120})`;
      return { ...z, x, y, r, fill };
    });
  }, [zones]);

  return (
    <RelationalPanelFrame
      title="Couverture territoriale"
      subtitle="Villes dominées, zones faibles et corridors absents"
      loading={loading}
      error={error}
      empty={!zones.length}
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
      testId="relational-territory-coverage-panel"
    >
      <div className="relative h-48 overflow-hidden rounded border border-slate-800/60 bg-slate-950/50">
        <svg className="h-full w-full" viewBox="0 0 360 180" aria-hidden data-testid="relational-territory-svg">
          <path
            d="M 30 140 Q 120 60 200 80 T 330 50"
            fill="none"
            stroke="rgba(0,168,132,0.25)"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
          {dots.map((d) => (
            <circle key={d.id} cx={d.x} cy={d.y} r={d.r} fill={d.fill} />
          ))}
        </svg>
      </div>
      <ul className="mt-3 grid gap-2 text-xs text-slate-300 sm:grid-cols-2">
        <li>
          <span className="text-slate-500">Villes dominées : </span>
          {view?.dominatedCities.join(", ") || "—"}
        </li>
        <li>
          <span className="text-slate-500">Zones faibles : </span>
          {view?.weakZones.join(", ") || "—"}
        </li>
        <li className="sm:col-span-2">
          <span className="text-slate-500">Corridors absents : </span>
          {view?.missingCorridors.join(", ") || "Couverture complète sur le périmètre pilote"}
        </li>
      </ul>
    </RelationalPanelFrame>
  );
}

export const RelationalTerritoryCoveragePanel = memo(TerritoryCoveragePanelInner);
