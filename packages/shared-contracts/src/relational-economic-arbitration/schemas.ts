import { z } from "zod";

const disabledFlags = {
  paymentExecutionDisabled: z.literal(true),
  publicTrackingDisabled: z.literal(true),
} as const;

export const RelationalEconomicArbitrationSeveritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const RelationalEconomicArbitrationStatusSchema = z.enum([
  "DRAFT",
  "ACTIVE",
  "PENDING_VALIDATION",
  "VALIDATED",
  "REJECTED",
  "ARCHIVED",
]);
export const RelationalEconomicArbitrationTypeSchema = z.enum([
  "CONFLICT_RESOLUTION",
  "STRATEGIC_ARBITRATION",
  "SYSTEMIC_STABILIZATION",
  "MULTI_CORRIDOR_PRIORITY",
]);
export const RelationalEconomicArbitrationPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const RelationalEconomicArbitrationScenarioTypeSchema = z.enum([
  "STABILIZATION_FIRST",
  "DEPENDENCY_REDUCTION_FIRST",
  "CONTINUITY_FIRST",
  "SOVEREIGNTY_FIRST",
  "PRESSURE_CONTAINMENT_FIRST",
  "BALANCED_RECOVERY",
  "SYSTEMIC_CONTAINMENT",
  "TERRITORIAL_REBALANCING",
  "SECTOR_REBALANCING",
  "MINIMAL_INTERVENTION",
]);
export const RelationalEconomicArbitrationDecisionTypeSchema = z.enum([
  "PENDING",
  "VALIDATED",
  "REJECTED",
  "ARCHIVED",
]);

export const RelationalEconomicArbitrationDiagnosticsSchema = z
  .object({
    heuristicFallbackUsed: z.boolean(),
    fallbackReasons: z.array(z.string().min(1).max(200)).max(32),
    governanceConflictsUsed: z.number().int().min(0).max(50000),
    scenarioCount: z.number().int().min(0).max(64),
    dualValidationRequired: z.boolean(),
  })
  .strict();

const arbitrationCaseWireSchema = z
  .object({
    id: z.string().uuid(),
    relationshipId: z.string().uuid(),
    caseCode: z.string().min(1).max(240),
    arbitrationType: RelationalEconomicArbitrationTypeSchema,
    arbitrationPriority: RelationalEconomicArbitrationPrioritySchema,
    arbitrationStatus: RelationalEconomicArbitrationStatusSchema,
    severity: RelationalEconomicArbitrationSeveritySchema,
    arbitrationScore: z.number().int().min(0).max(100),
    conflictSeverity: z.number().int().min(0).max(100),
    systemicImpact: z.number().int().min(0).max(100),
    dependencyPressure: z.number().int().min(0).max(100),
    continuityPressure: z.number().int().min(0).max(100),
    sovereigntyPressure: z.number().int().min(0).max(100),
    propagationPressure: z.number().int().min(0).max(100),
    coordinationPressure: z.number().int().min(0).max(100),
    resolutionComplexity: z.number().int().min(0).max(100),
    resolutionProbability: z.number().min(0).max(1),
    interventionUrgency: z.number().int().min(0).max(100),
    territoryCountry: z.string().min(1).max(120),
    territoryCity: z.string().min(1).max(200),
    sectorSlug: z.string().max(120).nullable(),
    active: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

const arbitrationScenarioWireSchema = z
  .object({
    id: z.string().uuid(),
    scenarioCode: z.string().min(1).max(240),
    scenarioType: RelationalEconomicArbitrationScenarioTypeSchema,
    priority: RelationalEconomicArbitrationPrioritySchema,
    estimatedImpact: z.number().int().min(0).max(100),
    estimatedRisk: z.number().int().min(0).max(100),
    estimatedRecoveryGain: z.number().int().min(0).max(100),
    dependencyImpact: z.number().int().min(0).max(100),
    propagationImpact: z.number().int().min(0).max(100),
    continuityImpact: z.number().int().min(0).max(100),
    sovereigntyImpact: z.number().int().min(0).max(100),
    confidenceLevel: z.enum(["LOW", "MEDIUM", "HIGH"]),
    createdAt: z.string(),
    ...disabledFlags,
  })
  .strict();

const arbitrationDecisionWireSchema = z
  .object({
    id: z.string().uuid(),
    decisionCode: z.string().min(1).max(240),
    decisionType: RelationalEconomicArbitrationDecisionTypeSchema,
    arbitrationReason: z.string().min(1).max(2000),
    expectedRecoveryGain: z.number().int().min(0).max(100),
    expectedStabilityGain: z.number().int().min(0).max(100),
    validationRequired: z.boolean(),
    dualValidationRequired: z.boolean(),
    selectedScenarioId: z.string().uuid().nullable(),
    createdAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalEconomicArbitrationCaseSchema = z
  .object({
    relationshipId: z.string().uuid(),
    case: arbitrationCaseWireSchema,
    scenarios: z.array(arbitrationScenarioWireSchema).max(16),
    decisions: z.array(arbitrationDecisionWireSchema).max(24),
    overviewDiagnostics: RelationalEconomicArbitrationDiagnosticsSchema,
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalEconomicArbitrationScenarioSchema = arbitrationScenarioWireSchema;
export const RelationalEconomicArbitrationDecisionSchema = arbitrationDecisionWireSchema;

export const RelationalEconomicArbitrationSnapshotSchema = z
  .object({
    id: z.string().uuid(),
    relationshipId: z.string().uuid(),
    snapshotCode: z.string().min(1).max(240),
    arbitrationStatus: RelationalEconomicArbitrationStatusSchema,
    arbitrationScore: z.number().int().min(0).max(100),
    systemicImpact: z.number().int().min(0).max(100),
    createdAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalEconomicArbitrationDashboardSchema = z
  .object({
    organizationId: z.string().uuid(),
    activeCaseCount: z.number().int().min(0).max(10000),
    pendingDecisionCount: z.number().int().min(0).max(10000),
    criticalCorridorCount: z.number().int().min(0).max(10000),
    meanArbitrationScore: z.number().int().min(0).max(100),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalEconomicArbitrationActionResponseSchema = z
  .object({
    ok: z.literal(true),
    code: z.string().min(1).max(120),
    ...disabledFlags,
  })
  .strict();

export const RELATIONAL_ECONOMIC_ARBITRATION_REALTIME_TYPES = [
  "relational.arbitration.conflict_detected",
  "relational.arbitration.scenario_generated",
  "relational.arbitration.decision_created",
  "relational.arbitration.priority_detected",
  "relational.arbitration.systemic_risk_detected",
] as const;

export type RelationalEconomicArbitrationRealtimeEventType =
  (typeof RELATIONAL_ECONOMIC_ARBITRATION_REALTIME_TYPES)[number];

export function isRelationalEconomicArbitrationRealtimeEventType(
  v: string,
): v is RelationalEconomicArbitrationRealtimeEventType {
  return (RELATIONAL_ECONOMIC_ARBITRATION_REALTIME_TYPES as readonly string[]).includes(v);
}

export const RelationalEconomicArbitrationRealtimeSchema = z
  .object({
    relationshipId: z.string().uuid().nullable(),
    arbitrationCaseId: z.string().uuid().nullable(),
    caseCode: z.string().min(1).max(240).nullable(),
    intensity: z.number().int().min(0).max(100),
    arbitrationDepth: z.number().int().min(0).max(64),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const ArbitrationCaseSchema = RelationalEconomicArbitrationCaseSchema;
export const ArbitrationScenarioSchema = RelationalEconomicArbitrationScenarioSchema;
export const ArbitrationDecisionSchema = RelationalEconomicArbitrationDecisionSchema;
export const ArbitrationSnapshotSchema = RelationalEconomicArbitrationSnapshotSchema;
export const ArbitrationDashboardSchema = RelationalEconomicArbitrationDashboardSchema;
export const ArbitrationRealtimeSchema = RelationalEconomicArbitrationRealtimeSchema;
export const ArbitrationDiagnosticsSchema = RelationalEconomicArbitrationDiagnosticsSchema;

export type RelationalEconomicArbitrationCaseDto = z.infer<typeof RelationalEconomicArbitrationCaseSchema>;
export type RelationalEconomicArbitrationRealtimeDto = z.infer<typeof RelationalEconomicArbitrationRealtimeSchema>;
