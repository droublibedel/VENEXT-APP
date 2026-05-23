import { z } from "zod";

const disabledFlags = {
  paymentExecutionDisabled: z.literal(true),
  publicTrackingDisabled: z.literal(true),
} as const;

export const RelationalMacroEconomicSeveritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const RelationalMacroEconomicRiskLevelSchema = z.enum(["LOW", "MEDIUM", "HIGH", "SEVERE"]);
export const RelationalMacroEconomicResilienceStatusSchema = z.enum([
  "STABLE",
  "WATCH",
  "STRESSED",
  "FRAGILE",
  "CRITICAL",
]);
export const RelationalMacroEconomicSignalTypeSchema = z.enum([
  "SYSTEMIC_PRESSURE",
  "FRAGILITY_ESCALATION",
  "RESILIENCE_DEGRADATION",
  "PROPAGATION_CONTAGION",
  "COLLAPSE_RISK",
  "ADAPTATION_STRESS",
  "TERRITORIAL_FRAGILITY",
  "SECTOR_CONCENTRATION",
]);
export const RelationalMacroEconomicDependencyTypeSchema = z.enum([
  "CORRIDOR_CRITICAL",
  "SECTOR_ANCHORED",
  "TERRITORY_ANCHORED",
  "SUPPLY_FLOW_COUPLED",
  "PRESSURE_PEER",
  "CONCENTRATION",
  "SYSTEMIC_BRIDGE",
]);

export const RelationalMacroEconomicTraversalDiagnosticsSchema = z
  .object({
    cascadeDepth: z.number().int().min(0).max(64),
    visitedNodes: z.number().int().min(0).max(512),
    edgeTraversalCount: z.number().int().min(0).max(100000),
    boundedTraversalApplied: z.boolean(),
    collapseExposure: z.number().int().min(0).max(100),
  })
  .strict();

export const RelationalMacroEconomicOverviewDiagnosticsSchema = z
  .object({
    heuristicFallbackUsed: z.boolean(),
    fallbackReasons: z.array(z.string().min(1).max(200)).max(32),
    predictiveSignalsUsed: z.number().int().min(0).max(50000),
    strategicMemoriesUsed: z.number().int().min(0).max(50000),
    operationalMetricsUsed: z.number().int().min(0).max(50000),
    supplyFlowNodesUsed: z.number().int().min(0).max(500),
    sectorNodesUsed: z.number().int().min(0).max(500),
    propagationTraversal: RelationalMacroEconomicTraversalDiagnosticsSchema,
  })
  .strict();

const macroNodeWireSchema = z
  .object({
    id: z.string().uuid(),
    relationshipId: z.string().uuid(),
    macroNodeCode: z.string().min(1).max(240),
    territoryCountry: z.string().min(1).max(120),
    territoryCity: z.string().min(1).max(200),
    sectorSlug: z.string().max(120).nullable(),
    resilienceScore: z.number().int().min(0).max(100),
    structuralFragility: z.number().int().min(0).max(100),
    operationalContinuity: z.number().int().min(0).max(100),
    dependencyExposure: z.number().int().min(0).max(100),
    adaptationCapacity: z.number().int().min(0).max(100),
    systemicPressure: z.number().int().min(0).max(100),
    economicStress: z.number().int().min(0).max(100),
    corridorRecoveryProbability: z.number().min(0).max(1),
    macroEconomicRisk: z.number().int().min(0).max(100),
    propagationRisk: z.number().int().min(0).max(100),
    fragilityScore: z.number().int().min(0).max(100),
    resilienceStatus: RelationalMacroEconomicResilienceStatusSchema,
    riskLevel: RelationalMacroEconomicRiskLevelSchema,
    active: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

const macroDepWireSchema = z
  .object({
    id: z.string().uuid(),
    sourceMacroNodeId: z.string().uuid(),
    targetMacroNodeId: z.string().uuid(),
    dependencyType: RelationalMacroEconomicDependencyTypeSchema,
    dependencyStrength: z.number().int().min(0).max(100),
    propagationProbability: z.number().min(0).max(1),
    systemicExposureScore: z.number().int().min(0).max(100),
    collapseTransferScore: z.number().int().min(0).max(100),
    createdAt: z.string(),
    ...disabledFlags,
  })
  .strict();

const namedMacroRefSchema = z.object({
  macroNodeId: z.string().uuid(),
  macroNodeCode: z.string().min(1).max(240),
  score: z.number().int().min(0).max(100),
  ...disabledFlags,
});

export const RelationalMacroEconomicResilienceOverviewSchema = z
  .object({
    relationshipId: z.string().uuid(),
    nodes: z.array(macroNodeWireSchema).max(48),
    edges: z.array(macroDepWireSchema).max(96),
    criticalCorridors: z.array(namedMacroRefSchema).max(24),
    fragileZones: z.array(namedMacroRefSchema).max(24),
    resilienceScore: z.number().int().min(0).max(100),
    structuralFragility: z.number().int().min(0).max(100),
    systemicPressure: z.number().int().min(0).max(100),
    macroEconomicRisk: z.number().int().min(0).max(100),
    overviewDiagnostics: RelationalMacroEconomicOverviewDiagnosticsSchema,
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export type RelationalMacroEconomicResilienceOverviewDto = z.infer<
  typeof RelationalMacroEconomicResilienceOverviewSchema
>;

export const RelationalMacroEconomicFragilityMapSchema = z
  .object({
    relationshipId: z.string().uuid(),
    nodes: z.array(macroNodeWireSchema).max(48),
    fragilityByTerritory: z.record(z.string(), z.number().int().min(0).max(100)),
    fragilityBySector: z.record(z.string(), z.number().int().min(0).max(100)),
    fragileZones: z.array(namedMacroRefSchema).max(24),
    overviewDiagnostics: RelationalMacroEconomicOverviewDiagnosticsSchema,
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalMacroEconomicDependencyMapSchema = z
  .object({
    relationshipId: z.string().uuid(),
    nodes: z.array(macroNodeWireSchema).max(48),
    edges: z.array(macroDepWireSchema).max(96),
    dominantCorridors: z.array(namedMacroRefSchema).max(24),
    collapsePoints: z.array(namedMacroRefSchema).max(24),
    systemicExposure: z.number().int().min(0).max(100),
    overviewDiagnostics: RelationalMacroEconomicOverviewDiagnosticsSchema,
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalMacroEconomicPropagationMapSchema = z
  .object({
    relationshipId: z.string().uuid(),
    nodes: z.array(macroNodeWireSchema).max(48),
    edges: z.array(macroDepWireSchema).max(96),
    propagationChains: z.array(z.array(z.string().uuid()).max(16)).max(32),
    maxDepthObserved: z.number().int().min(0).max(64),
    traversalDiagnostics: RelationalMacroEconomicTraversalDiagnosticsSchema,
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalMacroEconomicSystemicPressureSchema = z
  .object({
    relationshipId: z.string().uuid(),
    systemicPressure: z.number().int().min(0).max(100),
    economicStress: z.number().int().min(0).max(100),
    macroEconomicRisk: z.number().int().min(0).max(100),
    signals: z
      .array(
        z.object({
          signalType: RelationalMacroEconomicSignalTypeSchema,
          severity: RelationalMacroEconomicSeveritySchema,
          signalScore: z.number().int().min(0).max(100),
          title: z.string().min(1).max(400),
        }),
      )
      .max(24),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalMacroEconomicActionResponseSchema = z
  .object({
    ok: z.literal(true),
    code: z.string().min(1).max(120),
    ...disabledFlags,
  })
  .strict();

export const RELATIONAL_MACRO_ECONOMIC_REALTIME_TYPES = [
  "relational.macro.resilience_detected",
  "relational.macro.fragility_detected",
  "relational.macro.propagation_detected",
  "relational.macro.collapse_risk_detected",
  "relational.macro.systemic_pressure_detected",
] as const;

export type RelationalMacroEconomicRealtimeEventType =
  (typeof RELATIONAL_MACRO_ECONOMIC_REALTIME_TYPES)[number];

export function isRelationalMacroEconomicRealtimeEventType(
  v: string,
): v is RelationalMacroEconomicRealtimeEventType {
  return (RELATIONAL_MACRO_ECONOMIC_REALTIME_TYPES as readonly string[]).includes(v);
}

export const RelationalMacroEconomicRealtimeSchema = z
  .object({
    relationshipId: z.string().uuid().nullable(),
    macroNodeId: z.string().uuid().nullable(),
    macroNodeCode: z.string().min(1).max(240).nullable(),
    intensity: z.number().int().min(0).max(100),
    propagationDepth: z.number().int().min(0).max(64),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export type RelationalMacroEconomicRealtimeDto = z.infer<typeof RelationalMacroEconomicRealtimeSchema>;
