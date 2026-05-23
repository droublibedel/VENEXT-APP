import { Injectable } from "@nestjs/common";
import type { RelationalGeoEconomicZone } from "@prisma/client";

import { RelationalGeoEconomicPolicyService } from "./relational-geo-economic-policy.service";

export type GeoPressureZoneSlice = Pick<
  RelationalGeoEconomicZone,
  "zoneCode" | "economicPressureScore" | "corridorCount" | "systemicExposureScore" | "operationalDensityScore"
>;

export type GeoPressureDetection = {
  pressureLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  congestedZoneCodes: string[];
  corridorConcentrationCodes: string[];
  propagationPressureCodes: string[];
  diagnostics: string[];
};

/**
 * Instruction 20.22 — regional pressure heuristics (observational).
 */
@Injectable()
export class RelationalGeoEconomicPressureService {
  constructor(private readonly policy: RelationalGeoEconomicPolicyService) {}

  detectPressureZones(zones: GeoPressureZoneSlice[]): GeoPressureDetection {
    const congestedZoneCodes: string[] = [];
    const corridorConcentrationCodes: string[] = [];
    const propagationPressureCodes: string[] = [];
    const diagnostics: string[] = [];
    let peak = 0;
    for (const z of zones) {
      peak = Math.max(peak, z.economicPressureScore);
      if (z.economicPressureScore >= 72 && z.zoneCode) {
        congestedZoneCodes.push(z.zoneCode);
        diagnostics.push(`regional_saturation:${z.zoneCode}`);
      }
      if (z.corridorCount >= 10 && z.zoneCode) {
        corridorConcentrationCodes.push(z.zoneCode);
        diagnostics.push(`corridor_concentration:${z.zoneCode}`);
      }
      if (z.systemicExposureScore >= 68 && z.zoneCode) {
        propagationPressureCodes.push(z.zoneCode);
        diagnostics.push(`territorial_propagation_pressure:${z.zoneCode}`);
      }
      if (z.operationalDensityScore >= 80 && z.zoneCode) {
        diagnostics.push(`operational_saturation:${z.zoneCode}`);
      }
    }
    const pressureLevel =
      peak >= 88 ? "CRITICAL" : peak >= 68 ? "HIGH" : peak >= 42 ? "MEDIUM" : "LOW";
    return {
      pressureLevel,
      congestedZoneCodes: congestedZoneCodes.slice(0, 40),
      corridorConcentrationCodes: corridorConcentrationCodes.slice(0, 40),
      propagationPressureCodes: propagationPressureCodes.slice(0, 40),
      diagnostics: diagnostics.slice(0, 24),
    };
  }

  economicPressureScoreFromVector(det: GeoPressureDetection, avgCorridor: number): number {
    const base =
      (det.congestedZoneCodes.length * 14 + det.corridorConcentrationCodes.length * 11 + avgCorridor * 3) / 1.45;
    return this.policy.clampInt(base);
  }
}
