import { z } from "zod";

export const RelationalEconomicPressureSeveritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export type RelationalEconomicPressureSeverityDto = z.infer<typeof RelationalEconomicPressureSeveritySchema>;

export const RelationalEconomicPressureDependencyLinkTypeSchema = z.enum([
  "STRATEGIC_DEPENDENCY",
  "SHARED_FULFILLMENT",
  "SHARED_DISTRIBUTION",
  "SHARED_OPERATIONAL_RISK",
  "INCIDENT_PROPAGATION",
  "EXECUTION_DEPENDENCY",
  "REGIONAL_CONCENTRATION",
  "MULTI_CLUSTER_PRESSURE",
  "CRITICAL_ACTOR_EXPOSURE",
  "SYSTEMIC_FRAGILITY",
]);
export type RelationalEconomicPressureDependencyLinkTypeDto = z.infer<
  typeof RelationalEconomicPressureDependencyLinkTypeSchema
>;

export const RelationalEconomicDependencyStatusSchema = z.enum(["ACTIVE", "ARCHIVED"]);
export type RelationalEconomicDependencyStatusDto = z.infer<typeof RelationalEconomicDependencyStatusSchema>;

export const RelationalEconomicPressureEventTypeSchema = z.enum([
  "PRESSURE_DETECTED",
  "DEPENDENCY_CREATED",
  "SYSTEMIC_CONCENTRATION_DETECTED",
  "PROPAGATION_RISK_INCREASED",
  "CRITICAL_CORRIDOR_IDENTIFIED",
  "DEPENDENCY_ARCHIVED",
  "PRESSURE_ESCALATED",
]);
export type RelationalEconomicPressureEventTypeDto = z.infer<typeof RelationalEconomicPressureEventTypeSchema>;

const disabledFlags = {
  paymentExecutionDisabled: z.literal(true),
  publicTrackingDisabled: z.literal(true),
} as const;

export const DependencyNodeSchema = z
  .object({
    id: z.string().uuid(),
    relationshipId: z.string().uuid(),
    nodeCode: z.string().min(1).max(200),
    dependencyScore: z.number().int().min(0).max(100),
    pressureScore: z.number().int().min(0).max(100),
    fragilityScore: z.number().int().min(0).max(100),
    propagationExposureScore: z.number().int().min(0).max(100),
    dependencyDensity: z.number().int().min(0).max(100),
    criticalityLevel: RelationalEconomicPressureSeveritySchema,
    systemicWeight: z.number().int().min(0).max(100),
    createdAt: z.string(),
    updatedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export type DependencyNodeDto = z.infer<typeof DependencyNodeSchema>;

export const DependencyEdgeSchema = z
  .object({
    id: z.string().uuid(),
    sourceNodeId: z.string().uuid(),
    targetNodeId: z.string().uuid(),
    dependencyType: RelationalEconomicPressureDependencyLinkTypeSchema,
    dependencyWeight: z.number().int().min(0).max(100),
    propagationProbability: z.number().min(0).max(1),
    asymmetricDependency: z.boolean(),
    pressureContribution: z.number().int().min(0).max(100),
    status: RelationalEconomicDependencyStatusSchema,
    ...disabledFlags,
  })
  .strict();

export type DependencyEdgeDto = z.infer<typeof DependencyEdgeSchema>;

export const CriticalCorridorSchema = z
  .object({
    relationshipId: z.string().uuid(),
    pressureScore: z.number().int().min(0).max(100),
    severity: RelationalEconomicPressureSeveritySchema,
    collapseExposure: z.number().min(0).max(1),
    ...disabledFlags,
  })
  .strict();

export type CriticalCorridorDto = z.infer<typeof CriticalCorridorSchema>;

export const PressureOverviewSchema = z
  .object({
    relationshipId: z.string().uuid(),
    saturationPressure: z.number().int().min(0).max(100),
    coordinationPressure: z.number().int().min(0).max(100),
    incidentPressure: z.number().int().min(0).max(100),
    orchestrationPressure: z.number().int().min(0).max(100),
    propagationPressure: z.number().int().min(0).max(100),
    dependencyPressure: z.number().int().min(0).max(100),
    systemicPressure: z.number().int().min(0).max(100),
    criticalCorridors: z.array(CriticalCorridorSchema).max(40),
    pressureZones: z.array(z.string().max(120)).max(30),
    collapseExposure: z.number().min(0).max(1),
    concentrationAlerts: z.array(z.string().max(200)).max(20),
    dependencyWarnings: z.array(z.string().max(200)).max(20),
    propagationChains: z.array(z.array(z.string().uuid()).max(12)).max(20),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export type PressureOverviewDto = z.infer<typeof PressureOverviewSchema>;

export const PressureListSchema = z
  .object({
    items: z.array(PressureOverviewSchema).max(20),
    ...disabledFlags,
  })
  .strict();

export const DependencyMapSchema = z
  .object({
    relationshipId: z.string().uuid(),
    nodes: z.array(DependencyNodeSchema).max(60),
    edges: z.array(DependencyEdgeSchema).max(120),
    ...disabledFlags,
  })
  .strict();

export type DependencyMapDto = z.infer<typeof DependencyMapSchema>;

export const FragilityZoneSchema = z
  .object({
    zoneCode: z.string().min(1).max(120),
    corridorCount: z.number().int().nonnegative(),
    fragilityScore: z.number().int().min(0).max(100),
    narrative: z.string().max(400),
    ...disabledFlags,
  })
  .strict();

export const FragilityZonesSchema = z
  .object({
    zones: z.array(FragilityZoneSchema).max(30),
    ...disabledFlags,
  })
  .strict();

export type FragilityZonesDto = z.infer<typeof FragilityZonesSchema>;

export const PropagationMapSchema = z
  .object({
    relationshipId: z.string().uuid(),
    intensity: z.number().int().min(0).max(100),
    paths: z.array(z.object({ path: z.array(z.string().uuid()).max(16), score: z.number().int().min(0).max(100) }).strict()).max(40),
    ...disabledFlags,
  })
  .strict();

export type PropagationMapDto = z.infer<typeof PropagationMapSchema>;

export const PressureRealtimeSchema = z
  .object({
    relationshipId: z.string().uuid().nullable(),
    edgeId: z.string().uuid().nullable(),
    severity: RelationalEconomicPressureSeveritySchema,
    systemicPressure: z.number().int().min(0).max(100),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export type PressureRealtimeDto = z.infer<typeof PressureRealtimeSchema>;

export const PressureArchiveRequestSchema = z.object({ archiveReason: z.string().min(1).max(4000) }).strict();

export const PressureActionResponseSchema = z
  .object({
    edge: DependencyEdgeSchema,
    ...disabledFlags,
  })
  .strict();

export type PressureActionResponseDto = z.infer<typeof PressureActionResponseSchema>;

export const RELATIONAL_ECONOMIC_PRESSURE_REALTIME_TYPES = [
  "relational.pressure.pressure_detected",
  "relational.pressure.critical_corridor_detected",
  "relational.pressure.contagion_detected",
  "relational.pressure.systemic_fragility_detected",
  "relational.pressure.dependency_created",
  "relational.pressure.concentration_detected",
] as const;

export type RelationalEconomicPressureRealtimeEventType = (typeof RELATIONAL_ECONOMIC_PRESSURE_REALTIME_TYPES)[number];

export function isRelationalEconomicPressureRealtimeEventType(
  eventType: string,
): eventType is RelationalEconomicPressureRealtimeEventType {
  return (RELATIONAL_ECONOMIC_PRESSURE_REALTIME_TYPES as readonly string[]).includes(eventType);
}
