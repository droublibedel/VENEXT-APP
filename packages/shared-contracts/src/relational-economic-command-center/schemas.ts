import { z } from "zod";

export const RelationalEconomicCommandCenterStatusSchema = z.enum(["ACTIVE", "ARCHIVED"]);
export type RelationalEconomicCommandCenterStatusDto = z.infer<typeof RelationalEconomicCommandCenterStatusSchema>;

export const RelationalEconomicCommandCenterViewTypeSchema = z.enum([
  "SYSTEMIC",
  "SINGLE_CORRIDOR",
  "CLUSTER_PRESSURE",
  "PROPAGATION_HEAT",
]);
export type RelationalEconomicCommandCenterViewTypeDto = z.infer<typeof RelationalEconomicCommandCenterViewTypeSchema>;

export const RelationalEconomicCommandCenterSeveritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export type RelationalEconomicCommandCenterSeverityDto = z.infer<typeof RelationalEconomicCommandCenterSeveritySchema>;

export const RelationalEconomicControlPrioritySchema = z.enum(["LOW", "NORMAL", "HIGH", "CRITICAL"]);
export type RelationalEconomicControlPriorityDto = z.infer<typeof RelationalEconomicControlPrioritySchema>;

export const RelationalEconomicControlEventTypeSchema = z.enum([
  "SNAPSHOT_CREATED",
  "SYSTEMIC_CLUSTER_DETECTED",
  "CASCADE_RISK_DETECTED",
  "COMMAND_VIEW_REFRESHED",
  "CRITICAL_CORRIDOR_DETECTED",
  "STRATEGIC_PRESSURE_DETECTED",
]);
export type RelationalEconomicControlEventTypeDto = z.infer<typeof RelationalEconomicControlEventTypeSchema>;

export const RelationalEconomicControlEventSchema = z
  .object({
    id: z.string().uuid(),
    snapshotId: z.string().uuid().nullable(),
    eventType: RelationalEconomicControlEventTypeSchema,
    actorOrganizationId: z.string().uuid(),
    actorUserId: z.string().uuid(),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
    createdAt: z.string(),
  })
  .strict();

export type RelationalEconomicControlEventDto = z.infer<typeof RelationalEconomicControlEventSchema>;

export const RelationalEconomicCommandCenterSnapshotSchema = z
  .object({
    id: z.string().uuid(),
    relationshipId: z.string().uuid().nullable(),
    snapshotCode: z.string().min(1).max(160),
    viewType: RelationalEconomicCommandCenterViewTypeSchema,
    severity: RelationalEconomicCommandCenterSeveritySchema,
    lifecycleStatus: RelationalEconomicCommandCenterStatusSchema,
    globalRiskScore: z.number().int().min(0).max(100),
    systemicPressureScore: z.number().int().min(0).max(100),
    operationalHealthScore: z.number().int().min(0).max(100),
    coordinationStressScore: z.number().int().min(0).max(100),
    fulfillmentPressureScore: z.number().int().min(0).max(100),
    propagationExposureScore: z.number().int().min(0).max(100),
    activeAlertsCount: z.number().int().nonnegative(),
    activeRecommendationsCount: z.number().int().nonnegative(),
    activeOrchestrationsCount: z.number().int().nonnegative(),
    activeSimulationsCount: z.number().int().nonnegative(),
    activeCriticalReviewsCount: z.number().int().nonnegative(),
    activeStrategicMemoriesCount: z.number().int().nonnegative(),
    computedAt: z.string(),
    createdAt: z.string(),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
  })
  .strict();

export type RelationalEconomicCommandCenterSnapshotDto = z.infer<typeof RelationalEconomicCommandCenterSnapshotSchema>;

export const RelationalEconomicCommandCenterOverviewSchema = z
  .object({
    organizationId: z.string().uuid(),
    latestSnapshotId: z.string().uuid().nullable(),
    corridorCountUnderSupervision: z.number().int().nonnegative(),
    criticalCorridorCount: z.number().int().nonnegative(),
    globalRiskScore: z.number().int().min(0).max(100),
    operationalHealthScore: z.number().int().min(0).max(100),
    systemicPressureScore: z.number().int().min(0).max(100),
    computedAt: z.string(),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
  })
  .strict();

export type RelationalEconomicCommandCenterOverviewDto = z.infer<typeof RelationalEconomicCommandCenterOverviewSchema>;

export const RelationalEconomicSystemicViewSchema = z
  .object({
    globalRiskScore: z.number().int().min(0).max(100),
    operationalHealthScore: z.number().int().min(0).max(100),
    corridorFragilityMap: z
      .array(
        z
          .object({
            relationshipId: z.string().uuid(),
            fragilityScore: z.number().int().min(0).max(100),
            controlPriority: RelationalEconomicControlPrioritySchema,
          })
          .strict(),
      )
      .max(80),
    systemicPressureZones: z.array(z.string().max(120)).max(40),
    dominantFailurePatterns: z.array(z.string().max(120)).max(20),
    criticalDependencies: z
      .array(
        z
          .object({
            relationshipId: z.string().uuid(),
            dependencyExposure: z.number().int().min(0).max(100),
          })
          .strict(),
      )
      .max(50),
    propagationHeat: z.number().int().min(0).max(100),
    computedAt: z.string(),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
  })
  .strict();

export type RelationalEconomicSystemicViewDto = z.infer<typeof RelationalEconomicSystemicViewSchema>;

export const RelationalEconomicClusterViewSchema = z
  .object({
    clusterCode: z.string().min(1).max(120),
    pressureScore: z.number().int().min(0).max(100),
    corridorCount: z.number().int().nonnegative(),
    severity: RelationalEconomicCommandCenterSeveritySchema,
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
  })
  .strict();

export type RelationalEconomicClusterViewDto = z.infer<typeof RelationalEconomicClusterViewSchema>;

export const RelationalEconomicCommandCenterClusterListSchema = z
  .object({
    clusters: z.array(RelationalEconomicClusterViewSchema).max(40),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
  })
  .strict();

export type RelationalEconomicCommandCenterClusterListDto = z.infer<
  typeof RelationalEconomicCommandCenterClusterListSchema
>;

/** Minimal realtime payload for command center (Instruction 20.20). Distinct from economic signal graph realtime. */
export const RelationalEconomicCommandCenterRealtimeSchema = z
  .object({
    snapshotId: z.string().uuid().nullable(),
    relationshipId: z.string().uuid().nullable(),
    severity: RelationalEconomicCommandCenterSeveritySchema,
    globalRiskScore: z.number().int().min(0).max(100),
    controlPriority: RelationalEconomicControlPrioritySchema.optional(),
    computedAt: z.string(),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
  })
  .strict();

export type RelationalEconomicCommandCenterRealtimeDto = z.infer<typeof RelationalEconomicCommandCenterRealtimeSchema>;

export const RelationalEconomicCommandCenterSnapshotListSchema = z
  .object({
    snapshots: z.array(RelationalEconomicCommandCenterSnapshotSchema).max(100),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
  })
  .strict();

export type RelationalEconomicCommandCenterSnapshotListDto = z.infer<
  typeof RelationalEconomicCommandCenterSnapshotListSchema
>;

export const RelationalEconomicCriticalCorridorSchema = z
  .object({
    relationshipId: z.string().uuid(),
    severity: RelationalEconomicCommandCenterSeveritySchema,
    pressureScore: z.number().int().min(0).max(100),
    dependencyExposure: z.number().int().min(0).max(100),
    collapseProbability: z.number().min(0).max(1),
    controlPriority: RelationalEconomicControlPrioritySchema,
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
  })
  .strict();

export const RelationalEconomicCriticalCorridorListSchema = z
  .object({
    corridors: z.array(RelationalEconomicCriticalCorridorSchema).max(60),
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
  })
  .strict();

export type RelationalEconomicCriticalCorridorListDto = z.infer<typeof RelationalEconomicCriticalCorridorListSchema>;

export const RelationalEconomicCommandCenterArchiveRequestSchema = z
  .object({ archiveReason: z.string().min(1).max(4000) })
  .strict();

export const RelationalEconomicCommandCenterArchiveResponseSchema = z
  .object({
    snapshot: RelationalEconomicCommandCenterSnapshotSchema,
    paymentExecutionDisabled: z.literal(true),
    publicTrackingDisabled: z.literal(true),
  })
  .strict();

export type RelationalEconomicCommandCenterArchiveResponseDto = z.infer<
  typeof RelationalEconomicCommandCenterArchiveResponseSchema
>;

export const RELATIONAL_ECONOMIC_COMMAND_CENTER_REALTIME_TYPES = [
  "relational.command.snapshot_created",
  "relational.command.cluster_detected",
  "relational.command.cascade_detected",
  "relational.command.critical_corridor_detected",
  "relational.command.systemic_pressure_detected",
] as const;

export type RelationalEconomicCommandCenterRealtimeEventType =
  (typeof RELATIONAL_ECONOMIC_COMMAND_CENTER_REALTIME_TYPES)[number];

export function isRelationalEconomicCommandCenterRealtimeType(
  eventType: string,
): eventType is RelationalEconomicCommandCenterRealtimeEventType {
  return (RELATIONAL_ECONOMIC_COMMAND_CENTER_REALTIME_TYPES as readonly string[]).includes(eventType);
}
