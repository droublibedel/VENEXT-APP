import { z } from "zod";

const disabledFlags = {
  paymentExecutionDisabled: z.literal(true),
  publicTrackingDisabled: z.literal(true),
} as const;

export const RelationalExecutiveOrchestrationSeveritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const RelationalExecutiveOrchestrationStatusSchema = z.enum(["DRAFT", "ACTIVE", "OBSERVING", "ARCHIVED"]);
export const RelationalExecutiveOrchestrationTypeSchema = z.enum([
  "EXECUTIVE_MATRIX",
  "SYSTEMIC_COORDINATION",
  "CRITICAL_CORRIDOR_ORCHESTRATION",
  "STRATEGIC_ALIGNMENT",
]);
export const RelationalExecutiveOrchestrationPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const RelationalExecutiveOrchestrationSignalTypeSchema = z.enum([
  "EXECUTIVE",
  "SYSTEMIC",
  "COORDINATION",
  "RESILIENCE",
  "ALIGNMENT",
]);

export const RelationalExecutiveOrchestrationDiagnosticsSchema = z
  .object({
    heuristicFallbackUsed: z.boolean(),
    fallbackReasons: z.array(z.string().min(1).max(200)).max(32),
    signalCount: z.number().int().min(0).max(64),
    dependencyCount: z.number().int().min(0).max(64),
    executiveInstabilityDetected: z.boolean(),
    coordinationBreakdownDetected: z.boolean(),
    systemicConcentrationDetected: z.boolean(),
  })
  .strict();

const orchestrationNodeWireSchema = z
  .object({
    id: z.string().uuid(),
    relationshipId: z.string().uuid(),
    nodeCode: z.string().min(1).max(240),
    orchestrationType: RelationalExecutiveOrchestrationTypeSchema,
    orchestrationPriority: RelationalExecutiveOrchestrationPrioritySchema,
    orchestrationStatus: RelationalExecutiveOrchestrationStatusSchema,
    severity: RelationalExecutiveOrchestrationSeveritySchema,
    orchestrationScore: z.number().int().min(0).max(100),
    executiveCoordinationPressure: z.number().int().min(0).max(100),
    systemicExposure: z.number().int().min(0).max(100),
    executiveResilience: z.number().int().min(0).max(100),
    strategicAlignmentScore: z.number().int().min(0).max(100),
    governancePressure: z.number().int().min(0).max(100),
    arbitrationPressure: z.number().int().min(0).max(100),
    stabilizationPressure: z.number().int().min(0).max(100),
    monitoringPressure: z.number().int().min(0).max(100),
    recoveryPressure: z.number().int().min(0).max(100),
    sovereigntyPressure: z.number().int().min(0).max(100),
    dependencyPressure: z.number().int().min(0).max(100),
    executiveUrgency: z.number().int().min(0).max(100),
    territoryCountry: z.string().min(1).max(120),
    territoryCity: z.string().min(1).max(200),
    sectorSlug: z.string().max(120).nullable(),
    active: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

const orchestrationSignalWireSchema = z
  .object({
    id: z.string().uuid(),
    signalCode: z.string().min(1).max(240),
    signalType: RelationalExecutiveOrchestrationSignalTypeSchema,
    intensity: z.number().int().min(0).max(100),
    pressureLevel: z.number().int().min(0).max(100),
    riskLevel: z.number().int().min(0).max(100),
    createdAt: z.string(),
    ...disabledFlags,
  })
  .strict();

const orchestrationDependencyWireSchema = z
  .object({
    id: z.string().uuid(),
    dependencyCode: z.string().min(1).max(240),
    dependencyWeight: z.number().int().min(0).max(100),
    crossCorridorExposure: z.number().int().min(0).max(100),
    coordinationStress: z.number().int().min(0).max(100),
    concentrationScore: z.number().int().min(0).max(100),
    createdAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalExecutiveOrchestrationOverviewSchema = z
  .object({
    relationshipId: z.string().uuid(),
    node: orchestrationNodeWireSchema,
    signals: z.array(orchestrationSignalWireSchema).max(24),
    dependencies: z.array(orchestrationDependencyWireSchema).max(32),
    overviewDiagnostics: RelationalExecutiveOrchestrationDiagnosticsSchema,
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalExecutiveOrchestrationSignalSchema = orchestrationSignalWireSchema;
export const RelationalExecutiveOrchestrationDependencySchema = orchestrationDependencyWireSchema;

export const RelationalExecutiveOrchestrationSnapshotSchema = z
  .object({
    id: z.string().uuid(),
    relationshipId: z.string().uuid(),
    snapshotCode: z.string().min(1).max(240),
    orchestrationStatus: RelationalExecutiveOrchestrationStatusSchema,
    orchestrationScore: z.number().int().min(0).max(100),
    executiveCoordinationPressure: z.number().int().min(0).max(100),
    systemicExposure: z.number().int().min(0).max(100),
    executiveResilience: z.number().int().min(0).max(100),
    createdAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalExecutiveOrchestrationDashboardSchema = z
  .object({
    organizationId: z.string().uuid(),
    activeNodeCount: z.number().int().min(0).max(10000),
    criticalDependencyCount: z.number().int().min(0).max(10000),
    meanOrchestrationScore: z.number().int().min(0).max(100),
    meanCoordinationPressure: z.number().int().min(0).max(100),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalExecutiveOrchestrationActionResponseSchema = z
  .object({
    ok: z.literal(true),
    code: z.string().min(1).max(120),
    ...disabledFlags,
  })
  .strict();

export const RELATIONAL_EXECUTIVE_ORCHESTRATION_REALTIME_TYPES = [
  "relational.executive_orchestration.instability_detected",
  "relational.executive_orchestration.systemic_exposure_detected",
  "relational.executive_orchestration.priority_detected",
  "relational.executive_orchestration.coordination_breakdown_detected",
  "relational.executive_orchestration.resilience_detected",
] as const;

export type RelationalExecutiveOrchestrationRealtimeEventType =
  (typeof RELATIONAL_EXECUTIVE_ORCHESTRATION_REALTIME_TYPES)[number];

export function isRelationalExecutiveOrchestrationRealtimeEventType(
  v: string,
): v is RelationalExecutiveOrchestrationRealtimeEventType {
  return (RELATIONAL_EXECUTIVE_ORCHESTRATION_REALTIME_TYPES as readonly string[]).includes(v);
}

export const RelationalExecutiveOrchestrationRealtimeSchema = z
  .object({
    relationshipId: z.string().uuid().nullable(),
    orchestrationNodeId: z.string().uuid().nullable(),
    nodeCode: z.string().min(1).max(240).nullable(),
    intensity: z.number().int().min(0).max(100),
    orchestrationDepth: z.number().int().min(0).max(64),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const ExecutiveOrchestrationOverviewSchema = RelationalExecutiveOrchestrationOverviewSchema;
export const ExecutiveOrchestrationSignalSchema = RelationalExecutiveOrchestrationSignalSchema;
export const ExecutiveOrchestrationDependencySchema = RelationalExecutiveOrchestrationDependencySchema;
export const ExecutiveOrchestrationSnapshotSchema = RelationalExecutiveOrchestrationSnapshotSchema;
export const ExecutiveOrchestrationDashboardSchema = RelationalExecutiveOrchestrationDashboardSchema;
export const ExecutiveOrchestrationRealtimeSchema = RelationalExecutiveOrchestrationRealtimeSchema;
export const ExecutiveOrchestrationDiagnosticsSchema = RelationalExecutiveOrchestrationDiagnosticsSchema;

export type RelationalExecutiveOrchestrationOverviewDto = z.infer<
  typeof RelationalExecutiveOrchestrationOverviewSchema
>;
export type RelationalExecutiveOrchestrationRealtimeDto = z.infer<
  typeof RelationalExecutiveOrchestrationRealtimeSchema
>;
