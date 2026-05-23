/**
 * Instruction 20.22 — deterministic territorial thresholds (analytical infrastructure).
 */
import { Injectable } from "@nestjs/common";
import { CommercialCorridorState, RelationalGeoEconomicZoneType } from "@prisma/client";

@Injectable()
export class RelationalGeoEconomicPolicyService {
  clampInt(n: number, min = 0, max = 100): number {
    return Math.max(min, Math.min(max, Math.round(n)));
  }

  maxPropagationDepth(): number {
    const raw = Number(process.env.VENEXT_GEO_PROPAGATION_MAX_DEPTH ?? 8);
    if (!Number.isFinite(raw) || raw < 1) return 8;
    return Math.min(32, Math.max(1, Math.floor(raw)));
  }

  canMutateGeoEconomicState(corridorState: CommercialCorridorState): boolean {
    return corridorState !== CommercialCorridorState.TERMINATED;
  }

  normalizeTerritoryCodes(country: string, city: string): {
    countryCode: string;
    regionCode: string;
    zoneCode: string;
    zoneName: string;
  } {
    const c0 = country.trim() || "ZZ";
    const countryCode = c0
      .normalize("NFKD")
      .replace(/[^\w]/g, "")
      .toUpperCase()
      .slice(0, 8) || "ZZ";
    const city0 = city.trim() || "DEFAULT";
    const regionCode =
      city0
        .normalize("NFKD")
        .replace(/[^\w]/g, "")
        .toUpperCase()
        .slice(0, 8) || "DEFAULT";
    const zoneCode = `GEO:${countryCode}:${regionCode}`;
    const zoneName = `${c0} / ${city0}`.slice(0, 380);
    return { countryCode, regionCode, zoneCode, zoneName };
  }

  zoneTypeFromSignals(crossBorder: boolean, pressureScore: number): RelationalGeoEconomicZoneType {
    if (crossBorder) return RelationalGeoEconomicZoneType.CROSS_BORDER;
    if (pressureScore >= 82) return RelationalGeoEconomicZoneType.METROPOLIS;
    if (pressureScore >= 55) return RelationalGeoEconomicZoneType.REGIONAL_HUB;
    if (pressureScore >= 30) return RelationalGeoEconomicZoneType.PERIPHERAL;
    return RelationalGeoEconomicZoneType.UNKNOWN;
  }
}
