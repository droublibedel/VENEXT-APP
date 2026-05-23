"use client";

import { useEffect, useRef } from "react";
import type { PoleRegistryEntry } from "../registry";

type GeoFC = {
  type: "FeatureCollection";
  features: unknown[];
};

type Props = {
  lowPower: boolean;
  zones: GeoFC;
  routes: GeoFC;
  emphasis: PoleRegistryEntry["mapEmphasis"];
  /** When false, skip Mapbox init — policy / low-RAM theatres (Instruction 5 §11). */
  mapLayersEnabled?: boolean;
  /** Pole-specific command vocabulary chips (Instruction 5 §4). */
  commandFamilies?: string[];
};

/**
 * Operational Mapbox cockpit — not a generic maps wrapper (Instruction 5 §3).
 */
export function MapControlEngine({
  lowPower,
  zones,
  routes,
  emphasis,
  mapLayersEnabled = true,
  commandFamilies = [],
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!el || !token || !mapLayersEnabled) return;

    let mapInstance: { remove: () => void } | undefined;
    let cancelled = false;

    void import("mapbox-gl").then((mapboxgl) => {
      if (cancelled || !el) return;
      mapboxgl.default.accessToken = token;
      const map = new mapboxgl.default.Map({
        container: el,
        style: "mapbox://styles/mapbox/dark-v11",
        center: [-15.5, 14.7],
        zoom: lowPower ? 6.1 : 6.7,
        attributionControl: false,
        pitch: lowPower ? 0 : 38,
        bearing: lowPower ? 0 : -12,
        dragRotate: !lowPower,
      });
      mapInstance = map;
      map.addControl(
        new mapboxgl.default.NavigationControl({ showCompass: false }),
        "bottom-right",
      );

      map.on("load", () => {
        if (cancelled) return;
        map.addSource("vx-zones", { type: "geojson", data: zones as never });
        map.addSource("vx-routes", { type: "geojson", data: routes as never });

        if (emphasis === "heatmap" || emphasis === "network") {
          map.addLayer({
            id: "vx-zones-fill",
            type: "fill",
            source: "vx-zones",
            paint: {
              "fill-color": [
                "interpolate",
                ["linear"],
                ["get", "tension"],
                0,
                "#020617",
                1,
                "#f59e0b",
              ],
              "fill-opacity": lowPower ? 0.32 : 0.48,
            },
          });
        } else {
          map.addLayer({
            id: "vx-zones-line",
            type: "line",
            source: "vx-zones",
            paint: {
              "line-color": "#38bdf8",
              "line-width": 1.1,
              "line-opacity": 0.65,
            },
          });
        }

        map.addLayer({
          id: "vx-routes-core",
          type: "line",
          source: "vx-routes",
          paint: {
            "line-color": [
              "case",
              ["==", ["get", "anomaly"], true],
              "#fb7185",
              "#34d399",
            ],
            "line-width": lowPower ? 2 : 3.2,
            "line-opacity": 0.9,
          },
        });
      });
    });

    return () => {
      cancelled = true;
      mapInstance?.remove();
      mapInstance = undefined;
    };
  }, [lowPower, zones, routes, emphasis, mapLayersEnabled]);

  return (
    <div className="relative h-full min-h-[280px] w-full overflow-hidden rounded-md border border-cyan-500/20 bg-gradient-to-b from-slate-950 via-slate-900 to-black">
      <div ref={ref} className="h-full w-full" />
      {!mapLayersEnabled ? (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 px-4 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300/90">
            Logistics map disabled
          </p>
          <p className="max-w-sm text-xs text-slate-300/90">
            Feature flag <span className="font-mono">logistics_map_enabled</span> is off —
            tactical frame only.
          </p>
        </div>
      ) : !process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 px-4 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300/90">
            MapControlEngine — offline frame
          </p>
          <p className="max-w-sm text-xs text-slate-300/90">
            Set <span className="font-mono">NEXT_PUBLIC_MAPBOX_TOKEN</span> for live
            operational tiles.
          </p>
        </div>
      ) : null}
      <div className="pointer-events-none absolute left-2 top-2 max-w-[46%] space-y-1 rounded border border-cyan-500/25 bg-black/55 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-cyan-100/90">
        <p>Legend: anomaly route · nominal · tension field</p>
        {commandFamilies.length > 0 ? (
          <p className="normal-case text-[9px] leading-snug text-cyan-200/80">
            Commands: {commandFamilies.slice(0, 4).join(" · ")}
            {commandFamilies.length > 4 ? "…" : ""}
          </p>
        ) : null}
      </div>
    </div>
  );
}
