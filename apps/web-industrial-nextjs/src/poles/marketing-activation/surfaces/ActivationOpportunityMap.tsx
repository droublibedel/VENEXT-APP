"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { ActivationOpportunityMapMode } from "@venext/shared-contracts";
import { DEMO_OPERATIONAL_BUNDLE } from "../../demo/demo-operational-static";
import { MapControlEngine } from "../../map/MapControlEngine";
import { getPoleEntry } from "../../registry";
import { fetchMarketingActivationJson } from "../marketing-activation-api";

type GeoFC = { type: "FeatureCollection"; features: unknown[] };

const SLUG = "marketing-activation" as const;

export function ActivationOpportunityMap({
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
  const [mode, setMode] = useState<ActivationOpportunityMapMode>("momentum");
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
    void fetchMarketingActivationJson(`/opportunity-map?mode=${encodeURIComponent(mode)}`, organizationId).then((r) => {
      if (!cancelled && r) setLocal(r);
    });
    return () => {
      cancelled = true;
    };
  }, [mode, organizationId]);

  const t = local as {
    policy?: string;
    mode?: ActivationOpportunityMapMode;
    cells?: { territoryKey: string; label: string; heat: number; corridor?: string }[];
    controls?: ActivationOpportunityMapMode[];
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
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-violet-200/90">Activation opportunity map</p>
        <p className="text-xs text-slate-500">{t?.legend ?? "Tactical lattice — momentum, dormancy, sponsorship spread."}</p>
      </header>
      <div className="flex flex-wrap gap-1">
        {(t?.controls ?? [
          "momentum",
          "dormant",
          "sponsorship",
          "retailer_engagement",
          "territory_stimulation",
          "activation_decay",
        ]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded px-2 py-0.5 text-[10px] uppercase tracking-wide ${
              mode === m ? "bg-violet-500/25 text-violet-100" : "border border-slate-800 text-slate-500"
            }`}
          >
            {m.replace(/_/g, " ")}
          </button>
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="min-h-[240px] overflow-hidden rounded border border-slate-800/90 bg-slate-950/40">
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
            <div className="flex h-[240px] items-center px-3 text-[11px] text-slate-500">
              Map layers offline — activation cells still hydrate for field review.
            </div>
          )}
        </div>
        <div className="max-h-[240px] space-y-1 overflow-y-auto text-[11px]">
          {(t?.cells ?? []).slice(0, 22).map((c) => (
            <div key={c.territoryKey} className="flex justify-between gap-2 border-b border-slate-800/70 py-1 text-slate-300">
              <span>
                <span className="text-slate-500">{c.territoryKey}</span> · {c.label}
              </span>
              <span className="font-mono text-violet-200/80">{c.heat.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
