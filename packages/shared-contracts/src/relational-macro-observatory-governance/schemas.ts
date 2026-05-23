import { z } from "zod";

const disabledFlags = {
  paymentExecutionDisabled: z.literal(true),
  publicTrackingDisabled: z.literal(true),
} as const;

export const RelationalMacroObservatoryGovernanceSeveritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const RelationalMacroObservatoryGovernanceStatusSchema = z.enum(["DRAFT", "ACTIVE", "OBSERVING", "ARCHIVED"]);
export const RelationalMacroObservatoryGovernanceTypeSchema = z.enum([
  "MACRO_GOVERNANCE_OVERVIEW",
  "NETWORK_COORDINATION",
  "SYSTEMIC_GOVERNANCE",
  "EXECUTIVE_NETWORK_ALIGNMENT",
]);
export const RelationalMacroObservatoryGovernancePrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const RelationalMacroObservatoryGovernanceSignalTypeSchema = z.enum([
  "GOVERNANCE",
  "EXECUTIVE",
  "SYSTEMIC",
  "RESILIENCE",
  "BALANCE",
]);
export const RelationalMacroObservatoryGovernanceMatrixTypeSchema = z.enum([
  "MACRO_OBSERVATORY_GOVERNANCE_MATRIX",
  "EXECUTIVE_COORDINATION_MATRIX",
  "SYSTEMIC_GOVERNANCE_MATRIX",
  "TERRITORIAL_BALANCE_MATRIX",
  "SECTOR_BALANCE_MATRIX",
  "RESILIENCE_GOVERNANCE_MATRIX",
  "NETWORK_ALIGNMENT_MATRIX",
]);

export const RelationalMacroObservatoryGovernanceDiagnosticsSchema = z
  .object({
    heuristicFallbackUsed: z.boolean(),
    fallbackReasons: z.array(z.string().min(1).max(200)).max(32),
    signalCount: z.number().int().min(0).max(64),
    matrixCount: z.number().int().min(0).max(64),
    executiveCoordinationPressureDetected: z.boolean(),
    systemicConcentrationDetected: z.boolean(),
    macroGovernancePriorityDetected: z.boolean(),
  })
  .strict();

const macroGovernanceNodeWireSchema = z
  .object({
    id: z.string().uuid(),
    relationshipId: z.string().uuid(),
    nodeCode: z.string().min(1).max(240),
    macroGovernanceType: RelationalMacroObservatoryGovernanceTypeSchema,
    macroGovernancePriority: RelationalMacroObservatoryGovernancePrioritySchema,
    macroGovernanceStatus: RelationalMacroObservatoryGovernanceStatusSchema,
    severity: RelationalMacroObservatoryGovernanceSeveritySchema,
    macroGovernanceScore: z.number().int().min(0).max(100),
    executiveCoordinationPressure: z.number().int().min(0).max(100),
    systemicConcentration: z.number().int().min(0).max(100),
    resilienceStrength: z.number().int().min(0).max(100),
    networkAlignmentPressure: z.number().int().min(0).max(100),
    strategicAlignmentScore: z.number().int().min(0).max(100),
    governancePressure: z.number().int().min(0).max(100),
    arbitrationPressure: z.number().int().min(0).max(100),
    stabilizationPressure: z.number().int().min(0).max(100),
    monitoringPressure: z.number().int().min(0).max(100),
    orchestrationPressure: z.number().int().min(0).max(100),
    institutionalPressure: z.number().int().min(0).max(100),
    intelligencePressure: z.number().int().min(0).max(100),
    commandPressure: z.number().int().min(0).max(100),
    operationsPressure: z.number().int().min(0).max(100),
    controlRoomPressure: z.number().int().min(0).max(100),
    synthesisPressure: z.number().int().min(0).max(100),
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

const observatorySignalWireSchema = z
  .object({
    id: z.string().uuid(),
    signalCode: z.string().min(1).max(240),
    signalType: RelationalMacroObservatoryGovernanceSignalTypeSchema,
    intensity: z.number().int().min(0).max(100),
    pressureLevel: z.number().int().min(0).max(100),
    riskLevel: z.number().int().min(0).max(100),
    createdAt: z.string(),
    ...disabledFlags,
  })
  .strict();

const macroGovernanceMatrixWireSchema = z
  .object({
    id: z.string().uuid(),
    matrixCode: z.string().min(1).max(240),
    matrixType: RelationalMacroObservatoryGovernanceMatrixTypeSchema,
    severity: RelationalMacroObservatoryGovernanceSeveritySchema,
    priority: RelationalMacroObservatoryGovernancePrioritySchema,
    title: z.string().min(1).max(400),
    summary: z.string().min(1).max(4000),
    institutionalPressure: z.number().int().min(0).max(100),
    executiveCoordinationPressure: z.number().int().min(0).max(100),
    createdAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalMacroObservatoryGovernanceOverviewSchema = z
  .object({
    relationshipId: z.string().uuid(),
    node: macroGovernanceNodeWireSchema,
    signals: z.array(observatorySignalWireSchema).max(24),
    matrices: z.array(macroGovernanceMatrixWireSchema).max(32),
    overviewDiagnostics: RelationalMacroObservatoryGovernanceDiagnosticsSchema,
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalMacroObservatoryGovernanceSignalSchema = observatorySignalWireSchema;
export const RelationalMacroObservatoryGovernanceMatrixSchema = macroGovernanceMatrixWireSchema;

export const RelationalMacroObservatoryGovernanceSnapshotSchema = z
  .object({
    id: z.string().uuid(),
    relationshipId: z.string().uuid(),
    snapshotCode: z.string().min(1).max(240),
    macroGovernanceStatus: RelationalMacroObservatoryGovernanceStatusSchema,
    macroGovernanceScore: z.number().int().min(0).max(100),
    executiveCoordinationPressure: z.number().int().min(0).max(100),
    systemicConcentration: z.number().int().min(0).max(100),
    resilienceStrength: z.number().int().min(0).max(100),
    createdAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalMacroObservatoryGovernanceDashboardSchema = z
  .object({
    organizationId: z.string().uuid(),
    activeNodeCount: z.number().int().min(0).max(10000),
    criticalMatrixCount: z.number().int().min(0).max(10000),
    meanMacroGovernanceScore: z.number().int().min(0).max(100),
    meanExecutiveCoordinationPressure: z.number().int().min(0).max(100),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const RelationalMacroObservatoryGovernanceActionResponseSchema = z
  .object({
    ok: z.literal(true),
    code: z.string().min(1).max(120),
    ...disabledFlags,
  })
  .strict();

export const RELATIONAL_MACRO_OBSERVATORY_GOVERNANCE_REALTIME_TYPES = [
  "relational.macro_observatory_governance.matrix_generated",
  "relational.macro_observatory_governance.executive_coordination_detected",
  "relational.macro_observatory_governance.systemic_concentration_detected",
  "relational.macro_observatory_governance.priority_detected",
  "relational.macro_observatory_governance.resilience_detected",
] as const;

export type RelationalMacroObservatoryGovernanceRealtimeEventType =
  (typeof RELATIONAL_MACRO_OBSERVATORY_GOVERNANCE_REALTIME_TYPES)[number];

export function isRelationalMacroObservatoryGovernanceRealtimeEventType(
  v: string,
): v is RelationalMacroObservatoryGovernanceRealtimeEventType {
  return (RELATIONAL_MACRO_OBSERVATORY_GOVERNANCE_REALTIME_TYPES as readonly string[]).includes(v);
}

export const RelationalMacroObservatoryGovernanceRealtimeSchema = z
  .object({
    relationshipId: z.string().uuid().nullable(),
    macroObservatoryGovernanceNodeId: z.string().uuid().nullable(),
    nodeCode: z.string().min(1).max(240).nullable(),
    intensity: z.number().int().min(0).max(100),
    governanceDepth: z.number().int().min(0).max(64),
    computedAt: z.string(),
    ...disabledFlags,
  })
  .strict();

export const MacroObservatoryGovernanceOverviewSchema = RelationalMacroObservatoryGovernanceOverviewSchema;
export const MacroObservatoryGovernanceSignalSchema = RelationalMacroObservatoryGovernanceSignalSchema;
export const MacroObservatoryGovernanceMatrixSchema = RelationalMacroObservatoryGovernanceMatrixSchema;
export const MacroObservatoryGovernanceSnapshotSchema = RelationalMacroObservatoryGovernanceSnapshotSchema;
export const MacroObservatoryGovernanceDashboardSchema = RelationalMacroObservatoryGovernanceDashboardSchema;
export const MacroObservatoryGovernanceRealtimeSchema = RelationalMacroObservatoryGovernanceRealtimeSchema;
export const MacroObservatoryGovernanceDiagnosticsSchema = RelationalMacroObservatoryGovernanceDiagnosticsSchema;

export type RelationalMacroObservatoryGovernanceOverviewDto = z.infer<typeof RelationalMacroObservatoryGovernanceOverviewSchema>;
export type RelationalMacroObservatoryGovernanceRealtimeDto = z.infer<typeof RelationalMacroObservatoryGovernanceRealtimeSchema>;
