import { useMemo } from "react";

import type { GrossisteADataSource, GrossisteAMapDto } from "../hooks/grossiste-a-data.types";
import { GROSSISTE_A_REGIONS } from "../mocks/grossiste-a-mock-data";

export type GrossisteAMapLayer =
  | "grossisteDistribution"
  | "corridorPressure"
  | "activeCities"
  | "stableZones"
  | "weakCoverage"
  | "activity";

export function IndustrialMapControlSystem(props: {
  layer?: GrossisteAMapLayer;
  compact?: boolean;
  testId?: string;
  data?: GrossisteAMapDto;
  dataSource?: GrossisteADataSource;
}) {
  const { layer = "grossisteDistribution", compact = false, testId, data } = props;
  const regions = data?.regions?.length ? data.regions : GROSSISTE_A_REGIONS;
  const corridors = data?.corridors ?? [];

  const cells = useMemo(() => {
    return regions.map((r) => {
      let intensity: number;
      if (layer === "corridorPressure" || layer === "weakCoverage") {
        intensity = r.tension === "high" ? 0.9 : r.tension === "medium" ? 0.55 : 0.25;
      } else if (layer === "activeCities" || layer === "grossisteDistribution") {
        intensity = Math.min(1, r.orderVolume7d / 20000);
      } else if (layer === "stableZones") {
        intensity = r.tension === "low" ? 0.75 : 0.35;
      } else {
        intensity = Math.min(1, (r.wholesalers + r.retailers) / 400);
      }
      return { ...r, intensity };
    });
  }, [layer, regions]);

  const height = compact ? 160 : 220;

  if (!cells.length) {
    return (
      <div className="ga-card" style={{ height, display: "flex", alignItems: "center", justifyContent: "center" }} data-testid={testId ?? "grossiste-a-map"}>
        <span style={{ fontSize: 12, color: "#8fa39a" }}>Aucune zone cartographiée.</span>
      </div>
    );
  }

  return (
    <div className="ga-card" style={{ position: "relative", overflow: "hidden", height }} data-testid={testId ?? "grossiste-a-map"} data-map-source={props.dataSource ?? "fallback"}>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #0b1412, #0e1a17 50%, rgba(0,168,132,0.08))" }} />
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.9 }} viewBox="0 0 400 220" aria-hidden>
        <path d="M 80 160 Q 160 80 220 100 T 340 60" fill="none" stroke="rgba(0,168,132,0.4)" strokeWidth="2" strokeDasharray="6 4" />
        {cells.map((c, i) => {
          const x = 60 + (i % 3) * 110 + (i > 2 ? 40 : 0);
          const y = 50 + Math.floor(i / 3) * 70;
          const rad = 8 + c.intensity * 14;
          const fill =
            layer === "weakCoverage" || layer === "corridorPressure"
              ? c.tension === "high"
                ? "rgba(248,113,113,0.75)"
                : "rgba(0,168,132,0.45)"
              : layer === "stableZones"
                ? "rgba(52,211,153,0.7)"
                : `rgba(0,168,132,${0.25 + c.intensity * 0.55})`;
          return <circle key={c.id} cx={x} cy={y} r={rad} fill={fill} />;
        })}
      </svg>
      <div style={{ position: "relative", zIndex: 1, padding: 12, display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}>
        <p style={{ margin: 0, fontSize: 10, fontWeight: 600, letterSpacing: "0.2em", color: "#8fa39a", textTransform: "uppercase" }}>
          Carte distribution · {layer}
          {corridors.length > 0 ? ` · ${corridors.length} corridor(s)` : ""}
        </p>
        <ul style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: 0, padding: 0, listStyle: "none" }}>
          {cells.map((c) => (
            <li key={c.id} style={{ fontSize: 10, padding: "4px 8px", borderRadius: 6, background: "rgba(11,20,18,0.85)", border: "1px solid rgba(0,168,132,0.15)", color: "#b8cdc4" }}>
              {c.name}
              <span style={{ marginLeft: 6, color: "#00a884" }}>
                {layer === "activeCities" || layer === "grossisteDistribution"
                  ? `${Math.round(c.orderVolume7d / 100)}k`
                  : layer === "stableZones"
                    ? c.tension === "low"
                      ? "Stable"
                      : "Suivi"
                    : `${Math.round(c.intensity * 100)}%`}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
