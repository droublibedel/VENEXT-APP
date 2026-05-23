import { z } from "zod";

const disabledFlags = {
  paymentExecutionDisabled: z.literal(true),
  publicTrackingDisabled: z.literal(true),
} as const;

export const RelationalEconomicRecoverySeveritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const RelationalEconomicRecoveryStatusSchema = z.enum([
  "DRAFT",
  "ACTIVE",
  "COMPLETED",
  "ARCHIVED",
  "SUSPENDED",
]);
export const RelationalEconomicRecoveryTypeSchema = z.enum([
  "CORRIDOR_STABILIZATION",
  "DEPENDENCY_REMEDIATION",
  "CONTINUITY_RESTORATION",
  "SOVEREIGNTY_REINFORCEMENT",
  "SYSTEMIC_CONTAINMENT",
]);
export const RelationalEconomicRecoveryPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const RelationalEconomicRecoveryStepTypeSchema = z.enum([
  "PRIORITY_STABILIZATION",
  "DEPENDENCY_REDUCTION",
  "FLOW_REBALANCING",
  "PRESSURE_CONTAINMENT",
  "CONTINUITY_RECOVERY",
  "SOVEREIGNTY_REINFORCEMENT",
  "SECTOR_REBALANCING",
  "TERRITORIAL_REALIGNMENT",
  "SYSTEMIC_RISK_CONTAINMENT",
  "RECOVERY_VALIDATION",
]);

export const RelationalEconomicRecoveryDiagnosticsSchema = z
  .object({
    heuristicFallbackUsed: z.boolean(),
    fallbackReasons: z.array(z.string().min(1).max(200)).max(32),
    sovereigntyNodesUsed: z.number().int().min(0).max(50000),
    continuitySnapshotsUsed: z.number().int().min(0).max(50000),
    macroDependenciesUsed: z.number().int().min(0).max(50000),
    supplyFlowEdgesUsed: z.number().int().min(0).max(50000),
    recoveryTraversal: z
      .object({
        traversalDepth: z.number().int().min(0).max(64),
        visitedNodes: z.number().int().min(0).max(512),
        recoveryEdgeCount: z.number().int().min(0).max(100000),
        boundedTraversalApplied: z.boolean(),
        recoveryComplexity: z.number().int().min(0).max(100),
      })
      .strict(),
  })
  .strict();

const recoveryStepWireSchema = z
  .object({
    id: z.string().uuid(),
    stepCode: z.string().min(1).max(240),
    stepOrder: z.number().int().min(0).max(64),
    stepType: RelationalEconomicRecoveryStepTypeSchema,
    blocking: z.boolean(),
    estimatedDuration: z.number().int().min(0).max(10000),
    dependencyLevel: z.number().int().min(0).max(100),
    recoveryImpactScore: z.number().int().min(0).max(100),
    recoveryRiskScore: z.number().int().min(0).max(100),
    confidenceLevel: z.enum(["LOW", "MEDIUM", "HIGH"]),
    createdAt: z.string(),
    ...disabledFlags,
  })
  .strict();

const recoveryPlanWireSchema = z
  .object({
    id: z.string().uuid(),
    relationshipId: z.string().uuid(),
    planCode: z.string().min(1).max(240),
    recoveryType: RelationalEconomicRecoveryTypeSchema,
    recoveryPriority: RelationalEconomicRecoveryPrioritySchema,
    recoveryStatus: RelationalEconomicRecoveryStatusSchema,
    severity: RelationalEconomicRecoverySeveritySchema,
    recoveryScore: z.number().int().min(0).max(100),
    instabilityScore: z.number().int().min(0).max(100),
    dependencyExposure: z.number().int().min(0).max(100),
    continuityPressure: z.number().int().min(0).max(100),
    sovereigntyPressure: z.number().int().min(0).max(100),
    corridorRecoveryProbability: z.number().min(0).max(1),
    estimatedRecoveryDuration: z.number().int().min(0).max(10000),
    recoveryComplexity: z.number().int().min(0).max(100),
    interventionPriority: z.number().int().min(0).max(100),
    systemicImpactRisk: z.number().int().min(0).max(100),
    territoryCountry: z.string().min(1).max(120),
    territoryCity: z.string().min(1).max(200),
    sectorSlug: z.string().max(120).nullable(),
    active: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalEconomicRecoveryPlanSchema = z
  .object({
    relationshipId: z.string().uuid(),
    plan: recoveryPlanWireSchema,
    steps: z.array(recoveryStepWireSchema).max(16),
    overviewDiagnostics: RelationalEconomicRecoveryDiagnosticsSchema,
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalEconomicRecoveryStepSchema = recoveryStepWireSchema;

export const RelationalEconomicRecoverySignalSchema = z
  .object({
    id: z.string().uuid(),
    relationshipId: z.string().uuid(),
    recoveryPlanId: z.string().uuid().nullable(),
    signalType: z.string().min(1).max(120),
    severity: RelationalEconomicRecoverySeveritySchema,
    title: z.string().min(1).max(400),
    signalScore: z.number().int().min(0).max(100),
    recoveryContribution: z.number().int().min(0).max(100),
    instabilityPressure: z.number().int().min(0).max(100),
    createdAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalEconomicRecoverySnapshotSchema = z
  .object({
    id: z.string().uuid(),
    relationshipId: z.string().uuid(),
    snapshotCode: z.string().min(1).max(240),
    recoveryStatus: RelationalEconomicRecoveryStatusSchema,
    recoveryScore: z.number().int().min(0).max(100),
    instabilityScore: z.number().int().min(0).max(100),
    corridorRecoveryProbability: z.number().min(0).max(1),
    createdAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalEconomicRecoveryMapSchema = z
  .object({
    relationshipId: z.string().uuid(),
    plans: z.array(recoveryPlanWireSchema).max(24),
    steps: z.array(recoveryStepWireSchema).max(160),
    recoveryPriorityScore: z.number().int().min(0).max(100),
    interventionUrgency: z.number().int().min(0).max(100),
    overviewDiagnostics: RelationalEconomicRecoveryDiagnosticsSchema,
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalEconomicRecoveryDashboardSchema = z
  .object({
    organizationId: z.string().uuid(),
    activePlanCount: z.number().int().min(0).max(10000),
    criticalCorridorCount: z.number().int().min(0).max(10000),
    meanRecoveryScore: z.number().int().min(0).max(100),
    meanInstabilityScore: z.number().int().min(0).max(100),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalEconomicRecoveryActionResponseSchema = z
  .object({
    ok: z.literal(true),
    code: z.string().min(1).max(120),
    ...disabledFlags,
  })
  .strict();

export const RELATIONAL_ECONOMIC_RECOVERY_REALTIME_TYPES = [
  "relational.recovery.plan_generated",
  "relational.recovery.priority_detected",
  "relational.recovery.instability_detected",
  "relational.recovery.systemic_risk_detected",
  "relational.recovery.recovery_updated",
] as const;

export type RelationalEconomicRecoveryRealtimeEventType =
  (typeof RELATIONAL_ECONOMIC_RECOVERY_REALTIME_TYPES)[number];

export function isRelationalEconomicRecoveryRealtimeEventType(
  v: string,
): v is RelationalEconomicRecoveryRealtimeEventType {
  return (RELATIONAL_ECONOMIC_RECOVERY_REALTIME_TYPES as readonly string[]).includes(v);
}

export const RelationalEconomicRecoveryRealtimeSchema = z
  .object({
    relationshipId: z.string().uuid().nullable(),
    recoveryPlanId: z.string().uuid().nullable(),
    planCode: z.string().min(1).max(240).nullable(),
    intensity: z.number().int().min(0).max(100),
    recoveryDepth: z.number().int().min(0).max(64),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

/** Instruction 20.29 — canonical aliases for corridor recovery DTOs. */
export const RecoveryPlanSchema = RelationalEconomicRecoveryPlanSchema;
export const RecoveryStepSchema = RelationalEconomicRecoveryStepSchema;
export const RecoverySignalSchema = RelationalEconomicRecoverySignalSchema;
export const RecoverySnapshotSchema = RelationalEconomicRecoverySnapshotSchema;
export const RecoveryDashboardSchema = RelationalEconomicRecoveryDashboardSchema;
export const RecoveryMapSchema = RelationalEconomicRecoveryMapSchema;
export const RecoveryRealtimeSchema = RelationalEconomicRecoveryRealtimeSchema;
export const RecoveryDiagnosticsSchema = RelationalEconomicRecoveryDiagnosticsSchema;

export type RelationalEconomicRecoveryPlanDto = z.infer<typeof RelationalEconomicRecoveryPlanSchema>;
export type RelationalEconomicRecoveryMapDto = z.infer<typeof RelationalEconomicRecoveryMapSchema>;
export type RelationalEconomicRecoveryDashboardDto = z.infer<typeof RelationalEconomicRecoveryDashboardSchema>;
export type RelationalEconomicRecoveryRealtimeDto = z.infer<typeof RelationalEconomicRecoveryRealtimeSchema>;
