"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { DEMO_OPERATIONAL_BUNDLE } from "../../demo/demo-operational-static";
import { MapControlEngine } from "../../map/MapControlEngine";
import { getPoleEntry } from "../../registry";
import { fetchStrategicJson } from "../strategic-api";

type GeoFC = { type: "FeatureCollection"; features: unknown[] };

type TerritoryMapMode = "opportunity" | "risk" | "sponsorship" | "network" | "signal";

const SLUG = "direction-strategy" as const;

export function TerritoryOpportunityMap({
  organizationId,
  data,
  lowPower,
  mapEnabled,
}: {
  organizationId: string;
  data: unknown;
  lowPower: boolean;
  mapEnabled: boolean;
}) {
  const [mode, setMode] = useState<TerritoryMapMode>("opportunity");
  const [local, setLocal] = useState(data);
  const skipModeRefetch = useRef(true);

  useEffect(() => {
    setLocal(data);
  }, [data]);

  useEffect(() => {
    skipModeRefetch.current = true;
  }, [organizationId]);

  useEffect(() => {
    if (skipModeRefetch.current) {
      skipModeRefetch.current = false;
      return;
    }
    let cancelled = false;
    void fetchStrategicJson(`/territory-opportunities?mode=${encodeURIComponent(mode)}`, organizationId).then((r) => {
      if (!cancelled && r) setLocal(r);
    });
    return () => {
      cancelled = true;
    };
  }, [mode, organizationId]);

  const t = local as {
    policy?: string;
    mode?: string;
    cells?: {
      territoryKey: string;
      label: string;
      activeModeSignal: number;
      opportunityHeat: number;
      riskHeat: number;
    }[];
    controls?: string[];
    legend?: string;
  } | null;

  const zonesRoutes = useMemo(
    () => ({
      zones: DEMO_OPERATIONAL_BUNDLE.zones as GeoFC,
      routes: DEMO_OPERATIONAL_BUNDLE.routes as GeoFC,
    }),
    [],
  );

  const entry = getPoleEntry(SLUG);

  if (t?.policy === "DISABLED") {
    return (
      <div className="rounded border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs text-slate-400">
        Territory lattice disabled by <span className="font-mono text-slate-300">territory_map_enabled</span>.
      </div>
    );
  }

  return (
    <section className="space-y-3">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-200/80">Territory opportunity map</p>
        <p className="text-xs text-slate-500">{t?.legend ?? "Operational lattice — not a delivery routing UI."}</p>
      </header>
      <div className="flex flex-wrap gap-1">
        {(t?.controls ?? ["opportunity", "risk", "sponsorship", "network", "signal"]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m as TerritoryMapMode)}
            className={`rounded px-2 py-0.5 text-[10px] uppercase tracking-wide ${
              mode === m ? "bg-amber-500/20 text-amber-100" : "border border-slate-800 text-slate-500"
            }`}
          >
            {m}
          </button>
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="min-h-[280px] overflow-hidden rounded border border-slate-800/90 bg-slate-950/40">
          {mapEnabled ? (
            <MapControlEngine
              lowPower={lowPower}
              zones={zonesRoutes.zones}
              routes={zonesRoutes.routes}
              emphasis={entry?.mapEmphasis ?? "heatmap"}
              mapLayersEnabled={mapEnabled}
              commandFamilies={entry?.mapCommandFamilies ?? []}
            />
          ) : (
            <div className="flex h-[280px] items-center px-3 text-[11px] text-slate-500">
              Map layers policy-offline — lattice rows remain for governance review.
            </div>
          )}
        </div>
        <div className="max-h-[280px] space-y-1 overflow-y-auto text-[11px]">
          {(t?.cells ?? [])
            .sort((a, b) => (mode === "risk" ? b.riskHeat - a.riskHeat : b.activeModeSignal - a.activeModeSignal))
            .slice(0, 24)
            .map((c) => (
              <div key={c.territoryKey + c.label} className="flex justify-between gap-2 border-b border-slate-800/70 py-1 text-slate-300">
                <span>
                  <span className="text-slate-500">{c.territoryKey}</span> · {c.label}
                </span>
                <span className="font-mono text-cyan-200/80">{c.activeModeSignal.toFixed(3)}</span>
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}
