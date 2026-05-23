import { Injectable } from "@nestjs/common";
import { OrgMemberPole } from "@prisma/client";

/** Senegal-ish bounding corridor — demo operational theatre (not ERP data). */
const THEATRE_BBOX = {
  west: -17.6,
  south: 12.2,
  east: -11.2,
  north: 16.9,
};

function jitter(lon: number, lat: number, seed: number) {
  const r = ((seed * 9301 + 49297) % 233280) / 233280;
  const r2 = ((seed * 7919 + 49999) % 233280) / 233280;
  return [lon + (r - 0.5) * 0.8, lat + (r2 - 0.5) * 0.6] as [number, number];
}

@Injectable()
export class DemoOperationalDataService {
  /** GeoJSON FeatureCollection — operational zones (density / tension). */
  operationalZones() {
    const rings: [number, number][][] = [];
    for (let i = 0; i < 6; i++) {
      const [cx, cy] = jitter(-15.2, 14.5, i + 11);
      const d = 0.35 + (i % 3) * 0.08;
      rings.push([
        [cx - d, cy - d],
        [cx + d, cy - d],
        [cx + d, cy + d],
        [cx - d, cy + d],
        [cx - d, cy - d],
      ]);
    }
    return {
      type: "FeatureCollection" as const,
      features: rings.map((coords, i) => ({
        type: "Feature" as const,
        id: `zone-op-${i}`,
        properties: {
          tension: 0.35 + (i % 4) * 0.14,
          label: `Operational cell ${i + 1}`,
          demandSpike: i % 2 === 0,
        },
        geometry: { type: "Polygon" as const, coordinates: [coords] },
      })),
    };
  }

  logisticsRoutes() {
    const paths: [number, number][][] = [];
    for (let i = 0; i < 5; i++) {
      const a = jitter(-16.8, 13.1, i + 3);
      const b = jitter(-14.2, 15.8, i + 31);
      const c = jitter(-12.9, 14.2, i + 57);
      paths.push([a, b, c]);
    }
    return {
      type: "FeatureCollection" as const,
      features: paths.map((coordinates, i) => ({
        type: "Feature" as const,
        id: `route-${i}`,
        properties: {
          etaRisk: [0.2, 0.45, 0.72, 0.55, 0.33][i],
          anomaly: i === 2,
          label: `Corridor ${i + 1}`,
        },
        geometry: { type: "LineString" as const, coordinates },
      })),
    };
  }

  weatherSignals() {
    return [
      {
        id: "wx-1",
        kind: "heat_stress",
        severity: "MEDIUM",
        zoneCode: "SN-THIES",
        summary: "Elevated diurnal heat — expect afternoon consumption shift (beverages).",
      },
      {
        id: "wx-2",
        kind: "harmattan_dust",
        severity: "LOW",
        zoneCode: "SN-DKR-01",
        summary: "Reduced visibility window 06:00–10:00 — logistics dwell +12m baseline.",
      },
    ];
  }

  stockTension() {
    return [
      { sku: "HU-5L-CRT", zone: "SN-DKR-01", tension: 0.88, horizonHours: 18 },
      { sku: "BOISS-LOC-01", zone: "SN-THIES", tension: 0.52, horizonHours: 64 },
    ];
  }

  paymentDelays() {
    return [
      { zone: "SN-ZIG", pressure: 0.71, unpaidShare: 0.19, walletVelocity: 0.42 },
      { zone: "SN-DKR-01", pressure: 0.38, unpaidShare: 0.08, walletVelocity: 0.81 },
    ];
  }

  emergencyEvents() {
    return [
      {
        id: "em-1",
        type: "industrial_incident",
        priority: "HIGH",
        lonlat: jitter(-15.9, 14.8, 99),
        summary: "Thermal excursion — line B cooldown extended 22m (mock).",
      },
      {
        id: "em-2",
        type: "hydrant_audit",
        priority: "MEDIUM",
        lonlat: jitter(-16.4, 13.9, 101),
        summary: "Hydrant proximity check — zone cleared for convoy routing.",
      },
    ];
  }

  demandSpikes() {
    return [
      { zone: "SN-DKR-01", spike: 1.34, driver: "pre_ramadan_basket" },
      { zone: "SN-THIES", spike: 1.12, driver: "regional_campaign_push" },
    ];
  }

  bundleForPole(pole: OrgMemberPole) {
    return {
      pole,
      bbox: THEATRE_BBOX,
      generatedAt: new Date().toISOString(),
      zones: this.operationalZones(),
      routes: this.logisticsRoutes(),
      weatherSignals: this.weatherSignals(),
      stockTension: this.stockTension(),
      paymentDelays: this.paymentDelays(),
      emergencyEvents: this.emergencyEvents(),
      demandSpikes: this.demandSpikes(),
    };
  }
}
