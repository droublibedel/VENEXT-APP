import { z } from "zod";

const disabledFlags = {
  paymentExecutionDisabled: z.literal(true),
  publicTrackingDisabled: z.literal(true),
} as const;

export const RelationalSupplyFlowTypeSchema = z.enum([
  "CORRIDOR_PRODUCT",
  "FULFILLMENT_COUPLING",
  "CROSS_TERRITORY_SPAN",
  "SECTOR_BRIDGE",
  "PEER_INFLUENCED",
  "UNKNOWN",
]);

export const RelationalSupplyFlowPressureLevelSchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

export const RelationalSupplyFlowRiskLevelSchema = z.enum(["LOW", "MEDIUM", "HIGH", "SEVERE"]);

export const RelationalSupplyFlowSignalTypeSchema = z.enum([
  "FLOW_PRESSURE_ESCALATION",
  "CONTINUITY_WARNING",
  "BOTTLENECK_CLUSTER",
  "DISRUPTION_RISK",
  "DEPENDENCY_STRESS",
  "PROPAGATION_READING",
  "ASYMMETRY_READING",
]);

export const RelationalSupplyFlowDependencyTypeSchema = z.enum([
  "PARALLEL_REDUNDANT",
  "SEQUENTIAL_DOWNSTREAM",
  "SECTOR_ANCHORED",
  "TERRITORY_ANCHORED",
  "ORGANIZATIONAL_PAIR",
  "FULFILLMENT_CHAIN",
  "CONCENTRATION_SINGLE_ACTOR",
]);

export const ProductFlowCategoryDiagnosticSchema = z
  .object({
    category: z.string().min(1).max(200),
    relationalVolume: z.number().finite(),
  })
  .strict();

export const RelationalSupplyFlowTraversalDiagnosticsSchema = z
  .object({
    cascadeDepth: z.number().int().min(0).max(64),
    visitedNodes: z.number().int().min(0).max(512),
    edgeTraversalCount: z.number().int().min(0).max(100000),
    boundedTraversalApplied: z.boolean(),
  })
  .strict();

export type RelationalSupplyFlowTraversalDiagnosticsDto = z.infer<typeof RelationalSupplyFlowTraversalDiagnosticsSchema>;

/** Instruction 20.24A — read-side / overview diagnostics (strict contract). */
export const RelationalSupplyFlowOverviewDiagnosticsSchema = z
  .object({
    heuristicFallbackUsed: z.boolean(),
    fallbackReasons: z.array(z.string().min(1).max(200)).max(32),
    predictiveSignalsUsed: z.number().int().min(0).max(50000),
    strategicMemoriesUsed: z.number().int().min(0).max(50000),
    operationalMetricsUsed: z.number().int().min(0).max(50000),
    productFlowCategories: z.array(ProductFlowCategoryDiagnosticSchema).max(64),
    dominantProductCategory: z.string().min(1).max(200),
    volumeConfidenceLevel: z.enum(["HIGH", "MEDIUM", "LOW"]),
    propagationTraversal: RelationalSupplyFlowTraversalDiagnosticsSchema,
    downstreamImpact: z.number().int().min(0).max(100),
  })
  .strict();

export type RelationalSupplyFlowOverviewDiagnosticsDto = z.infer<typeof RelationalSupplyFlowOverviewDiagnosticsSchema>;

export const RelationalSupplyFlowNodeSchema = z
  .object({
    id: z.string().uuid(),
    relationshipId: z.string().uuid(),
    sectorNodeId: z.string().uuid().nullable(),
    geoZoneId: z.string().uuid().nullable(),
    flowCode: z.string().min(1).max(240),
    flowType: RelationalSupplyFlowTypeSchema,
    flowName: z.string().min(1).max(400),
    sourceOrganizationId: z.string().uuid(),
    targetOrganizationId: z.string().uuid(),
    productCategory: z.string().min(1).max(200),
    territoryCountry: z.string().min(1).max(120),
    territoryCity: z.string().min(1).max(200),
    pressureLevel: RelationalSupplyFlowPressureLevelSchema,
    riskLevel: RelationalSupplyFlowRiskLevelSchema,
    flowVolumeScore: z.number().int().min(0).max(100),
    flowStabilityScore: z.number().int().min(0).max(100),
    fulfillmentReliabilityScore: z.number().int().min(0).max(100),
    supplyContinuityScore: z.number().int().min(0).max(100),
    disruptionRiskScore: z.number().int().min(0).max(100),
    bottleneckScore: z.number().int().min(0).max(100),
    dependencyScore: z.number().int().min(0).max(100),
    active: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export type RelationalSupplyFlowNodeDto = z.infer<typeof RelationalSupplyFlowNodeSchema>;

export const RelationalSupplyFlowEdgeSchema = z
  .object({
    id: z.string().uuid(),
    sourceFlowId: z.string().uuid(),
    targetFlowId: z.string().uuid(),
    dependencyType: RelationalSupplyFlowDependencyTypeSchema,
    dependencyStrength: z.number().int().min(0).max(100),
    propagationProbability: z.number().min(0).max(1),
    bottleneckTransferScore: z.number().int().min(0).max(100),
    sharedPressureScore: z.number().int().min(0).max(100),
    createdAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export type RelationalSupplyFlowEdgeDto = z.infer<typeof RelationalSupplyFlowEdgeSchema>;

export const RelationalSupplyFlowSignalSchema = z
  .object({
    id: z.string().uuid(),
    relationshipId: z.string().uuid(),
    flowNodeId: z.string().uuid(),
    signalType: RelationalSupplyFlowSignalTypeSchema,
    riskLevel: RelationalSupplyFlowRiskLevelSchema,
    title: z.string().min(1).max(400),
    description: z.string().min(1).max(4000),
    signalScore: z.number().int().min(0).max(100),
    pressureContribution: z.number().int().min(0).max(100),
    propagationRisk: z.number().int().min(0).max(100),
    createdAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export type RelationalSupplyFlowSignalDto = z.infer<typeof RelationalSupplyFlowSignalSchema>;

const flowWireSchema = RelationalSupplyFlowNodeSchema.pick({
  id: true,
  relationshipId: true,
  sectorNodeId: true,
  geoZoneId: true,
  flowCode: true,
  flowType: true,
  flowName: true,
  sourceOrganizationId: true,
  targetOrganizationId: true,
  productCategory: true,
  territoryCountry: true,
  territoryCity: true,
  pressureLevel: true,
  riskLevel: true,
  flowVolumeScore: true,
  flowStabilityScore: true,
  fulfillmentReliabilityScore: true,
  supplyContinuityScore: true,
  disruptionRiskScore: true,
  bottleneckScore: true,
  dependencyScore: true,
  active: true,
  createdAt: true,
  updatedAt: true,
  paymentExecutionDisabled: true,
  publicTrackingDisabled: true,
});

const edgeWireSchema = RelationalSupplyFlowEdgeSchema.pick({
  id: true,
  sourceFlowId: true,
  targetFlowId: true,
  dependencyType: true,
  dependencyStrength: true,
  propagationProbability: true,
  bottleneckTransferScore: true,
  sharedPressureScore: true,
  createdAt: true,
  paymentExecutionDisabled: true,
  publicTrackingDisabled: true,
});

export const RelationalSupplyFlowOverviewSchema = z
  .object({
    relationshipId: z.string().uuid(),
    nodes: z.array(flowWireSchema).max(48),
    edges: z.array(edgeWireSchema).max(96),
    overviewDiagnostics: RelationalSupplyFlowOverviewDiagnosticsSchema,
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export type RelationalSupplyFlowOverviewDto = z.infer<typeof RelationalSupplyFlowOverviewSchema>;

const namedFlowRefSchema = z.object({
  flowId: z.string().uuid(),
  flowCode: z.string().min(1).max(240),
  flowName: z.string().min(1).max(400),
  score: z.number().int().min(0).max(100),
  ...disabledFlags,
});

export const RelationalSupplyFlowPressureOverviewSchema = z
  .object({
    relationshipId: z.string().uuid(),
    criticalFlows: z.array(namedFlowRefSchema).max(24),
    bottleneckFlows: z.array(namedFlowRefSchema).max(24),
    disruptionRisks: z.array(namedFlowRefSchema).max(24),
    continuityWarnings: z.array(namedFlowRefSchema).max(24),
    dependencyWarnings: z.array(namedFlowRefSchema).max(24),
    propagationChains: z.array(z.array(z.string().uuid()).max(16)).max(24),
    pressureByCategory: z.record(z.string(), z.number().int().min(0).max(100)),
    pressureByTerritory: z.record(z.string(), z.number().int().min(0).max(100)),
    flowPressure: z.number().int().min(0).max(100),
    fulfillmentPressure: z.number().int().min(0).max(100),
    incidentPressure: z.number().int().min(0).max(100),
    dependencyPressure: z.number().int().min(0).max(100),
    bottleneckPressure: z.number().int().min(0).max(100),
    propagationPressure: z.number().int().min(0).max(100),
    continuityPressure: z.number().int().min(0).max(100),
    overviewDiagnostics: RelationalSupplyFlowOverviewDiagnosticsSchema,
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export type RelationalSupplyFlowPressureOverviewDto = z.infer<typeof RelationalSupplyFlowPressureOverviewSchema>;

export const RelationalSupplyFlowPropagationSchema = z
  .object({
    relationshipId: z.string().uuid(),
    nodes: z.array(flowWireSchema).max(48),
    edges: z.array(edgeWireSchema).max(96),
    cascadePaths: z.array(z.array(z.string().uuid()).max(16)).max(32),
    maxDepthObserved: z.number().int().min(0).max(64),
    downstreamImpact: z.number().int().min(0).max(100),
    traversalDiagnostics: RelationalSupplyFlowTraversalDiagnosticsSchema,
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export type RelationalSupplyFlowPropagationDto = z.infer<typeof RelationalSupplyFlowPropagationSchema>;

export const RelationalSupplyFlowActionResponseSchema = z
  .object({
    ok: z.literal(true),
    code: z.string().min(1).max(120),
    ...disabledFlags,
  })
  .strict();

export type RelationalSupplyFlowActionResponseDto = z.infer<typeof RelationalSupplyFlowActionResponseSchema>;

export const RELATIONAL_SUPPLY_FLOW_REALTIME_TYPES = [
  "relational.supply.flow_created",
  "relational.supply.pressure_detected",
  "relational.supply.bottleneck_detected",
  "relational.supply.disruption_risk_detected",
  "relational.supply.dependency_created",
  "relational.supply.propagation_detected",
  "relational.supply.flow_archived",
] as const;

export type RelationalSupplyFlowRealtimeEventType = (typeof RELATIONAL_SUPPLY_FLOW_REALTIME_TYPES)[number];

export function isRelationalSupplyFlowRealtimeEventType(v: string): v is RelationalSupplyFlowRealtimeEventType {
  return (RELATIONAL_SUPPLY_FLOW_REALTIME_TYPES as readonly string[]).includes(v);
}

/** Minimal corridor-safe realtime body (gateway + fan-out). */
export const RelationalSupplyFlowRealtimeSchema = z
  .object({
    relationshipId: z.string().uuid().nullable(),
    flowNodeId: z.string().uuid().nullable(),
    flowCode: z.string().min(1).max(240).nullable(),
    intensity: z.number().int().min(0).max(100),
    propagationDepth: z.number().int().min(0).max(64),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export type RelationalSupplyFlowRealtimeDto = z.infer<typeof RelationalSupplyFlowRealtimeSchema>;
