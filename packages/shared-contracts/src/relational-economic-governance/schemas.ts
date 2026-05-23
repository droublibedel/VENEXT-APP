import { z } from "zod";

const disabledFlags = {
  paymentExecutionDisabled: z.literal(true),
  publicTrackingDisabled: z.literal(true),
} as const;

export const RelationalEconomicGovernanceSeveritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const RelationalEconomicGovernanceStatusSchema = z.enum(["DRAFT", "ACTIVE", "ARCHIVED", "SUSPENDED"]);
export const RelationalEconomicGovernanceTypeSchema = z.enum([
  "MULTI_CORRIDOR_COORDINATION",
  "SYSTEMIC_BALANCE",
  "CONFLICT_ARBITRATION",
  "STRATEGIC_PRIORITY",
  "NETWORK_STABILITY",
]);
export const RelationalEconomicGovernancePrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

export const RelationalEconomicGovernanceDiagnosticsSchema = z
  .object({
    heuristicFallbackUsed: z.boolean(),
    fallbackReasons: z.array(z.string().min(1).max(200)).max(32),
    recoveryPlansUsed: z.number().int().min(0).max(50000),
    sovereigntyNodesUsed: z.number().int().min(0).max(50000),
    conflictCount: z.number().int().min(0).max(50000),
    coordinationTraversal: z
      .object({
        traversalDepth: z.number().int().min(0).max(64),
        visitedCorridors: z.number().int().min(0).max(512),
        boundedTraversalApplied: z.boolean(),
        propagationEdgeCount: z.number().int().min(0).max(100000),
      })
      .strict(),
  })
  .strict();

const governanceNodeWireSchema = z
  .object({
    id: z.string().uuid(),
    relationshipId: z.string().uuid(),
    governanceNodeCode: z.string().min(1).max(240),
    governanceType: RelationalEconomicGovernanceTypeSchema,
    governancePriority: RelationalEconomicGovernancePrioritySchema,
    governanceStatus: RelationalEconomicGovernanceStatusSchema,
    severity: RelationalEconomicGovernanceSeveritySchema,
    governanceScore: z.number().int().min(0).max(100),
    coordinationScore: z.number().int().min(0).max(100),
    systemicRisk: z.number().int().min(0).max(100),
    corridorCriticality: z.number().int().min(0).max(100),
    recoveryPressure: z.number().int().min(0).max(100),
    dependencyPressure: z.number().int().min(0).max(100),
    propagationPressure: z.number().int().min(0).max(100),
    sovereigntyPressure: z.number().int().min(0).max(100),
    continuityPressure: z.number().int().min(0).max(100),
    governanceStability: z.number().int().min(0).max(100),
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

const governanceCoordinationWireSchema = z
  .object({
    id: z.string().uuid(),
    coordinationCode: z.string().min(1).max(240),
    coordinationScore: z.number().int().min(0).max(100),
    strategicCorridorCount: z.number().int().min(0).max(500),
    coordinationOverload: z.number().int().min(0).max(100),
    balanceScore: z.number().int().min(0).max(100),
    governancePriorityScore: z.number().int().min(0).max(100),
    strategicCorridorRefs: z.array(z.string().uuid()).max(48),
    createdAt: z.string(),
    ...disabledFlags,
  })
  .strict();

const governanceConflictWireSchema = z
  .object({
    id: z.string().uuid(),
    conflictCode: z.string().min(1).max(240),
    conflictType: z.string().min(1).max(120),
    severity: RelationalEconomicGovernanceSeveritySchema,
    priority: RelationalEconomicGovernancePrioritySchema,
    affectedCorridors: z.array(z.string().uuid()).max(48),
    conflictPressure: z.number().int().min(0).max(100),
    systemicExposure: z.number().int().min(0).max(100),
    recoveryImpact: z.number().int().min(0).max(100),
    estimatedResolutionComplexity: z.number().int().min(0).max(100),
    createdAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalEconomicGovernanceNodeSchema = z
  .object({
    relationshipId: z.string().uuid(),
    node: governanceNodeWireSchema,
    coordinations: z.array(governanceCoordinationWireSchema).max(24),
    conflicts: z.array(governanceConflictWireSchema).max(48),
    overviewDiagnostics: RelationalEconomicGovernanceDiagnosticsSchema,
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalEconomicGovernanceCoordinationSchema = governanceCoordinationWireSchema;
export const RelationalEconomicGovernanceConflictSchema = governanceConflictWireSchema;

export const RelationalEconomicGovernanceSnapshotSchema = z
  .object({
    id: z.string().uuid(),
    relationshipId: z.string().uuid(),
    snapshotCode: z.string().min(1).max(240),
    governanceStatus: RelationalEconomicGovernanceStatusSchema,
    governanceScore: z.number().int().min(0).max(100),
    coordinationScore: z.number().int().min(0).max(100),
    systemicRisk: z.number().int().min(0).max(100),
    createdAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalEconomicGovernancePrioritiesResponseSchema = z
  .object({
    organizationId: z.string().uuid(),
    priorities: z
      .array(
        z
          .object({
            relationshipId: z.string().uuid(),
            governancePriorityScore: z.number().int().min(0).max(100),
            interventionUrgency: z.number().int().min(0).max(100),
            corridorCriticality: z.number().int().min(0).max(100),
            governanceScore: z.number().int().min(0).max(100),
            ...disabledFlags,
          })
          .strict(),
      )
      .max(200),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalEconomicGovernanceDashboardSchema = z
  .object({
    organizationId: z.string().uuid(),
    activeNodeCount: z.number().int().min(0).max(10000),
    criticalCorridorCount: z.number().int().min(0).max(10000),
    conflictCount: z.number().int().min(0).max(10000),
    meanGovernanceScore: z.number().int().min(0).max(100),
    meanCoordinationScore: z.number().int().min(0).max(100),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalEconomicGovernanceBalanceSchema = z
  .object({
    organizationId: z.string().uuid(),
    balanceScore: z.number().int().min(0).max(100),
    coordinationPressure: z.number().int().min(0).max(100),
    territorialImbalance: z.number().int().min(0).max(100),
    sectorOverload: z.number().int().min(0).max(100),
    corridorWeights: z
      .array(
        z
          .object({
            relationshipId: z.string().uuid(),
            corridorWeight: z.number().int().min(0).max(100),
            strategicImportance: z.number().int().min(0).max(100),
            ...disabledFlags,
          })
          .strict(),
      )
      .max(200),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalEconomicGovernanceActionResponseSchema = z
  .object({
    ok: z.literal(true),
    code: z.string().min(1).max(120),
    ...disabledFlags,
  })
  .strict();

export const RELATIONAL_ECONOMIC_GOVERNANCE_REALTIME_TYPES = [
  "relational.governance.coordination_detected",
  "relational.governance.conflict_detected",
  "relational.governance.priority_detected",
  "relational.governance.systemic_risk_detected",
  "relational.governance.balance_updated",
] as const;

export type RelationalEconomicGovernanceRealtimeEventType =
  (typeof RELATIONAL_ECONOMIC_GOVERNANCE_REALTIME_TYPES)[number];

export function isRelationalEconomicGovernanceRealtimeEventType(
  v: string,
): v is RelationalEconomicGovernanceRealtimeEventType {
  return (RELATIONAL_ECONOMIC_GOVERNANCE_REALTIME_TYPES as readonly string[]).includes(v);
}

export const RelationalEconomicGovernanceRealtimeSchema = z
  .object({
    relationshipId: z.string().uuid().nullable(),
    governanceNodeId: z.string().uuid().nullable(),
    governanceNodeCode: z.string().min(1).max(240).nullable(),
    intensity: z.number().int().min(0).max(100),
    governanceDepth: z.number().int().min(0).max(64),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const GovernanceNodeSchema = RelationalEconomicGovernanceNodeSchema;
export const GovernanceCoordinationSchema = RelationalEconomicGovernanceCoordinationSchema;
export const GovernanceConflictSchema = RelationalEconomicGovernanceConflictSchema;
export const GovernanceSnapshotSchema = RelationalEconomicGovernanceSnapshotSchema;
export const GovernanceDashboardSchema = RelationalEconomicGovernanceDashboardSchema;
export const GovernancePrioritySchema = RelationalEconomicGovernancePrioritiesResponseSchema;
export const GovernanceRealtimeSchema = RelationalEconomicGovernanceRealtimeSchema;
export const GovernanceDiagnosticsSchema = RelationalEconomicGovernanceDiagnosticsSchema;

export type RelationalEconomicGovernanceNodeDto = z.infer<typeof RelationalEconomicGovernanceNodeSchema>;
export type RelationalEconomicGovernanceRealtimeDto = z.infer<typeof RelationalEconomicGovernanceRealtimeSchema>;
