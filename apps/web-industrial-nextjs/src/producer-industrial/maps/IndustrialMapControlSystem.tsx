"use client";

import { useMemo } from "react";

import type { ProducerDataSource, ProducerMapControlDto } from "../data/producer-industrial-data.types";
import { PRODUCER_REGIONS } from "../mocks/industrial-mock-data";

type MapLayer =
  | "activity"
  | "tension"
  | "growth"
  | "supply"
  | "productCoverage"
  | "highDemand"
  | "lowAvailability"
  | "activeDistribution"
  | "distributionCoverage"
  | "activeCorridors"
  | "highActivity"
  | "lowCoverage"
  | "logisticsPressure"
  | "activationZones"
  | "productMomentum"
  | "highResponse"
  | "weakCoverage"
  | "distributorPush"
  | "logisticsFlow"
  | "deliveryPressure"
  | "activeHubs"
  | "stableCorridors"
  | "slowExecution"
  | "revenueDistribution"
  | "stableZones"
  | "delayedZones"
  | "highCollections"
  | "lowCollections"
  | "intelligentSignals"
  | "activeAttention"
  | "monitoredZones"
  | "corridorWatch"
  | "networkMomentum";

export function IndustrialMapControlSystem(props: {
  layer?: MapLayer;
  compact?: boolean;
  testId?: string;
  data?: ProducerMapControlDto;
  dataSource?: ProducerDataSource;
}) {
  const { layer = "activity", compact = false, testId, data } = props;
  const regions = data !== undefined ? data.regions : PRODUCER_REGIONS;
  const corridors = data?.corridors ?? [];

  const cells = useMemo(() => {
    return regions.map((r) => {
      const intensity =
        layer === "tension"
          ? r.tension === "high"
            ? 0.9
            : r.tension === "medium"
              ? 0.55
              : 0.25
          : layer === "growth" ||
              layer === "highDemand" ||
              layer === "highActivity" ||
              layer === "productMomentum" ||
              layer === "highResponse" ||
              layer === "networkMomentum"
            ? Math.min(1, r.growthPct / 20)
            : layer === "supply" ||
                layer === "activeDistribution" ||
                layer === "activeCorridors" ||
                layer === "distributionCoverage" ||
                layer === "activationZones" ||
                layer === "distributorPush" ||
                layer === "logisticsFlow" ||
                layer === "activeHubs" ||
                layer === "stableCorridors" ||
                layer === "revenueDistribution" ||
                layer === "highCollections" ||
                layer === "intelligentSignals" ||
                layer === "activeAttention" ||
                layer === "corridorWatch"
              ? Math.min(1, r.orderVolume7d / 20000)
              : layer === "lowAvailability" ||
                  layer === "lowCoverage" ||
                  layer === "weakCoverage" ||
                  layer === "deliveryPressure" ||
                  layer === "slowExecution" ||
                  layer === "delayedZones" ||
                  layer === "lowCollections" ||
                  layer === "monitoredZones"
                ? r.tension === "high"
                  ? 0.85
                  : r.tension === "medium"
                    ? 0.5
                    : 0.2
                : layer === "logisticsPressure"
                  ? r.tension === "high"
                    ? 0.9
                    : r.tension === "medium"
                      ? 0.55
                      : 0.3
                  : layer === "productCoverage"
                    ? Math.min(1, (r.wholesalers + r.retailers) / 400)
                    : Math.min(1, (r.wholesalers + r.retailers) / 400);
      return { ...r, intensity };
    });
  }, [layer, regions]);

  const height = compact ? "h-40" : "h-56";

  if (!cells.length) {
    return (
      <div
        className={`producer-industrial-card flex items-center justify-center ${height} text-xs text-slate-500`}
        data-testid={testId ?? "industrial-map-control"}
      >
        Aucune zone cartographiée pour le moment.
      </div>
    );
  }

  return (
    <div
      className={`producer-industrial-card relative overflow-hidden ${height}`}
      data-testid={testId ?? "industrial-map-control"}
      data-map-source={props.dataSource ?? "fallback"}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/30" />
      <svg className="absolute inset-0 h-full w-full opacity-90" viewBox="0 0 400 220" aria-hidden>
        <defs>
          <linearGradient id="pi-corridor" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00a884" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.15" />
          </linearGradient>
        </defs>
        <path
          d="M 80 160 Q 160 80 220 100 T 340 60"
          fill="none"
          stroke="url(#pi-corridor)"
          strokeWidth="2"
          strokeDasharray="6 4"
        />
        {cells.map((c, i) => {
          const x = 60 + (i % 3) * 110 + (i > 2 ? 40 : 0);
          const y = 50 + Math.floor(i / 3) * 70 + (i % 2) * 15;
          const r = 8 + c.intensity * 14;
          const fill =
            (layer === "tension" ||
              layer === "lowAvailability" ||
              layer === "lowCoverage" ||
              layer === "weakCoverage" ||
              layer === "logisticsPressure" ||
              layer === "deliveryPressure" ||
              layer === "slowExecution" ||
              layer === "delayedZones" ||
              layer === "lowCollections" ||
              layer === "monitoredZones") &&
              c.tension === "high"
              ? "rgba(248,113,113,0.75)"
              : (layer === "highDemand" ||
                  layer === "highActivity" ||
                  layer === "highResponse" ||
                  layer === "productMomentum" ||
                  layer === "networkMomentum" ||
                  layer === "intelligentSignals") &&
                c.growthPct >= 12
                ? "rgba(52,211,153,0.75)"
                : (layer === "activeCorridors" ||
                    layer === "distributorPush" ||
                    layer === "logisticsFlow" ||
                    layer === "activeHubs" ||
                    layer === "corridorWatch" ||
                    layer === "activeAttention") &&
                    c.orderVolume7d >= 5000
                  ? "rgba(167,139,250,0.7)"
                  : (layer === "stableCorridors" || layer === "stableZones") && c.tension === "low"
                    ? "rgba(52,211,153,0.7)"
                    : (layer === "highCollections" || layer === "revenueDistribution") &&
                        c.orderVolume7d >= 5000
                      ? "rgba(52,211,153,0.75)"
                      : layer === "activationZones" && c.wholesalers >= 10
                        ? "rgba(52,211,153,0.65)"
                        : `rgba(0,168,132,${0.25 + c.intensity * 0.55})`;
          return <circle key={c.id} cx={x} cy={y} r={r} fill={fill} />;
        })}
      </svg>
      <div className="relative z-10 flex h-full flex-col justify-between p-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
          Carte opérationnelle · {layer}
          {corridors.length > 0 ? (
            <span className="ml-2 text-slate-500">· {corridors.length} corridor(s)</span>
          ) : null}
        </p>
        <ul className="flex flex-wrap gap-2">
          {cells.map((c) => (
            <li
              key={c.id}
              className="rounded border border-slate-700/60 bg-slate-950/70 px-2 py-1 text-[10px] text-slate-300"
            >
              {c.name}
              <span className="ml-1 text-emerald-400/90">
                {layer === "growth" ||
                layer === "highDemand" ||
                layer === "highActivity" ||
                layer === "productMomentum" ||
                layer === "highResponse" ||
                layer === "networkMomentum" ||
                layer === "intelligentSignals"
                  ? `+${c.growthPct}%`
                  : layer === "productCoverage" ||
                      layer === "distributionCoverage" ||
                      layer === "activationZones" ||
                      layer === "distributorPush" ||
                      layer === "activeHubs"
                    ? `${c.wholesalers + c.retailers} pts`
                    : layer === "activeCorridors" ||
                        layer === "logisticsFlow" ||
                        layer === "stableCorridors" ||
                        layer === "revenueDistribution" ||
                        layer === "highCollections" ||
                        layer === "corridorWatch" ||
                        layer === "activeAttention"
                      ? `${Math.round(c.orderVolume7d / 100)}k`
                      : layer === "deliveryPressure" ||
                          layer === "slowExecution" ||
                          layer === "delayedZones" ||
                          layer === "lowCollections"
                        ? `${c.tension === "high" ? "Tension" : "OK"}`
                        : layer === "stableZones" || layer === "monitoredZones"
                          ? c.tension === "high" ? "Suivi" : "Stable"
                          : `${Math.round(c.intensity * 100)}%`}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
