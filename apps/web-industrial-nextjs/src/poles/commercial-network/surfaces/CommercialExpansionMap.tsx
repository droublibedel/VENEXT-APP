"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { DEMO_OPERATIONAL_BUNDLE } from "../../demo/demo-operational-static";
import { MapControlEngine } from "../../map/MapControlEngine";
import { getPoleEntry } from "../../registry";
import { fetchCommercialNetworkJson } from "../commercial-network-api";

type GeoFC = { type: "FeatureCollection"; features: unknown[] };

type MapMode = "growth" | "weak_network" | "sponsorship" | "retailer_pressure" | "distributor_density" | "inactive_territory";

const SLUG = "commercial-network" as const;

export function CommercialExpansionMap({
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
  const [mode, setMode] = useState<MapMode>("growth");
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
    void fetchCommercialNetworkJson(`/expansion-map?mode=${encodeURIComponent(mode)}`, organizationId).then((r) => {
      if (!cancelled && r) setLocal(r);
    });
    return () => {
      cancelled = true;
    };
  }, [mode, organizationId]);

  const t = local as {
    policy?: string;
    mode?: MapMode;
    cells?: { territoryKey: string; label: string; heat: number; relationshipDensity: number }[];
    controls?: MapMode[];
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

  return (
    <section className="space-y-3">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-cyan-200/80">Commercial expansion map</p>
        <p className="text-xs text-slate-500">{t?.legend ?? "Tactical lattice — network health & corridors."}</p>
      </header>
      {t?.policy === "DISABLED" && mode === "sponsorship" ? (
        <div className="rounded border border-slate-700 bg-slate-950/80 px-2 py-1 text-[10px] text-slate-500">
          Sponsorship lattice requires <span className="font-mono text-slate-400">sponsorship_observatory_enabled</span> and{" "}
          <span className="font-mono text-slate-400">sponsored_products_enabled</span>.
        </div>
      ) : null}
      <div className="flex flex-wrap gap-1">
        {(t?.controls ?? ["growth", "weak_network", "sponsorship", "retailer_pressure", "distributor_density", "inactive_territory"]).map(
          (m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded px-2 py-0.5 text-[10px] uppercase tracking-wide ${
                mode === m ? "bg-cyan-500/20 text-cyan-100" : "border border-slate-800 text-slate-500"
              }`}
            >
              {m.replace(/_/g, " ")}
            </button>
          ),
        )}
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="min-h-[260px] overflow-hidden rounded border border-slate-800/90 bg-slate-950/40">
          {mapEnabled ? (
            <MapControlEngine
              lowPower={lowPower}
              zones={zonesRoutes.zones}
              routes={zonesRoutes.routes}
              emphasis={entry?.mapEmphasis ?? "network"}
              mapLayersEnabled={mapEnabled}
              commandFamilies={entry?.mapCommandFamilies ?? []}
            />
          ) : (
            <div className="flex h-[260px] items-center px-3 text-[11px] text-slate-500">Map layers offline — cells remain for review.</div>
          )}
        </div>
        <div className="max-h-[260px] space-y-1 overflow-y-auto text-[11px]">
          {(t?.cells ?? [])
            .slice(0, 24)
            .map((c) => (
              <div key={c.territoryKey} className="flex justify-between gap-2 border-b border-slate-800/70 py-1 text-slate-300">
                <span>
                  <span className="text-slate-500">{c.territoryKey}</span> · {c.label}
                </span>
                <span className="font-mono text-cyan-200/80">
                  {c.heat.toFixed(2)} · ρ{c.relationshipDensity.toFixed(2)}
                </span>
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}
