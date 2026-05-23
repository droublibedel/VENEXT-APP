import { z } from "zod";

import {
  CommercialCorridorSignalTypeSchema,
  CommercialCorridorStateSchema,
  CommercialCorridorVisibilitySchema,
  CorridorRealtimeChangedItemSchema,
} from "./corridor-enums.js";

const unit = z.number().min(0).max(1);

export const signalReadinessValueSchema = z.enum([
  "EMITTED",
  "NOT_CONNECTED_YET",
  "REQUIRES_PAYMENT_MODULE",
  "REQUIRES_LOGISTICS_MODULE",
  "REQUIRES_MORE_HISTORY",
]);

export const CommercialCorridorSignalSchema = z.object({
  signalType: CommercialCorridorSignalTypeSchema,
  signalStrength: unit,
  explanation: z.string().max(4000),
  metadata: z.record(z.string(), z.unknown()),
  heuristicOnly: z.literal(true),
  sourceCounters: z.record(z.string(), z.union([z.number(), z.string()])).optional(),
  computedAt: z.string().datetime(),
});

export const CommercialCorridorDiagnosticsSchema = z.object({
  heuristicOnly: z.literal(true),
  privateEconomicCorridor: z.literal(true),
  publicRankingDisabled: z.literal(true),
  marketplaceExposureDisabled: z.literal(true),
  governanceValidated: z.boolean(),
  transitionAllowed: z.boolean(),
  governanceReason: z.string().max(2000),
  governanceDecisionSource: z.enum([
    "HEURISTIC_ENGINE",
    "GRAPH_STATUS_SYNC",
    "SPONSORED_SYNC",
    "BACKOFFICE_OVERRIDE",
    "HEALTH_COMPUTE",
  ]),
  humanModerationRequired: z.boolean(),
  sponsoredOrigin: z.boolean(),
  sponsoredConversionSuccess: z.boolean().nullable(),
  sponsoredCommercialConsistency: z.boolean().nullable(),
  corridorRiskLevel: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  relationshipIntelligenceScope: z.enum([
    "RELATIONSHIP_SELF_PRIVATE",
    "RELATIONSHIP_PARTNER_LIMITED",
    "RELATIONSHIP_BACKOFFICE_FULL",
    "RELATIONSHIP_NONE",
  ]),
  /** Instruction 20.4A — compute vs persisted state transparency */
  computedSuggestedState: CommercialCorridorStateSchema.nullable().optional(),
  persistedCorridorState: CommercialCorridorStateSchema.nullable().optional(),
  protectedStatePreserved: z.boolean().optional(),
  stateOverwriteBlockedReason: z.string().max(500).nullable().optional(),
  emittedSignalTypes: z.array(CommercialCorridorSignalTypeSchema),
  unavailableSignalTypes: z.array(CommercialCorridorSignalTypeSchema),
  signalReadiness: z.record(z.string(), signalReadinessValueSchema),
  optionalDependencyMissing: z.array(z.string()).optional(),
  optionalDependencyWarnings: z.array(z.string()).optional(),
  dependencyStatus: z.record(z.string(), z.enum(["OK", "MISSING", "WARN"])).optional(),
  productionFailClosed: z.boolean().optional(),
  reactivationRequired: z.boolean().optional(),
  /** Instruction 20.4B — policy wiring truth */
  orderCreationDirectCallSites: z.enum(["NOT_PRESENT_IN_CODEBASE"]).optional(),
  orderCreationPolicyWired: z.boolean().optional(),
  cartConversionPolicyWired: z.boolean().optional(),
  /** Instruction 20.4B — sponsored rejection transparency */
  sponsoredRejectionReason: z.string().max(500).nullable().optional(),
  sponsoredRejectionPolicy: z.string().max(200).nullable().optional(),
  sponsoredRejectionCorridorTarget: CommercialCorridorStateSchema.nullable().optional(),
  /** Instruction 20.4B — operational caution telemetry (e.g. DEGRADED negotiation path) */
  governanceOperationalWarnings: z.array(z.string().max(500)).optional(),
  governanceWarningCodes: z.array(z.string().max(120)).optional(),
});

export const CommercialCorridorProfileSchema = z.object({
  relationshipId: z.string().uuid(),
  corridorState: CommercialCorridorStateSchema,
  /** Null when redacted for non-backoffice actors (Instruction 20.4A). */
  corridorHealthNumeric: z.number().int().min(0).max(100).nullable(),
  corridorHealthBand: z.enum(["LOW", "MEDIUM", "HIGH"]),
  corridorRiskLevel: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  corridorVisibilityLevel: CommercialCorridorVisibilitySchema,
  corridorEconomicImportance: z.number().min(0).max(1),
  corridorActivatedAt: z.string().datetime().nullable(),
  corridorLastActivityAt: z.string().datetime().nullable(),
  relationshipStatus: z.string(),
  relationshipSource: z.string(),
  signals: z.array(CommercialCorridorSignalSchema),
  diagnostics: CommercialCorridorDiagnosticsSchema,
});

export const CommercialCorridorRealtimeSchema = z.object({
  relationshipId: z.string().uuid(),
  corridorState: CommercialCorridorStateSchema,
  corridorHealthBand: z.enum(["LOW", "MEDIUM", "HIGH"]),
  /** Instruction 20.4B — strict union: engine signal types or realtime change tokens */
  changedSignals: z.array(CorridorRealtimeChangedItemSchema).max(24),
  heuristicOnly: z.literal(true),
  computedAt: z.string().datetime(),
  privateEconomicCorridor: z.literal(true),
  publicRankingDisabled: z.literal(true),
  marketplaceExposureDisabled: z.literal(true),
  /** Instruction 20.4B — delivery honesty (replaces blind emittedToBothParties: true) */
  intendedTargetOrganizationIds: z.array(z.string().uuid()).max(4),
  deliveredTargetOrganizationIds: z.array(z.string().uuid()),
  skippedTargetOrganizationIds: z.array(z.string().uuid()).optional(),
  emittedToAllCorridorParties: z.boolean(),
  partialDeliveryReason: z.string().max(400).nullable().optional(),
})
  .strict()
  .superRefine((val, ctx) => {
    const distinctIntended = new Set(val.intendedTargetOrganizationIds).size;
    if (val.emittedToAllCorridorParties && distinctIntended < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "emittedToAllCorridorParties requires at least two distinct intended organizations",
        path: ["emittedToAllCorridorParties"],
      });
    }
    if (val.emittedToAllCorridorParties) {
      const distinctDelivered = new Set(val.deliveredTargetOrganizationIds).size;
      if (distinctDelivered < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "emittedToAllCorridorParties requires at least two successful deliveries (distinct delivered ids)",
          path: ["deliveredTargetOrganizationIds"],
        });
      }
    }
  });

export type CommercialCorridorProfileDto = z.infer<typeof CommercialCorridorProfileSchema>;
export type CommercialCorridorDiagnosticsDto = z.infer<typeof CommercialCorridorDiagnosticsSchema>;
export type CommercialCorridorRealtimeDto = z.infer<typeof CommercialCorridorRealtimeSchema>;
