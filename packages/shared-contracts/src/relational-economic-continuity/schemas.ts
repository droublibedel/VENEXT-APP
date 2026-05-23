import { z } from "zod";

const disabledFlags = {
  paymentExecutionDisabled: z.literal(true),
  publicTrackingDisabled: z.literal(true),
} as const;

export const RelationalEconomicStabilitySeveritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const RelationalEconomicContinuityStatusSchema = z.enum([
  "STABLE",
  "WATCH",
  "STRESSED",
  "UNSTABLE",
  "CRITICAL",
]);
export const RelationalEconomicContinuitySignalTypeSchema = z.enum([
  "STABILITY_DEGRADATION",
  "CONTINUITY_PRESSURE",
  "LONG_TERM_DEPENDENCY",
  "RECOVERY_STRESS",
  "COLLAPSE_RISK",
  "SYSTEMIC_CONTINUITY",
  "TEMPORAL_FRAGILITY",
  "SECTOR_DRIFT",
]);
export const RelationalEconomicInstabilityTypeSchema = z.enum([
  "CORRIDOR_INSTABILITY",
  "SECTOR_DRIFT",
  "TERRITORY_VULNERABILITY",
  "MACRO_DECOUPLING",
  "SUPPLY_DISRUPTION",
  "DEPENDENCY_CONCENTRATION",
  "TEMPORAL_DECAY",
]);

export const RelationalEconomicContinuityRecoveryDiagnosticsSchema = z
  .object({
    traversalDepth: z.number().int().min(0).max(64),
    visitedNodes: z.number().int().min(0).max(512),
    edgeTraversalCount: z.number().int().min(0).max(100000),
    recoveryBounded: z.boolean(),
    impactedCorridors: z.number().int().min(0).max(512),
    continuityExposure: z.number().int().min(0).max(100),
  })
  .strict();

export const RelationalEconomicContinuityOverviewDiagnosticsSchema = z
  .object({
    heuristicFallbackUsed: z.boolean(),
    fallbackReasons: z.array(z.string().min(1).max(200)).max(32),
    macroSnapshotsUsed: z.number().int().min(0).max(50000),
    continuitySnapshotsUsed: z.number().int().min(0).max(50000),
    propagationEventsUsed: z.number().int().min(0).max(50000),
    strategicMemoriesUsed: z.number().int().min(0).max(50000),
    recoveryTraversal: RelationalEconomicContinuityRecoveryDiagnosticsSchema,
  })
  .strict();

const continuityNodeWireSchema = z
  .object({
    id: z.string().uuid(),
    relationshipId: z.string().uuid(),
    continuityNodeCode: z.string().min(1).max(240),
    territoryCountry: z.string().min(1).max(120),
    territoryCity: z.string().min(1).max(200),
    sectorSlug: z.string().max(120).nullable(),
    continuityScore: z.number().int().min(0).max(100),
    corridorDurability: z.number().int().min(0).max(100),
    economicStability: z.number().int().min(0).max(100),
    instabilityScore: z.number().int().min(0).max(100),
    continuityPressure: z.number().int().min(0).max(100),
    dependencyDurability: z.number().int().min(0).max(100),
    economicSurvivalProbability: z.number().min(0).max(1),
    recoveryProbability: z.number().min(0).max(1),
    systemicContinuityRisk: z.number().int().min(0).max(100),
    continuityStatus: RelationalEconomicContinuityStatusSchema,
    severity: RelationalEconomicStabilitySeveritySchema,
    active: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

const continuityDepWireSchema = z
  .object({
    id: z.string().uuid(),
    sourceContinuityNodeId: z.string().uuid(),
    targetContinuityNodeId: z.string().uuid(),
    instabilityType: RelationalEconomicInstabilityTypeSchema,
    dependencyDurability: z.number().int().min(0).max(100),
    continuityTransferScore: z.number().int().min(0).max(100),
    recoveryPropagationProbability: z.number().min(0).max(1),
    createdAt: z.string(),
    ...disabledFlags,
  })
  .strict();

const namedContinuityRefSchema = z.object({
  continuityNodeId: z.string().uuid(),
  continuityNodeCode: z.string().min(1).max(240),
  score: z.number().int().min(0).max(100),
  ...disabledFlags,
});

export const RelationalEconomicContinuityOverviewSchema = z
  .object({
    relationshipId: z.string().uuid(),
    nodes: z.array(continuityNodeWireSchema).max(48),
    edges: z.array(continuityDepWireSchema).max(96),
    persistentCorridors: z.array(namedContinuityRefSchema).max(24),
    fragileCorridors: z.array(namedContinuityRefSchema).max(24),
    continuityScore: z.number().int().min(0).max(100),
    economicStability: z.number().int().min(0).max(100),
    instabilityRisk: z.number().int().min(0).max(100),
    systemicContinuityRisk: z.number().int().min(0).max(100),
    recoveryProbability: z.number().min(0).max(1),
    overviewDiagnostics: RelationalEconomicContinuityOverviewDiagnosticsSchema,
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export type RelationalEconomicContinuityOverviewDto = z.infer<
  typeof RelationalEconomicContinuityOverviewSchema
>;

export const RelationalEconomicContinuityInstabilityMapSchema = z
  .object({
    relationshipId: z.string().uuid(),
    nodes: z.array(continuityNodeWireSchema).max(48),
    instabilityByTerritory: z.record(z.string(), z.number().int().min(0).max(100)),
    instabilityBySector: z.record(z.string(), z.number().int().min(0).max(100)),
    unstableZones: z.array(namedContinuityRefSchema).max(24),
    overviewDiagnostics: RelationalEconomicContinuityOverviewDiagnosticsSchema,
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalEconomicContinuityRecoveryMapSchema = z
  .object({
    relationshipId: z.string().uuid(),
    nodes: z.array(continuityNodeWireSchema).max(48),
    edges: z.array(continuityDepWireSchema).max(96),
    recoveryChains: z.array(z.array(z.string().uuid()).max(16)).max(32),
    corridorRecoveryProbability: z.number().min(0).max(1),
    recoveryDurationEstimateDays: z.number().int().min(0).max(3650),
    continuityRecoveryPressure: z.number().int().min(0).max(100),
    systemicRecoveryComplexity: z.number().int().min(0).max(100),
    recoveryDiagnostics: RelationalEconomicContinuityRecoveryDiagnosticsSchema,
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalEconomicContinuityResilienceHistorySchema = z
  .object({
    relationshipId: z.string().uuid(),
    snapshots: z
      .array(
        z.object({
          snapshotCode: z.string().min(1).max(240),
          continuityScore: z.number().int().min(0).max(100),
          instabilityScore: z.number().int().min(0).max(100),
          recoveryProbability: z.number().min(0).max(1),
          systemicContinuityRisk: z.number().int().min(0).max(100),
          continuityStatus: RelationalEconomicContinuityStatusSchema,
          createdAt: z.string(),
          ...disabledFlags,
        }),
      )
      .max(64),
    trendDelta: z.number().int().min(-100).max(100),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalEconomicContinuitySystemicPressureSchema = z
  .object({
    relationshipId: z.string().uuid(),
    continuityPressure: z.number().int().min(0).max(100),
    systemicContinuityRisk: z.number().int().min(0).max(100),
    economicSurvivalProbability: z.number().min(0).max(1),
    signals: z
      .array(
        z.object({
          signalType: RelationalEconomicContinuitySignalTypeSchema,
          severity: RelationalEconomicStabilitySeveritySchema,
          signalScore: z.number().int().min(0).max(100),
          title: z.string().min(1).max(400),
        }),
      )
      .max(24),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalEconomicContinuityActionResponseSchema = z
  .object({
    ok: z.literal(true),
    code: z.string().min(1).max(120),
    ...disabledFlags,
  })
  .strict();

export const RELATIONAL_ECONOMIC_CONTINUITY_REALTIME_TYPES = [
  "relational.continuity.stability_detected",
  "relational.continuity.instability_detected",
  "relational.continuity.recovery_detected",
  "relational.continuity.collapse_risk_detected",
  "relational.continuity.systemic_pressure_detected",
] as const;

export type RelationalEconomicContinuityRealtimeEventType =
  (typeof RELATIONAL_ECONOMIC_CONTINUITY_REALTIME_TYPES)[number];

export function isRelationalEconomicContinuityRealtimeEventType(
  v: string,
): v is RelationalEconomicContinuityRealtimeEventType {
  return (RELATIONAL_ECONOMIC_CONTINUITY_REALTIME_TYPES as readonly string[]).includes(v);
}

export const RelationalEconomicContinuityRealtimeSchema = z
  .object({
    relationshipId: z.string().uuid().nullable(),
    continuityNodeId: z.string().uuid().nullable(),
    continuityNodeCode: z.string().min(1).max(240).nullable(),
    intensity: z.number().int().min(0).max(100),
    recoveryDepth: z.number().int().min(0).max(64),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export type RelationalEconomicContinuityRealtimeDto = z.infer<
  typeof RelationalEconomicContinuityRealtimeSchema
>;
