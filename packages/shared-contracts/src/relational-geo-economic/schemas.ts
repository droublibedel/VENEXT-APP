import { z } from "zod";

const disabledFlags = {
  paymentExecutionDisabled: z.literal(true),
  publicTrackingDisabled: z.literal(true),
} as const;

export const RelationalGeoEconomicZoneTypeSchema = z.enum([
  "METROPOLIS",
  "REGIONAL_HUB",
  "PERIPHERAL",
  "CROSS_BORDER",
  "SPECIAL_ECONOMIC",
  "UNKNOWN",
]);

export const RelationalGeoEconomicPressureLevelSchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

export const RelationalGeoEconomicDensityLevelSchema = z.enum(["SPARSE", "BALANCED", "CONCENTRATED", "SATURATED"]);

export const GeoEconomicZoneSchema = z
  .object({
    id: z.string().uuid(),
    zoneCode: z.string().min(1).max(160),
    zoneName: z.string().min(1).max(400),
    zoneType: RelationalGeoEconomicZoneTypeSchema,
    countryCode: z.string().min(1).max(8),
    regionCode: z.string().min(1).max(32),
    operationalDensityScore: z.number().int().min(0).max(100),
    economicPressureScore: z.number().int().min(0).max(100),
    systemicExposureScore: z.number().int().min(0).max(100),
    expansionPotentialScore: z.number().int().min(0).max(100),
    fragilityScore: z.number().int().min(0).max(100),
    corridorCount: z.number().int().min(0).max(5000),
    activeClusterCount: z.number().int().min(0).max(5000),
    createdAt: z.string(),
    updatedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export type GeoEconomicZoneDto = z.infer<typeof GeoEconomicZoneSchema>;

export const GeoEconomicOverviewSchema = z
  .object({
    organizationId: z.string().uuid(),
    zoneCount: z.number().int().min(0).max(5000),
    averagePressureScore: z.number().int().min(0).max(100),
    averageDensityScore: z.number().int().min(0).max(100),
    dominantTerritorialNarrative: z.string().max(800),
    zones: z.array(GeoEconomicZoneSchema).max(80),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export type GeoEconomicOverviewDto = z.infer<typeof GeoEconomicOverviewSchema>;

export const GeoEconomicExpansionOverviewSchema = z
  .object({
    organizationId: z.string().uuid(),
    rankedZones: z.array(GeoEconomicZoneSchema).max(24),
    narrative: z.string().max(800),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export type GeoEconomicExpansionOverviewDto = z.infer<typeof GeoEconomicExpansionOverviewSchema>;

export const GeoEconomicPressureSchema = z
  .object({
    organizationId: z.string().uuid(),
    pressureLevel: RelationalGeoEconomicPressureLevelSchema,
    congestedZoneCodes: z.array(z.string().max(160)).max(40),
    corridorConcentrationCodes: z.array(z.string().max(160)).max(40),
    regionalSaturationScore: z.number().int().min(0).max(100),
    operationalSaturationScore: z.number().int().min(0).max(100),
    propagationPressureCodes: z.array(z.string().max(160)).max(40),
    diagnostics: z.array(z.string().max(400)).max(24),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export type GeoEconomicPressureDto = z.infer<typeof GeoEconomicPressureSchema>;

export const GeoEconomicPropagationSchema = z
  .object({
    relationshipId: z.string().uuid(),
    maxDepthObserved: z.number().int().min(0).max(64),
    cascadePaths: z
      .array(
        z
          .object({
            path: z.array(z.string().uuid()).max(32),
            territorialImpactScore: z.number().int().min(0).max(100),
          })
          .strict(),
      )
      .max(48),
    exposureByZoneCode: z
      .array(
        z
          .object({
            zoneCode: z.string().max(160),
            exposureScore: z.number().int().min(0).max(100),
          })
          .strict(),
      )
      .max(60),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export type GeoEconomicPropagationDto = z.infer<typeof GeoEconomicPropagationSchema>;

export const GeoEconomicClusterSchema = z
  .object({
    clusterCode: z.string().min(1).max(160),
    zoneCodes: z.array(z.string().max(160)).max(24),
    clusterIntensity: z.number().int().min(0).max(100),
    narrative: z.string().max(800),
    ...disabledFlags,
  })
  .strict();

export type GeoEconomicClusterDto = z.infer<typeof GeoEconomicClusterSchema>;

export const GeoEconomicRealtimeSchema = z
  .object({
    relationshipId: z.string().uuid().nullable(),
    zoneCode: z.string().max(160).nullable(),
    territorialIntensity: z.number().int().min(0).max(100),
    propagationDepth: z.number().int().min(0).max(64),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export type GeoEconomicRealtimeDto = z.infer<typeof GeoEconomicRealtimeSchema>;

export const GeoEconomicArchiveZoneRequestSchema = z
  .object({
    archiveReason: z.string().min(1).max(4000),
  })
  .strict();

export const GeoEconomicActionResponseSchema = z
  .object({
    zone: GeoEconomicZoneSchema,
    ...disabledFlags,
  })
  .strict();

export type GeoEconomicActionResponseDto = z.infer<typeof GeoEconomicActionResponseSchema>;

export const GeoEconomicCriticalZonesSchema = z
  .object({
    organizationId: z.string().uuid(),
    zones: z.array(GeoEconomicZoneSchema).max(40),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export type GeoEconomicCriticalZonesDto = z.infer<typeof GeoEconomicCriticalZonesSchema>;

export const RELATIONAL_GEO_ECONOMIC_REALTIME_TYPES = [
  "relational.geo.zone_pressure_detected",
  "relational.geo.cluster_detected",
  "relational.geo.propagation_detected",
  "relational.geo.expansion_detected",
  "relational.geo.critical_zone_detected",
] as const;

export type RelationalGeoEconomicRealtimeEventType = (typeof RELATIONAL_GEO_ECONOMIC_REALTIME_TYPES)[number];

export function isRelationalGeoEconomicRealtimeEventType(
  eventType: string,
): eventType is RelationalGeoEconomicRealtimeEventType {
  return (RELATIONAL_GEO_ECONOMIC_REALTIME_TYPES as readonly string[]).includes(eventType);
}
