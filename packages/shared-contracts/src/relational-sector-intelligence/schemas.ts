import { type ZodError, z } from "zod";

const disabledFlags = {
  paymentExecutionDisabled: z.literal(true),
  publicTrackingDisabled: z.literal(true),
} as const;

export const RelationalSectorTypeSchema = z.enum([
  "PRIMARY_INDUSTRY",
  "SECONDARY_VALUE_ADD",
  "DISTRIBUTION_LOGISTICS",
  "SERVICES",
  "MIXED_CROSS_SECTOR",
  "UNKNOWN",
]);

export const RelationalSectorPressureLevelSchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

export const RelationalSectorConcentrationLevelSchema = z.enum([
  "DISPERSED",
  "MODERATE",
  "CONCENTRATED",
  "DOMINANT",
]);

export const RelationalSectorSignalTypeSchema = z.enum([
  "SECTOR_PRESSURE_ALERT",
  "DEPENDENCY_SPIKE",
  "CONCENTRATION_WARNING",
  "PROPAGATION_ALERT",
  "MARKET_FRAGILITY",
  "EXPANSION_READING",
  "SYSTEMIC_SECTOR_RISK",
]);

export const RelationalSectorDependencyTypeSchema = z.enum([
  "UPSTREAM_SUPPLY",
  "DOWNSTREAM_DEMAND",
  "SHARED_INFRASTRUCTURE",
  "TERRITORIAL_OVERLAP",
  "CORRIDOR_CO_MOVEMENT",
  "CROSS_SECTOR_EXPOSURE",
]);

export const RelationalSectorMarketStructureTypeSchema = z.enum([
  "COMPETITIVE_FRAGMENTED",
  "MODERATE_OLIGOPOLY",
  "TIGHT_OLIGOPOLY",
  "MONOPSONY_RISK",
  "BALANCED",
  "UNKNOWN",
]);

export const RelationalSectorNodeSchema = z
  .object({
    id: z.string().uuid(),
    relationshipId: z.string().uuid(),
    sectorCode: z.string().min(1).max(200),
    sectorType: RelationalSectorTypeSchema,
    sectorName: z.string().min(1).max(400),
    sectorSlug: z.string().min(1).max(120),
    territoryCountry: z.string().min(1).max(120),
    territoryCity: z.string().min(1).max(200),
    marketStructureType: RelationalSectorMarketStructureTypeSchema,
    concentrationLevel: RelationalSectorConcentrationLevelSchema,
    pressureLevel: RelationalSectorPressureLevelSchema,
    operationalRiskScore: z.number().int().min(0).max(100),
    expansionPotentialScore: z.number().int().min(0).max(100),
    fragilityScore: z.number().int().min(0).max(100),
    dependencyScore: z.number().int().min(0).max(100),
    active: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export type RelationalSectorNodeDto = z.infer<typeof RelationalSectorNodeSchema>;

/** Instruction 20.23 — sector dependency wire (distinct from 20.21 pressure dependency DTO naming). */
export const DependencySchema = z
  .object({
    id: z.string().uuid(),
    sourceSectorId: z.string().uuid(),
    targetSectorId: z.string().uuid(),
    dependencyType: RelationalSectorDependencyTypeSchema,
    dependencyStrength: z.number().int().min(0).max(100),
    propagationProbability: z.number().min(0).max(1),
    riskTransferScore: z.number().int().min(0).max(100),
    sharedPressureScore: z.number().int().min(0).max(100),
    createdAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export type SectorDependencyDto = z.infer<typeof DependencySchema>;

export const SignalSchema = z
  .object({
    id: z.string().uuid(),
    relationshipId: z.string().uuid(),
    sectorNodeId: z.string().uuid(),
    signalType: RelationalSectorSignalTypeSchema,
    severity: z.string().min(1).max(16),
    title: z.string().min(1).max(400),
    description: z.string().min(1).max(4000),
    signalScore: z.number().int().min(0).max(100),
    propagationRisk: z.number().int().min(0).max(100),
    pressureContribution: z.number().int().min(0).max(100),
    createdAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export type SectorSignalDto = z.infer<typeof SignalSchema>;

export const OverviewSchema = z
  .object({
    relationshipId: z.string().uuid(),
    nodes: z.array(RelationalSectorNodeSchema).max(24),
    narrative: z.string().max(1200),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export type SectorOverviewDto = z.infer<typeof OverviewSchema>;

export const TerritorySectorOverviewSchema = z
  .object({
    relationshipId: z.string().uuid(),
    territoryCodes: z.array(z.string().max(160)).max(40),
    sectorSlugs: z.array(z.string().max(120)).max(40),
    crossTerritoryExposure: z.number().int().min(0).max(100),
    diagnostics: z.array(z.string().max(400)).max(24),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const MarketStructureVectorSchema = z
  .object({
    sectorConcentration: z.number().int().min(0).max(100),
    corridorSaturation: z.number().int().min(0).max(100),
    sectorDominance: z.number().int().min(0).max(100),
    criticalDependency: z.number().int().min(0).max(100),
    oligopolyRisk: z.number().int().min(0).max(100),
    marketFragility: z.number().int().min(0).max(100),
    operationalDensity: z.number().int().min(0).max(100),
    cumulativePressure: z.number().int().min(0).max(100),
    expansionCapacity: z.number().int().min(0).max(100),
    diversificationGap: z.number().int().min(0).max(100),
    explainers: z.array(z.string().max(500)).max(20),
    ...disabledFlags,
  })
  .strict();

export const MarketStructureOverviewSchema = z
  .object({
    relationshipId: z.string().uuid(),
    marketStructureType: RelationalSectorMarketStructureTypeSchema,
    vector: MarketStructureVectorSchema,
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const SectorPressureOverviewSchema = z
  .object({
    relationshipId: z.string().uuid(),
    pressureBands: z
      .array(
        z
          .object({
            sectorSlug: z.string().max(120),
            pressureLevel: RelationalSectorPressureLevelSchema,
            score: z.number().int().min(0).max(100),
          })
          .strict(),
      )
      .max(24),
    cumulative: z.number().int().min(0).max(100),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const DependencyMapOverviewSchema = z
  .object({
    relationshipId: z.string().uuid(),
    nodes: z.array(RelationalSectorNodeSchema).max(24),
    edges: z.array(DependencySchema).max(48),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const SectorPropagationMapSchema = z
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
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const SectorExpansionOpportunitiesSchema = z
  .object({
    relationshipId: z.string().uuid(),
    opportunities: z
      .array(
        z
          .object({
            sectorSlug: z.string().max(120),
            score: z.number().int().min(0).max(100),
            narrative: z.string().max(600),
          })
          .strict(),
      )
      .max(20),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const SystemicSectorRiskSchema = z
  .object({
    relationshipId: z.string().uuid(),
    riskScore: z.number().int().min(0).max(100),
    drivers: z.array(z.string().max(400)).max(16),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const SectorRealtimeSchema = z
  .object({
    relationshipId: z.string().uuid().nullable(),
    sectorNodeId: z.string().uuid().nullable(),
    sectorCode: z.string().max(200).nullable(),
    intensity: z.number().int().min(0).max(100),
    propagationDepth: z.number().int().min(0).max(64),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

/** Instruction 20.24 — structured sector streaming (snapshot / delta, idempotence-friendly). */
export const SectorScoreUpdatedPayloadSchema = z
  .object({
    eventId: z.string().uuid(),
    fingerprint: z.string().min(8).max(128),
    streamRevision: z.number().int().min(0).max(1_000_000_000),
    relationshipId: z.string().uuid(),
    kind: z.enum(["snapshot", "delta"]),
    sectorNodeId: z.string().uuid().nullable(),
    operationalRiskScore: z.number().int().min(0).max(100),
    pressureLevel: RelationalSectorPressureLevelSchema,
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const SectorPropagationUpdatedPayloadSchema = z
  .object({
    eventId: z.string().uuid(),
    fingerprint: z.string().min(8).max(128),
    streamRevision: z.number().int().min(0).max(1_000_000_000),
    relationshipId: z.string().uuid(),
    kind: z.enum(["snapshot", "delta"]),
    maxDepthObserved: z.number().int().min(0).max(64),
    pathCount: z.number().int().min(0).max(256),
    systemicExposureScore: z.number().int().min(0).max(100),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const SectorDependencyUpdatedPayloadSchema = z
  .object({
    eventId: z.string().uuid(),
    fingerprint: z.string().min(8).max(128),
    streamRevision: z.number().int().min(0).max(1_000_000_000),
    relationshipId: z.string().uuid(),
    kind: z.enum(["snapshot", "delta"]),
    edgeCount: z.number().int().min(0).max(256),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const SectorMarketStructureUpdatedPayloadSchema = z
  .object({
    eventId: z.string().uuid(),
    fingerprint: z.string().min(8).max(128),
    streamRevision: z.number().int().min(0).max(1_000_000_000),
    relationshipId: z.string().uuid(),
    kind: z.enum(["snapshot", "delta"]),
    marketStructureType: RelationalSectorMarketStructureTypeSchema,
    sectorConcentration: z.number().int().min(0).max(100),
    corridorSaturation: z.number().int().min(0).max(100),
    marketFragility: z.number().int().min(0).max(100),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const SectorSnapshotUpdatedPayloadSchema = z
  .object({
    eventId: z.string().uuid(),
    fingerprint: z.string().min(8).max(128),
    streamRevision: z.number().int().min(0).max(1_000_000_000),
    relationshipId: z.string().uuid(),
    kind: z.literal("snapshot"),
    nodeCount: z.number().int().min(0).max(64),
    sectorSlugs: z.array(z.string().max(120)).max(24),
    aggregateOperationalRisk: z.number().int().min(0).max(100),
    marketStructureType: RelationalSectorMarketStructureTypeSchema,
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RELATIONAL_SECTOR_LEGACY_REALTIME_TYPES = [
  "relational.sector.signal_created",
  "relational.sector.pressure_detected",
  "relational.sector.propagation_detected",
  "relational.sector.market_fragility_detected",
  "relational.sector.expansion_opportunity_detected",
  "relational.sector.systemic_sector_risk",
] as const;

export const RELATIONAL_SECTOR_STRUCTURED_REALTIME_TYPES = [
  "relational.sector.score.updated",
  "relational.sector.propagation.updated",
  "relational.sector.dependency.updated",
  "relational.sector.marketStructure.updated",
  "relational.sector.snapshot.updated",
] as const;

export type SectorScoreUpdatedPayloadDto = z.infer<typeof SectorScoreUpdatedPayloadSchema>;
export type SectorPropagationUpdatedPayloadDto = z.infer<typeof SectorPropagationUpdatedPayloadSchema>;
export type SectorDependencyUpdatedPayloadDto = z.infer<typeof SectorDependencyUpdatedPayloadSchema>;
export type SectorMarketStructureUpdatedPayloadDto = z.infer<typeof SectorMarketStructureUpdatedPayloadSchema>;
export type SectorSnapshotUpdatedPayloadDto = z.infer<typeof SectorSnapshotUpdatedPayloadSchema>;

export type RelationalSectorRealtimeFanoutBodyDto =
  | z.infer<typeof SectorRealtimeSchema>
  | SectorScoreUpdatedPayloadDto
  | SectorPropagationUpdatedPayloadDto
  | SectorDependencyUpdatedPayloadDto
  | SectorMarketStructureUpdatedPayloadDto
  | SectorSnapshotUpdatedPayloadDto;

export function safeParseRelationalSectorRealtimeBody(
  eventType: string,
  body: unknown,
):
  | { ok: true; data: RelationalSectorRealtimeFanoutBodyDto }
  | { ok: false; error: ZodError | { message: string } } {
  if ((RELATIONAL_SECTOR_LEGACY_REALTIME_TYPES as readonly string[]).includes(eventType)) {
    const r = SectorRealtimeSchema.safeParse(body);
    return r.success ? { ok: true, data: r.data } : { ok: false, error: r.error };
  }
  if (eventType === "relational.sector.score.updated") {
    const r = SectorScoreUpdatedPayloadSchema.safeParse(body);
    return r.success ? { ok: true, data: r.data } : { ok: false, error: r.error };
  }
  if (eventType === "relational.sector.propagation.updated") {
    const r = SectorPropagationUpdatedPayloadSchema.safeParse(body);
    return r.success ? { ok: true, data: r.data } : { ok: false, error: r.error };
  }
  if (eventType === "relational.sector.dependency.updated") {
    const r = SectorDependencyUpdatedPayloadSchema.safeParse(body);
    return r.success ? { ok: true, data: r.data } : { ok: false, error: r.error };
  }
  if (eventType === "relational.sector.marketStructure.updated") {
    const r = SectorMarketStructureUpdatedPayloadSchema.safeParse(body);
    return r.success ? { ok: true, data: r.data } : { ok: false, error: r.error };
  }
  if (eventType === "relational.sector.snapshot.updated") {
    const r = SectorSnapshotUpdatedPayloadSchema.safeParse(body);
    return r.success ? { ok: true, data: r.data } : { ok: false, error: r.error };
  }
  return { ok: false, error: { message: "relational_sector_realtime_unhandled_type" } };
}

export const SectorArchiveSignalRequestSchema = z
  .object({
    archiveReason: z.string().min(1).max(4000),
  })
  .strict();

export const ActionResponseSchema = z
  .object({
    signal: SignalSchema,
    ...disabledFlags,
  })
  .strict();

export type MarketStructureOverviewDto = z.infer<typeof MarketStructureOverviewSchema>;
export type SectorPropagationMapDto = z.infer<typeof SectorPropagationMapSchema>;
export type SectorPressureOverviewDto = z.infer<typeof SectorPressureOverviewSchema>;
export type SectorExpansionOpportunitiesDto = z.infer<typeof SectorExpansionOpportunitiesSchema>;
export type DependencyMapOverviewDto = z.infer<typeof DependencyMapOverviewSchema>;
export type SystemicSectorRiskDto = z.infer<typeof SystemicSectorRiskSchema>;
export type SectorRealtimeDto = z.infer<typeof SectorRealtimeSchema>;

export const RELATIONAL_SECTOR_REALTIME_TYPES = [
  ...RELATIONAL_SECTOR_LEGACY_REALTIME_TYPES,
  ...RELATIONAL_SECTOR_STRUCTURED_REALTIME_TYPES,
] as const;

export type RelationalSectorRealtimeEventType = (typeof RELATIONAL_SECTOR_REALTIME_TYPES)[number];

export function isRelationalSectorRealtimeEventType(
  eventType: string,
): eventType is RelationalSectorRealtimeEventType {
  return (RELATIONAL_SECTOR_REALTIME_TYPES as readonly string[]).includes(eventType);
}
