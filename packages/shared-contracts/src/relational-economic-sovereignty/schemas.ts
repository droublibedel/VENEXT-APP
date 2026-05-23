import { z } from "zod";

const disabledFlags = {
  paymentExecutionDisabled: z.literal(true),
  publicTrackingDisabled: z.literal(true),
} as const;

export const RelationalEconomicSovereigntySeveritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const RelationalEconomicAutonomyStatusSchema = z.enum([
  "SOVEREIGN",
  "BALANCED",
  "DEPENDENT",
  "CAPTIVE",
  "CRITICAL",
]);
export const RelationalEconomicDependencyExposureSchema = z.enum([
  "MINIMAL",
  "MODERATE",
  "ELEVATED",
  "CRITICAL",
  "SYSTEMIC",
]);
export const RelationalEconomicSovereigntySignalTypeSchema = z.enum([
  "AUTONOMY_DEGRADATION",
  "DEPENDENCY_CONCENTRATION",
  "CAPTIVITY_RISK",
  "RECOVERY_AUTONOMY",
  "SYSTEMIC_EXPOSURE",
  "EXTERNAL_DEPENDENCY",
  "LONG_TERM_CAPTURE",
  "SUPPLY_INDEPENDENCE_STRESS",
]);

export const RelationalEconomicSovereigntyRecoveryDiagnosticsSchema = z
  .object({
    traversalDepth: z.number().int().min(0).max(64),
    visitedNodes: z.number().int().min(0).max(512),
    dependencyTraversalCount: z.number().int().min(0).max(100000),
    boundedTraversalApplied: z.boolean(),
    autonomyExposure: z.number().int().min(0).max(100),
    recoveryComplexity: z.number().int().min(0).max(100),
  })
  .strict();

export const RelationalEconomicSovereigntyOverviewDiagnosticsSchema = z
  .object({
    heuristicFallbackUsed: z.boolean(),
    fallbackReasons: z.array(z.string().min(1).max(200)).max(32),
    continuitySnapshotsUsed: z.number().int().min(0).max(50000),
    macroDependenciesUsed: z.number().int().min(0).max(50000),
    supplyFlowEdgesUsed: z.number().int().min(0).max(50000),
    strategicMemoriesUsed: z.number().int().min(0).max(50000),
    recoveryTraversal: RelationalEconomicSovereigntyRecoveryDiagnosticsSchema,
  })
  .strict();

const sovereigntyNodeWireSchema = z
  .object({
    id: z.string().uuid(),
    relationshipId: z.string().uuid(),
    sovereigntyNodeCode: z.string().min(1).max(240),
    territoryCountry: z.string().min(1).max(120),
    territoryCity: z.string().min(1).max(200),
    sectorSlug: z.string().max(120).nullable(),
    sovereigntyScore: z.number().int().min(0).max(100),
    autonomyScore: z.number().int().min(0).max(100),
    dependencyExposureScore: z.number().int().min(0).max(100),
    dependencyExposureLevel: RelationalEconomicDependencyExposureSchema,
    dependencyConcentration: z.number().int().min(0).max(100),
    externalDependencyExposure: z.number().int().min(0).max(100),
    resilienceAutonomy: z.number().int().min(0).max(100),
    recoveryAutonomy: z.number().int().min(0).max(100),
    strategicCaptivityRisk: z.number().int().min(0).max(100),
    corridorSelfRecoveryProbability: z.number().min(0).max(1),
    dependencyCriticality: z.number().int().min(0).max(100),
    systemicAutonomyRisk: z.number().int().min(0).max(100),
    autonomyStatus: RelationalEconomicAutonomyStatusSchema,
    severity: RelationalEconomicSovereigntySeveritySchema,
    active: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

const sovereigntyDepWireSchema = z
  .object({
    id: z.string().uuid(),
    sourceSovereigntyNodeId: z.string().uuid(),
    targetSovereigntyNodeId: z.string().uuid(),
    exposureLevel: RelationalEconomicDependencyExposureSchema,
    dependencyConcentration: z.number().int().min(0).max(100),
    captivityTransferScore: z.number().int().min(0).max(100),
    autonomyRecoveryProbability: z.number().min(0).max(1),
    createdAt: z.string(),
    ...disabledFlags,
  })
  .strict();

const namedSovereigntyRefSchema = z.object({
  sovereigntyNodeId: z.string().uuid(),
  sovereigntyNodeCode: z.string().min(1).max(240),
  score: z.number().int().min(0).max(100),
  ...disabledFlags,
});

export const RelationalEconomicSovereigntyOverviewSchema = z
  .object({
    relationshipId: z.string().uuid(),
    nodes: z.array(sovereigntyNodeWireSchema).max(48),
    edges: z.array(sovereigntyDepWireSchema).max(96),
    autonomousCorridors: z.array(namedSovereigntyRefSchema).max(24),
    captiveCorridors: z.array(namedSovereigntyRefSchema).max(24),
    sovereigntyScore: z.number().int().min(0).max(100),
    autonomyScore: z.number().int().min(0).max(100),
    dependencyExposureScore: z.number().int().min(0).max(100),
    systemicAutonomyRisk: z.number().int().min(0).max(100),
    corridorSelfRecoveryProbability: z.number().min(0).max(1),
    overviewDiagnostics: RelationalEconomicSovereigntyOverviewDiagnosticsSchema,
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export type RelationalEconomicSovereigntyOverviewDto = z.infer<
  typeof RelationalEconomicSovereigntyOverviewSchema
>;

export const RelationalEconomicSovereigntyDependencyMapSchema = z
  .object({
    relationshipId: z.string().uuid(),
    nodes: z.array(sovereigntyNodeWireSchema).max(48),
    edges: z.array(sovereigntyDepWireSchema).max(96),
    dependencyConcentration: z.number().int().min(0).max(100),
    externalDependencyExposure: z.number().int().min(0).max(100),
    dependencyCriticality: z.number().int().min(0).max(100),
    criticalDependencies: z.array(namedSovereigntyRefSchema).max(24),
    overviewDiagnostics: RelationalEconomicSovereigntyOverviewDiagnosticsSchema,
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalEconomicSovereigntyCaptivityMapSchema = z
  .object({
    relationshipId: z.string().uuid(),
    nodes: z.array(sovereigntyNodeWireSchema).max(48),
    captiveCorridors: z.array(namedSovereigntyRefSchema).max(24),
    strategicCaptivityRisk: z.number().int().min(0).max(100),
    captivityByTerritory: z.record(z.string(), z.number().int().min(0).max(100)),
    overviewDiagnostics: RelationalEconomicSovereigntyOverviewDiagnosticsSchema,
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalEconomicSovereigntyAutonomyMapSchema = z
  .object({
    relationshipId: z.string().uuid(),
    nodes: z.array(sovereigntyNodeWireSchema).max(48),
    autonomyBySector: z.record(z.string(), z.number().int().min(0).max(100)),
    autonomyByTerritory: z.record(z.string(), z.number().int().min(0).max(100)),
    resilienceAutonomy: z.number().int().min(0).max(100),
    recoveryAutonomy: z.number().int().min(0).max(100),
    overviewDiagnostics: RelationalEconomicSovereigntyOverviewDiagnosticsSchema,
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalEconomicSovereigntyResilienceAutonomySchema = z
  .object({
    relationshipId: z.string().uuid(),
    resilienceAutonomy: z.number().int().min(0).max(100),
    recoveryAutonomy: z.number().int().min(0).max(100),
    corridorSelfRecoveryProbability: z.number().min(0).max(1),
    dependencyRecoveryComplexity: z.number().int().min(0).max(100),
    autonomyRecoveryPressure: z.number().int().min(0).max(100),
    recoveryDiagnostics: RelationalEconomicSovereigntyRecoveryDiagnosticsSchema,
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalEconomicSovereigntyActionResponseSchema = z
  .object({
    ok: z.literal(true),
    code: z.string().min(1).max(120),
    ...disabledFlags,
  })
  .strict();

const sovereigntyCorridorRefSchema = z
  .object({
    sovereigntyNodeId: z.string().uuid(),
    relationshipId: z.string().uuid(),
    sovereigntyNodeCode: z.string().min(1).max(240),
    rawSovereigntyScore: z.number().int().min(0).max(100),
    rawAutonomyScore: z.number().int().min(0).max(100),
    calibratedSovereigntyScore: z.number().int().min(0).max(100),
    calibratedAutonomyScore: z.number().int().min(0).max(100),
    strategicCaptivityRisk: z.number().int().min(0).max(100),
    externalDependencyExposure: z.number().int().min(0).max(100),
    dependencyConcentration: z.number().int().min(0).max(100),
    systemicAutonomyRisk: z.number().int().min(0).max(100),
    severity: z.string().min(1).max(32),
    autonomyStatus: z.string().min(1).max(32),
    heuristicFallbackUsed: z.boolean(),
    confidenceLevel: z.enum(["LOW", "MEDIUM", "HIGH"]),
    calibrationVersion: z.string().min(1).max(64),
    ...disabledFlags,
  })
  .strict();

export const RelationalEconomicSovereigntyRetentionDiagnosticsSchema = z
  .object({
    retentionApplied: z.boolean(),
    archivedSnapshotsCount: z.number().int().min(0).max(100000),
    preservedCriticalSnapshotsCount: z.number().int().min(0).max(100000),
    retentionPolicy: z.string().min(1).max(240),
    retentionReason: z.string().min(1).max(240),
  })
  .strict();

export const RelationalEconomicSovereigntyCalibrationDiagnosticsSchema = z
  .object({
    calibrationVersion: z.literal("SOVEREIGNTY_CALIBRATION_V1"),
    calibrationProfile: z.enum(["CONSERVATIVE", "BALANCED", "AGGRESSIVE"]),
    weightsUsed: z.record(z.string(), z.number()),
    scoreContributors: z.record(z.string(), z.number()).optional(),
    confidenceLevel: z.enum(["LOW", "MEDIUM", "HIGH"]),
    ...disabledFlags,
  })
  .strict();

export const RelationalEconomicSovereigntyEdgeEnrichmentDiagnosticsSchema = z
  .object({
    peerCandidatesCount: z.number().int().min(0).max(100000),
    peerScannedCount: z.number().int().min(0).max(100000),
    edgesCreated: z.number().int().min(0).max(100000),
    edgesUpdated: z.number().int().min(0).max(100000),
    boundedScanApplied: z.boolean(),
    edgeSourcesUsed: z.array(z.string().min(1).max(80)).max(32),
  })
  .strict();

export const RelationalEconomicSovereigntyDashboardSchema = z
  .object({
    organizationId: z.string().uuid(),
    corridorCount: z.number().int().min(0).max(10000),
    aggregateSovereigntyScore: z.number().int().min(0).max(100),
    aggregateAutonomyScore: z.number().int().min(0).max(100),
    aggregateCaptivityRisk: z.number().int().min(0).max(100),
    aggregateExternalDependency: z.number().int().min(0).max(100),
    mostCaptiveCorridors: z.array(sovereigntyCorridorRefSchema).max(24),
    mostAutonomousCorridors: z.array(sovereigntyCorridorRefSchema).max(24),
    highExternalDependencyCorridors: z.array(sovereigntyCorridorRefSchema).max(24),
    lowSovereigntyRiskCorridors: z.array(sovereigntyCorridorRefSchema).max(24),
    calibrationVersion: z.literal("SOVEREIGNTY_CALIBRATION_V1"),
    calibrationProfile: z.enum(["CONSERVATIVE", "BALANCED", "AGGRESSIVE"]),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalEconomicSovereigntyCaptivityDistributionSchema = z
  .object({
    organizationId: z.string().uuid(),
    captiveCorridors: z.array(sovereigntyCorridorRefSchema).max(48),
    captivityByTerritory: z.record(z.string(), z.number().int().min(0).max(100)),
    captivityBySector: z.record(z.string(), z.number().int().min(0).max(100)),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalEconomicSovereigntyAutonomyDistributionSchema = z
  .object({
    organizationId: z.string().uuid(),
    sampleSize: z.number().int().min(0).max(10000),
    autonomyBuckets: z.record(z.string(), z.number().int().min(0).max(10000)),
    autonomyByStatus: z.record(z.string(), z.number().int().min(0).max(10000)),
    heuristicFallbackCorridors: z.number().int().min(0).max(10000),
    calibrationVersion: z.literal("SOVEREIGNTY_CALIBRATION_V1"),
    calibrationProfile: z.enum(["CONSERVATIVE", "BALANCED", "AGGRESSIVE"]),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalEconomicSovereigntyDependencyConcentrationSchema = z
  .object({
    organizationId: z.string().uuid(),
    sampleSize: z.number().int().min(0).max(10000),
    meanDependencyConcentration: z.number().int().min(0).max(100),
    meanExternalDependencyExposure: z.number().int().min(0).max(100),
    systemicExposureByTerritory: z.record(z.string(), z.number().int().min(0).max(100)),
    systemicExposureBySector: z.record(z.string(), z.number().int().min(0).max(100)),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RELATIONAL_ECONOMIC_SOVEREIGNTY_REALTIME_TYPES = [
  "relational.sovereignty.autonomy_detected",
  "relational.sovereignty.dependency_detected",
  "relational.sovereignty.captivity_detected",
  "relational.sovereignty.recovery_detected",
  "relational.sovereignty.systemic_exposure_detected",
  "relational.sovereignty.retention_applied",
  "relational.sovereignty.calibration_updated",
  "relational.sovereignty.edge_enriched",
  "relational.sovereignty.dashboard_refreshed",
] as const;

export type RelationalEconomicSovereigntyRealtimeEventType =
  (typeof RELATIONAL_ECONOMIC_SOVEREIGNTY_REALTIME_TYPES)[number];

export function isRelationalEconomicSovereigntyRealtimeEventType(
  v: string,
): v is RelationalEconomicSovereigntyRealtimeEventType {
  return (RELATIONAL_ECONOMIC_SOVEREIGNTY_REALTIME_TYPES as readonly string[]).includes(v);
}

export const RelationalEconomicSovereigntyRealtimeSchema = z
  .object({
    relationshipId: z.string().uuid().nullable(),
    sovereigntyNodeId: z.string().uuid().nullable(),
    sovereigntyNodeCode: z.string().min(1).max(240).nullable(),
    intensity: z.number().int().min(0).max(100),
    autonomyDepth: z.number().int().min(0).max(64),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export type RelationalEconomicSovereigntyRealtimeDto = z.infer<
  typeof RelationalEconomicSovereigntyRealtimeSchema
>;
