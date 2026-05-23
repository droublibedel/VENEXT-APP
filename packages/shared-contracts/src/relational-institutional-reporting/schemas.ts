import { z } from "zod";

const disabledFlags = {
  paymentExecutionDisabled: z.literal(true),
  publicTrackingDisabled: z.literal(true),
} as const;

export const RelationalInstitutionalReportingSeveritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const RelationalInstitutionalReportingStatusSchema = z.enum(["DRAFT", "ACTIVE", "OBSERVING", "ARCHIVED"]);
export const RelationalInstitutionalReportingTypeSchema = z.enum([
  "INSTITUTIONAL_OVERVIEW",
  "EXECUTIVE_DIGEST",
  "STRATEGIC_INTELLIGENCE",
  "CORRIDOR_BRIEFING",
]);
export const RelationalInstitutionalReportingPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const RelationalInstitutionalReportingSignalTypeSchema = z.enum([
  "INSTITUTIONAL",
  "EXECUTIVE",
  "SYSTEMIC",
  "RESILIENCE",
  "ALIGNMENT",
]);
export const RelationalInstitutionalReportingBriefTypeSchema = z.enum([
  "EXECUTIVE_BRIEF",
  "STRATEGIC_BRIEF",
  "TERRITORIAL_BRIEF",
  "SECTOR_BRIEF",
  "SYSTEMIC_RISK_BRIEF",
  "RESILIENCE_BRIEF",
  "GOVERNANCE_BRIEF",
]);

export const RelationalInstitutionalReportingDiagnosticsSchema = z
  .object({
    heuristicFallbackUsed: z.boolean(),
    fallbackReasons: z.array(z.string().min(1).max(200)).max(32),
    signalCount: z.number().int().min(0).max(64),
    briefCount: z.number().int().min(0).max(64),
    systemicRiskDetected: z.boolean(),
    executivePressureDetected: z.boolean(),
    institutionalPriorityDetected: z.boolean(),
  })
  .strict();

const reportingNodeWireSchema = z
  .object({
    id: z.string().uuid(),
    relationshipId: z.string().uuid(),
    nodeCode: z.string().min(1).max(240),
    reportingType: RelationalInstitutionalReportingTypeSchema,
    reportingPriority: RelationalInstitutionalReportingPrioritySchema,
    reportingStatus: RelationalInstitutionalReportingStatusSchema,
    severity: RelationalInstitutionalReportingSeveritySchema,
    institutionalScore: z.number().int().min(0).max(100),
    executiveRisk: z.number().int().min(0).max(100),
    strategicResilience: z.number().int().min(0).max(100),
    systemicExposure: z.number().int().min(0).max(100),
    strategicAlignmentScore: z.number().int().min(0).max(100),
    governancePressure: z.number().int().min(0).max(100),
    arbitrationPressure: z.number().int().min(0).max(100),
    stabilizationPressure: z.number().int().min(0).max(100),
    monitoringPressure: z.number().int().min(0).max(100),
    orchestrationPressure: z.number().int().min(0).max(100),
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
    signalType: RelationalInstitutionalReportingSignalTypeSchema,
    intensity: z.number().int().min(0).max(100),
    pressureLevel: z.number().int().min(0).max(100),
    riskLevel: z.number().int().min(0).max(100),
    createdAt: z.string(),
    ...disabledFlags,
  })
  .strict();

const reportingBriefWireSchema = z
  .object({
    id: z.string().uuid(),
    briefCode: z.string().min(1).max(240),
    briefType: RelationalInstitutionalReportingBriefTypeSchema,
    severity: RelationalInstitutionalReportingSeveritySchema,
    priority: RelationalInstitutionalReportingPrioritySchema,
    title: z.string().min(1).max(400),
    summary: z.string().min(1).max(4000),
    institutionalPressure: z.number().int().min(0).max(100),
    systemicExposure: z.number().int().min(0).max(100),
    createdAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalInstitutionalReportingOverviewSchema = z
  .object({
    relationshipId: z.string().uuid(),
    node: reportingNodeWireSchema,
    signals: z.array(reportingSignalWireSchema).max(24),
    briefs: z.array(reportingBriefWireSchema).max(32),
    overviewDiagnostics: RelationalInstitutionalReportingDiagnosticsSchema,
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalInstitutionalReportingSignalSchema = reportingSignalWireSchema;
export const RelationalInstitutionalReportingBriefSchema = reportingBriefWireSchema;

export const RelationalInstitutionalReportingSnapshotSchema = z
  .object({
    id: z.string().uuid(),
    relationshipId: z.string().uuid(),
    snapshotCode: z.string().min(1).max(240),
    reportingStatus: RelationalInstitutionalReportingStatusSchema,
    institutionalScore: z.number().int().min(0).max(100),
    executiveRisk: z.number().int().min(0).max(100),
    strategicResilience: z.number().int().min(0).max(100),
    systemicExposure: z.number().int().min(0).max(100),
    createdAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalInstitutionalReportingDashboardSchema = z
  .object({
    organizationId: z.string().uuid(),
    activeNodeCount: z.number().int().min(0).max(10000),
    criticalBriefCount: z.number().int().min(0).max(10000),
    meanInstitutionalScore: z.number().int().min(0).max(100),
    meanExecutiveRisk: z.number().int().min(0).max(100),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalInstitutionalReportingActionResponseSchema = z
  .object({
    ok: z.literal(true),
    code: z.string().min(1).max(120),
    ...disabledFlags,
  })
  .strict();

export const RELATIONAL_INSTITUTIONAL_REPORTING_REALTIME_TYPES = [
  "relational.institutional_reporting.brief_generated",
  "relational.institutional_reporting.systemic_risk_detected",
  "relational.institutional_reporting.executive_pressure_detected",
  "relational.institutional_reporting.priority_detected",
  "relational.institutional_reporting.resilience_detected",
] as const;

export type RelationalInstitutionalReportingRealtimeEventType =
  (typeof RELATIONAL_INSTITUTIONAL_REPORTING_REALTIME_TYPES)[number];

export function isRelationalInstitutionalReportingRealtimeEventType(
  v: string,
): v is RelationalInstitutionalReportingRealtimeEventType {
  return (RELATIONAL_INSTITUTIONAL_REPORTING_REALTIME_TYPES as readonly string[]).includes(v);
}

export const RelationalInstitutionalReportingRealtimeSchema = z
  .object({
    relationshipId: z.string().uuid().nullable(),
    reportingNodeId: z.string().uuid().nullable(),
    nodeCode: z.string().min(1).max(240).nullable(),
    intensity: z.number().int().min(0).max(100),
    reportingDepth: z.number().int().min(0).max(64),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const InstitutionalReportingOverviewSchema = RelationalInstitutionalReportingOverviewSchema;
export const InstitutionalReportingSignalSchema = RelationalInstitutionalReportingSignalSchema;
export const InstitutionalReportingBriefSchema = RelationalInstitutionalReportingBriefSchema;
export const InstitutionalReportingSnapshotSchema = RelationalInstitutionalReportingSnapshotSchema;
export const InstitutionalReportingDashboardSchema = RelationalInstitutionalReportingDashboardSchema;
export const InstitutionalReportingRealtimeSchema = RelationalInstitutionalReportingRealtimeSchema;
export const InstitutionalReportingDiagnosticsSchema = RelationalInstitutionalReportingDiagnosticsSchema;

export type RelationalInstitutionalReportingOverviewDto = z.infer<
  typeof RelationalInstitutionalReportingOverviewSchema
>;
export type RelationalInstitutionalReportingRealtimeDto = z.infer<
  typeof RelationalInstitutionalReportingRealtimeSchema
>;
