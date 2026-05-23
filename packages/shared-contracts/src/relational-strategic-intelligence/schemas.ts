import { z } from "zod";

const disabledFlags = {
  paymentExecutionDisabled: z.literal(true),
  publicTrackingDisabled: z.literal(true),
} as const;

export const RelationalStrategicIntelligenceSeveritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const RelationalStrategicIntelligenceStatusSchema = z.enum(["DRAFT", "ACTIVE", "OBSERVING", "ARCHIVED"]);
export const RelationalStrategicIntelligenceTypeSchema = z.enum([
  "CONSOLIDATED_OVERVIEW",
  "EXECUTIVE_SYNTHESIS_DIGEST",
  "STRATEGIC_ALIGNMENT",
  "NETWORK_SUPERVISION",
]);
export const RelationalStrategicIntelligencePrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const RelationalStrategicIntelligenceSignalTypeSchema = z.enum([
  "STRATEGIC",
  "EXECUTIVE",
  "SYSTEMIC",
  "RESILIENCE",
  "ALIGNMENT",
]);
export const RelationalStrategicIntelligenceSynthesisTypeSchema = z.enum([
  "EXECUTIVE_SYNTHESIS",
  "STRATEGIC_SYNTHESIS",
  "TERRITORIAL_SYNTHESIS",
  "SECTOR_SYNTHESIS",
  "SYSTEMIC_SYNTHESIS",
  "RESILIENCE_SYNTHESIS",
  "GOVERNANCE_SYNTHESIS",
]);

export const RelationalStrategicIntelligenceDiagnosticsSchema = z
  .object({
    heuristicFallbackUsed: z.boolean(),
    fallbackReasons: z.array(z.string().min(1).max(200)).max(32),
    signalCount: z.number().int().min(0).max(64),
    synthesisCount: z.number().int().min(0).max(64),
    systemicPressureDetected: z.boolean(),
    executiveExposureDetected: z.boolean(),
    strategicPriorityDetected: z.boolean(),
  })
  .strict();

const intelligenceNodeWireSchema = z
  .object({
    id: z.string().uuid(),
    relationshipId: z.string().uuid(),
    nodeCode: z.string().min(1).max(240),
    intelligenceType: RelationalStrategicIntelligenceTypeSchema,
    intelligencePriority: RelationalStrategicIntelligencePrioritySchema,
    intelligenceStatus: RelationalStrategicIntelligenceStatusSchema,
    severity: RelationalStrategicIntelligenceSeveritySchema,
    strategicIntelligenceScore: z.number().int().min(0).max(100),
    executiveExposure: z.number().int().min(0).max(100),
    resilienceStrength: z.number().int().min(0).max(100),
    systemicConcentration: z.number().int().min(0).max(100),
    strategicAlignmentScore: z.number().int().min(0).max(100),
    governancePressure: z.number().int().min(0).max(100),
    arbitrationPressure: z.number().int().min(0).max(100),
    stabilizationPressure: z.number().int().min(0).max(100),
    monitoringPressure: z.number().int().min(0).max(100),
    orchestrationPressure: z.number().int().min(0).max(100),
    institutionalPressure: z.number().int().min(0).max(100),
    recoveryPressure: z.number().int().min(0).max(100),
    sovereigntyPressure: z.number().int().min(0).max(100),
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

const reportingSignalWireSchema = z
  .object({
    id: z.string().uuid(),
    signalCode: z.string().min(1).max(240),
    signalType: RelationalStrategicIntelligenceSignalTypeSchema,
    intensity: z.number().int().min(0).max(100),
    pressureLevel: z.number().int().min(0).max(100),
    riskLevel: z.number().int().min(0).max(100),
    createdAt: z.string(),
    ...disabledFlags,
  })
  .strict();

const reportingSynthesisWireSchema = z
  .object({
    id: z.string().uuid(),
    synthesisCode: z.string().min(1).max(240),
    synthesisType: RelationalStrategicIntelligenceSynthesisTypeSchema,
    severity: RelationalStrategicIntelligenceSeveritySchema,
    priority: RelationalStrategicIntelligencePrioritySchema,
    title: z.string().min(1).max(400),
    summary: z.string().min(1).max(4000),
    institutionalPressure: z.number().int().min(0).max(100),
    systemicConcentration: z.number().int().min(0).max(100),
    createdAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalStrategicIntelligenceOverviewSchema = z
  .object({
    relationshipId: z.string().uuid(),
    node: intelligenceNodeWireSchema,
    signals: z.array(reportingSignalWireSchema).max(24),
    syntheses: z.array(reportingSynthesisWireSchema).max(32),
    overviewDiagnostics: RelationalStrategicIntelligenceDiagnosticsSchema,
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalStrategicIntelligenceSignalSchema = reportingSignalWireSchema;
export const RelationalStrategicIntelligenceSynthesisSchema = reportingSynthesisWireSchema;

export const RelationalStrategicIntelligenceSnapshotSchema = z
  .object({
    id: z.string().uuid(),
    relationshipId: z.string().uuid(),
    snapshotCode: z.string().min(1).max(240),
    intelligenceStatus: RelationalStrategicIntelligenceStatusSchema,
    strategicIntelligenceScore: z.number().int().min(0).max(100),
    executiveExposure: z.number().int().min(0).max(100),
    resilienceStrength: z.number().int().min(0).max(100),
    systemicConcentration: z.number().int().min(0).max(100),
    createdAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalStrategicIntelligenceDashboardSchema = z
  .object({
    organizationId: z.string().uuid(),
    activeNodeCount: z.number().int().min(0).max(10000),
    criticalSynthesisCount: z.number().int().min(0).max(10000),
    meanInstitutionalScore: z.number().int().min(0).max(100),
    meanExecutiveRisk: z.number().int().min(0).max(100),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalStrategicIntelligenceActionResponseSchema = z
  .object({
    ok: z.literal(true),
    code: z.string().min(1).max(120),
    ...disabledFlags,
  })
  .strict();

export const RELATIONAL_STRATEGIC_INTELLIGENCE_REALTIME_TYPES = [
  "relational.strategic_intelligence.synthesis_generated",
  "relational.strategic_intelligence.systemic_pressure_detected",
  "relational.strategic_intelligence.executive_exposure_detected",
  "relational.strategic_intelligence.priority_detected",
  "relational.strategic_intelligence.resilience_detected",
] as const;

export type RelationalStrategicIntelligenceRealtimeEventType =
  (typeof RELATIONAL_STRATEGIC_INTELLIGENCE_REALTIME_TYPES)[number];

export function isRelationalStrategicIntelligenceRealtimeEventType(
  v: string,
): v is RelationalStrategicIntelligenceRealtimeEventType {
  return (RELATIONAL_STRATEGIC_INTELLIGENCE_REALTIME_TYPES as readonly string[]).includes(v);
}

export const RelationalStrategicIntelligenceRealtimeSchema = z
  .object({
    relationshipId: z.string().uuid().nullable(),
    intelligenceNodeId: z.string().uuid().nullable(),
    nodeCode: z.string().min(1).max(240).nullable(),
    intensity: z.number().int().min(0).max(100),
    intelligenceDepth: z.number().int().min(0).max(64),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const StrategicIntelligenceOverviewSchema = RelationalStrategicIntelligenceOverviewSchema;
export const StrategicIntelligenceSignalSchema = RelationalStrategicIntelligenceSignalSchema;
export const StrategicIntelligenceSynthesisSchema = RelationalStrategicIntelligenceSynthesisSchema;
export const StrategicIntelligenceSnapshotSchema = RelationalStrategicIntelligenceSnapshotSchema;
export const StrategicIntelligenceDashboardSchema = RelationalStrategicIntelligenceDashboardSchema;
export const StrategicIntelligenceRealtimeSchema = RelationalStrategicIntelligenceRealtimeSchema;
export const StrategicIntelligenceDiagnosticsSchema = RelationalStrategicIntelligenceDiagnosticsSchema;

export type RelationalStrategicIntelligenceOverviewDto = z.infer<
  typeof RelationalStrategicIntelligenceOverviewSchema
>;
export type RelationalStrategicIntelligenceRealtimeDto = z.infer<
  typeof RelationalStrategicIntelligenceRealtimeSchema
>;
