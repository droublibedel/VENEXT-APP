import { z } from "zod";

const disabledFlags = {
  paymentExecutionDisabled: z.literal(true),
  publicTrackingDisabled: z.literal(true),
} as const;

export const RelationalEconomicStabilizationSeveritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const RelationalEconomicStabilizationStatusSchema = z.enum(["DRAFT", "ACTIVE", "OBSERVING", "ARCHIVED"]);
export const RelationalEconomicStabilizationTypeSchema = z.enum([
  "STRATEGIC_STABILIZATION",
  "MULTI_CORRIDOR_RESILIENCE",
  "SYSTEMIC_CONTAINMENT",
  "FRAGILE_CORRIDOR",
]);
export const RelationalEconomicStabilizationPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const RelationalEconomicStabilizationSignalTypeSchema = z.enum([
  "INSTABILITY",
  "RESILIENCE",
  "PRESSURE",
  "EXPOSURE",
  "COORDINATION",
]);

export const RelationalEconomicStabilizationDiagnosticsSchema = z
  .object({
    heuristicFallbackUsed: z.boolean(),
    fallbackReasons: z.array(z.string().min(1).max(200)).max(32),
    traversalDepth: z.number().int().min(0).max(64),
    visitedCorridors: z.number().int().min(0).max(50000),
    boundedTraversalApplied: z.boolean(),
    signalCount: z.number().int().min(0).max(64),
    dependencyCount: z.number().int().min(0).max(128),
  })
  .strict();

const stabilizationNodeWireSchema = z
  .object({
    id: z.string().uuid(),
    relationshipId: z.string().uuid(),
    nodeCode: z.string().min(1).max(240),
    stabilizationType: RelationalEconomicStabilizationTypeSchema,
    stabilizationPriority: RelationalEconomicStabilizationPrioritySchema,
    stabilizationStatus: RelationalEconomicStabilizationStatusSchema,
    severity: RelationalEconomicStabilizationSeveritySchema,
    stabilizationScore: z.number().int().min(0).max(100),
    instabilityPressure: z.number().int().min(0).max(100),
    resilienceLevel: z.number().int().min(0).max(100),
    systemicExposure: z.number().int().min(0).max(100),
    dependencyPressure: z.number().int().min(0).max(100),
    continuityPressure: z.number().int().min(0).max(100),
    sovereigntyPressure: z.number().int().min(0).max(100),
    arbitrationPressure: z.number().int().min(0).max(100),
    governancePressure: z.number().int().min(0).max(100),
    recoveryPressure: z.number().int().min(0).max(100),
    coordinationStress: z.number().int().min(0).max(100),
    stabilizationUrgency: z.number().int().min(0).max(100),
    territoryCountry: z.string().min(1).max(120),
    territoryCity: z.string().min(1).max(200),
    sectorSlug: z.string().max(120).nullable(),
    active: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

const stabilizationSignalWireSchema = z
  .object({
    id: z.string().uuid(),
    signalCode: z.string().min(1).max(240),
    signalType: RelationalEconomicStabilizationSignalTypeSchema,
    intensity: z.number().int().min(0).max(100),
    pressureLevel: z.number().int().min(0).max(100),
    exposureLevel: z.number().int().min(0).max(100),
    createdAt: z.string(),
    ...disabledFlags,
  })
  .strict();

const stabilizationDependencyWireSchema = z
  .object({
    id: z.string().uuid(),
    dependencyCode: z.string().min(1).max(240),
    dependencyWeight: z.number().int().min(0).max(100),
    crossCorridorExposure: z.number().int().min(0).max(100),
    propagationStress: z.number().int().min(0).max(100),
    concentrationScore: z.number().int().min(0).max(100),
    createdAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalEconomicStabilizationOverviewSchema = z
  .object({
    relationshipId: z.string().uuid(),
    node: stabilizationNodeWireSchema,
    signals: z.array(stabilizationSignalWireSchema).max(24),
    dependencies: z.array(stabilizationDependencyWireSchema).max(48),
    overviewDiagnostics: RelationalEconomicStabilizationDiagnosticsSchema,
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalEconomicStabilizationSignalSchema = stabilizationSignalWireSchema;
export const RelationalEconomicStabilizationDependencySchema = stabilizationDependencyWireSchema;

export const RelationalEconomicStabilizationSnapshotSchema = z
  .object({
    id: z.string().uuid(),
    relationshipId: z.string().uuid(),
    snapshotCode: z.string().min(1).max(240),
    stabilizationStatus: RelationalEconomicStabilizationStatusSchema,
    stabilizationScore: z.number().int().min(0).max(100),
    instabilityPressure: z.number().int().min(0).max(100),
    resilienceLevel: z.number().int().min(0).max(100),
    systemicExposure: z.number().int().min(0).max(100),
    createdAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalEconomicStabilizationDashboardSchema = z
  .object({
    organizationId: z.string().uuid(),
    activeNodeCount: z.number().int().min(0).max(10000),
    fragileCorridorCount: z.number().int().min(0).max(10000),
    meanStabilizationScore: z.number().int().min(0).max(100),
    meanResilienceLevel: z.number().int().min(0).max(100),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalEconomicStabilizationActionResponseSchema = z
  .object({
    ok: z.literal(true),
    code: z.string().min(1).max(120),
    ...disabledFlags,
  })
  .strict();

export const RELATIONAL_ECONOMIC_STABILIZATION_REALTIME_TYPES = [
  "relational.stabilization.stability_detected",
  "relational.stabilization.instability_detected",
  "relational.stabilization.resilience_detected",
  "relational.stabilization.systemic_risk_detected",
  "relational.stabilization.priority_detected",
] as const;

export type RelationalEconomicStabilizationRealtimeEventType =
  (typeof RELATIONAL_ECONOMIC_STABILIZATION_REALTIME_TYPES)[number];

export function isRelationalEconomicStabilizationRealtimeEventType(
  v: string,
): v is RelationalEconomicStabilizationRealtimeEventType {
  return (RELATIONAL_ECONOMIC_STABILIZATION_REALTIME_TYPES as readonly string[]).includes(v);
}

export const RelationalEconomicStabilizationRealtimeSchema = z
  .object({
    relationshipId: z.string().uuid().nullable(),
    stabilizationNodeId: z.string().uuid().nullable(),
    nodeCode: z.string().min(1).max(240).nullable(),
    intensity: z.number().int().min(0).max(100),
    stabilizationDepth: z.number().int().min(0).max(64),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const StabilizationOverviewSchema = RelationalEconomicStabilizationOverviewSchema;
export const StabilizationSignalSchema = RelationalEconomicStabilizationSignalSchema;
export const StabilizationDependencySchema = RelationalEconomicStabilizationDependencySchema;
export const StabilizationSnapshotSchema = RelationalEconomicStabilizationSnapshotSchema;
export const StabilizationDashboardSchema = RelationalEconomicStabilizationDashboardSchema;
export const StabilizationRealtimeSchema = RelationalEconomicStabilizationRealtimeSchema;
export const StabilizationDiagnosticsSchema = RelationalEconomicStabilizationDiagnosticsSchema;

export type RelationalEconomicStabilizationOverviewDto = z.infer<
  typeof RelationalEconomicStabilizationOverviewSchema
>;
export type RelationalEconomicStabilizationRealtimeDto = z.infer<
  typeof RelationalEconomicStabilizationRealtimeSchema
>;
