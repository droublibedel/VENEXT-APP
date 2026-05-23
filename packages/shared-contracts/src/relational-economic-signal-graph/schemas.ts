import { z } from "zod";

export const RelationalEconomicSignalSeveritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export type RelationalEconomicSignalSeverityDto = z.infer<typeof RelationalEconomicSignalSeveritySchema>;

export const RelationalEconomicSignalNodeTypeSchema = z.enum([
  "CORRIDOR",
  "CORRIDOR_GROUP",
  "OPERATIONAL_CLUSTER",
  "ECONOMIC_ZONE",
]);
export type RelationalEconomicSignalNodeTypeDto = z.infer<typeof RelationalEconomicSignalNodeTypeSchema>;

export const RelationalEconomicCorrelationStrengthSchema = z.enum(["WEAK", "MODERATE", "STRONG", "CRITICAL"]);
export type RelationalEconomicCorrelationStrengthDto = z.infer<typeof RelationalEconomicCorrelationStrengthSchema>;

export const RelationalEconomicPropagationRiskSchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL", "CASCADE"]);
export type RelationalEconomicPropagationRiskDto = z.infer<typeof RelationalEconomicPropagationRiskSchema>;

export const RelationalEconomicDependencyTypeSchema = z.enum([
  "OPERATIONAL",
  "SLA",
  "INCIDENT",
  "ORCHESTRATION",
  "MEMORY_PATTERN",
  "SYSTEMIC",
]);
export type RelationalEconomicDependencyTypeDto = z.infer<typeof RelationalEconomicDependencyTypeSchema>;

export const RelationalEconomicSignalEventTypeSchema = z.enum([
  "SIGNAL_CREATED",
  "SIGNAL_CORRELATED",
  "PROPAGATION_DETECTED",
  "SYSTEMIC_RISK_DETECTED",
  "CLUSTER_CREATED",
  "SIGNAL_ARCHIVED",
]);
export type RelationalEconomicSignalEventTypeDto = z.infer<typeof RelationalEconomicSignalEventTypeSchema>;

export const RelationalEconomicSignalEventSchema = z
  .object({
    id: z.string().uuid(),
    nodeId: z.string().uuid().nullable(),
    edgeId: z.string().uuid().nullable(),
    eventType: RelationalEconomicSignalEventTypeSchema,
    actorOrganizationId: z.string().uuid(),
    actorUserId: z.string().uuid(),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
    createdAt: z.string(),
  })
  .strict();

export type RelationalEconomicSignalEventDto = z.infer<typeof RelationalEconomicSignalEventSchema>;

export const RelationalEconomicSignalEdgeSchema = z
  .object({
    id: z.string().uuid(),
    sourceNodeId: z.string().uuid(),
    targetNodeId: z.string().uuid(),
    dependencyType: RelationalEconomicDependencyTypeSchema,
    correlationStrength: RelationalEconomicCorrelationStrengthSchema,
    propagationProbability: z.number().min(0).max(1),
    sharedIncidentCount: z.number().int().nonnegative(),
    sharedOperationalStress: z.number().int().nonnegative(),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
    createdAt: z.string(),
  })
  .strict();

export type RelationalEconomicSignalEdgeDto = z.infer<typeof RelationalEconomicSignalEdgeSchema>;

export const RelationalEconomicSignalNodeSchema = z
  .object({
    id: z.string().uuid(),
    relationshipId: z.string().uuid().nullable(),
    nodeCode: z.string().min(1).max(120),
    nodeType: RelationalEconomicSignalNodeTypeSchema,
    severity: RelationalEconomicSignalSeveritySchema,
    propagationRisk: RelationalEconomicPropagationRiskSchema,
    dependencyScore: z.number().int().min(0).max(100),
    corridorInfluenceScore: z.number().int().min(0).max(100),
    operationalFragilityScore: z.number().int().min(0).max(100),
    systemicExposureScore: z.number().int().min(0).max(100),
    observedAt: z.string(),
    events: z.array(RelationalEconomicSignalEventSchema).max(50),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .strict();

export type RelationalEconomicSignalNodeDto = z.infer<typeof RelationalEconomicSignalNodeSchema>;

export const RelationalEconomicSignalListSchema = z
  .object({
    signals: z.array(RelationalEconomicSignalNodeSchema).max(100),
    edges: z.array(RelationalEconomicSignalEdgeSchema).max(200),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
  })
  .strict();

export type RelationalEconomicSignalListDto = z.infer<typeof RelationalEconomicSignalListSchema>;

/** Instruction 20.19A — graph engine honesty diagnostics (stress + peer scan). */
export const RelationalEconomicGraphDiagnosticsSchema = z
  .object({
    openTasksComputed: z.boolean().optional(),
    openTasksSource: z.string().max(80).optional(),
    openTasksIncludedStatuses: z.array(z.string().max(64)).max(10).optional(),
    openTasksExcludedStatuses: z.array(z.string().max(64)).max(10).optional(),
    peerScanLimit: z.number().int().positive().optional(),
    peerScanLimitApplied: z.boolean().optional(),
    peerCandidatesCount: z.number().int().nonnegative().optional(),
    peerScannedCount: z.number().int().nonnegative().optional(),
    peerScanCompletenessRatio: z.number().min(0).max(1).optional(),
    peerScanMode: z.string().max(40).optional(),
    warnings: z.array(z.string().max(80)).max(10).optional(),
  })
  .strict();

export type RelationalEconomicGraphDiagnosticsDto = z.infer<typeof RelationalEconomicGraphDiagnosticsSchema>;

export const RelationalEconomicGraphOverviewSchema = z
  .object({
    relationshipId: z.string().uuid(),
    nodeCount: z.number().int().nonnegative(),
    edgeCount: z.number().int().nonnegative(),
    averageDependencyScore: z.number().finite().min(0).max(100),
    maxPropagationRisk: RelationalEconomicPropagationRiskSchema,
    systemicExposureScore: z.number().int().min(0).max(100),
    clusterCount: z.number().int().nonnegative(),
    computedAt: z.string(),
    diagnostics: RelationalEconomicGraphDiagnosticsSchema.optional(),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
  })
  .strict();

export type RelationalEconomicGraphOverviewDto = z.infer<typeof RelationalEconomicGraphOverviewSchema>;

export const RelationalEconomicPropagationSchema = z
  .object({
    relationshipId: z.string().uuid(),
    propagationRisk: RelationalEconomicPropagationRiskSchema,
    cascadeDepth: z.number().int().min(0).max(10),
    exposureScore: z.number().int().min(0).max(100),
    affectedNodeIds: z.array(z.string().uuid()).max(50),
    collapseProbability: z.number().min(0).max(1),
    diagnostics: z.record(z.string(), z.unknown()).optional(),
    computedAt: z.string(),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
  })
  .strict();

export type RelationalEconomicPropagationDto = z.infer<typeof RelationalEconomicPropagationSchema>;

export const RelationalEconomicClusterSchema = z
  .object({
    clusterCode: z.string().min(1).max(120),
    clusterScore: z.number().int().min(0).max(100),
    clusterRisk: RelationalEconomicSignalSeveritySchema,
    dominantSignals: z.array(z.string()).max(20),
    corridorCount: z.number().int().nonnegative(),
    sharedOperationalPressure: z.number().int().min(0).max(100),
    nodeIds: z.array(z.string().uuid()).max(50),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
    computedAt: z.string(),
  })
  .strict();

export type RelationalEconomicClusterDto = z.infer<typeof RelationalEconomicClusterSchema>;

export const RelationalEconomicClusterListSchema = z
  .object({
    clusters: z.array(RelationalEconomicClusterSchema).max(30),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
  })
  .strict();

export type RelationalEconomicClusterListDto = z.infer<typeof RelationalEconomicClusterListSchema>;

export const RelationalEconomicSignalArchiveRequestSchema = z
  .object({ archiveReason: z.string().min(1).max(4000) })
  .strict();

export const RelationalEconomicSignalActionResponseSchema = z
  .object({
    signal: RelationalEconomicSignalNodeSchema,
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
  })
  .strict();

export type RelationalEconomicSignalActionResponseDto = z.infer<typeof RelationalEconomicSignalActionResponseSchema>;

export const RelationalEconomicRealtimeSchema = z
  .object({
    nodeId: z.string().uuid().nullable(),
    relationshipId: z.string().uuid().nullable(),
    eventType: RelationalEconomicSignalEventTypeSchema.optional(),
    propagationRisk: RelationalEconomicPropagationRiskSchema,
    systemicExposureScore: z.number().int().min(0).max(100),
    clusterSize: z.number().int().nonnegative().optional(),
    computedAt: z.string(),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
  })
  .strict();

export type RelationalEconomicRealtimeDto = z.infer<typeof RelationalEconomicRealtimeSchema>;

export const RELATIONAL_ECONOMIC_SIGNAL_REALTIME_TYPES = [
  "relational.economic.signal_created",
  "relational.economic.signal_correlated",
  "relational.economic.cluster_detected",
  "relational.economic.propagation_detected",
  "relational.economic.systemic_risk_detected",
  "relational.economic.signal_archived",
] as const;

export type RelationalEconomicSignalRealtimeEventType =
  (typeof RELATIONAL_ECONOMIC_SIGNAL_REALTIME_TYPES)[number];

export function isRelationalEconomicSignalRealtimeType(
  eventType: string,
): eventType is RelationalEconomicSignalRealtimeEventType {
  return (RELATIONAL_ECONOMIC_SIGNAL_REALTIME_TYPES as readonly string[]).includes(eventType);
}
