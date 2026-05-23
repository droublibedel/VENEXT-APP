import { z } from "zod";

import { DataIntelligenceBundleResponseSchema } from "../data-intelligence/dtos.js";

export const EconomicPropagationPolicySchema = z.enum(["ACTIVE", "DISABLED"]);
export type EconomicPropagationPolicy = z.infer<typeof EconomicPropagationPolicySchema>;

export const ShockSeveritySchema = z.enum(["LOW", "MODERATE", "HIGH", "CRITICAL"]);
export type ShockSeverity = z.infer<typeof ShockSeveritySchema>;

export const EconomicShockSchema = z.object({
  id: z.string(),
  type: z.string(),
  sourcePole: z.string(),
  sourceEntityType: z.string(),
  sourceEntityId: z.string().optional(),
  severity: ShockSeveritySchema,
  confidence: z.number().min(0).max(1),
  affectedPoles: z.array(z.string()).max(16),
  affectedTerritories: z.array(z.string()).max(24),
  systemicRisk: z.number().min(0).max(1),
  sourceSignals: z.array(z.string()).max(32),
  /** Stable key for dedupe: type + source pole + territory slice + signal fingerprint (Instruction 18.1A). */
  deduplicationKey: z.string().optional(),
  explanation: z.string(),
  createdAt: z.string(),
});
export type EconomicShock = z.infer<typeof EconomicShockSchema>;

export const PropagationImpactSchema = z.object({
  targetPole: z.string(),
  impactType: z.string(),
  intensity: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
  estimatedDelayMinutes: z.number().min(0),
  affectedTerritories: z.array(z.string()).max(16),
  explanation: z.string(),
  /** When true, impact is same-pole amplification and explanation must justify it (18.1A). */
  selfLoop: z.boolean().optional(),
});
export type PropagationImpact = z.infer<typeof PropagationImpactSchema>;

export const EconomicPropagationChainSchema = z.object({
  chainId: z.string(),
  shock: EconomicShockSchema,
  impacts: z.array(PropagationImpactSchema).max(32),
  systemicRiskScore: z.number().min(0).max(1),
  propagationDepth: z.number().int().min(0),
  recommendedInterventions: z.array(z.string()).max(16),
});
export type EconomicPropagationChain = z.infer<typeof EconomicPropagationChainSchema>;

export const TerritoryFragilitySchema = z.object({
  territory: z.string(),
  globalSystemicPressure: z.number().min(0).max(1),
  localTerritoryEvidence: z.number().min(0).max(1),
  localEvidenceSignals: z.array(z.string()).max(24),
  fragilityScore: z.number().min(0).max(1),
  liquidityExposure: z.number().min(0).max(1),
  logisticsExposure: z.number().min(0).max(1),
  relationshipExposure: z.number().min(0).max(1),
  paymentExposure: z.number().min(0).max(1),
  activationExposure: z.number().min(0).max(1),
  resilienceScore: z.number().min(0).max(1),
  explanation: z.string(),
});
export type TerritoryFragility = z.infer<typeof TerritoryFragilitySchema>;

export const PropagationSimulationSchema = z.object({
  simulationId: z.string(),
  triggerType: z.string(),
  estimatedImpacts: z.array(PropagationImpactSchema).max(32),
  predictedEscalation: z.string(),
  systemicRiskScore: z.number().min(0).max(1),
  affectedPoles: z.array(z.string()).max(16),
  affectedTerritories: z.array(z.string()).max(24),
  mitigationRecommendations: z.array(z.string()).max(16),
});
export type PropagationSimulation = z.infer<typeof PropagationSimulationSchema>;

export const EconomicPropagationOverviewSchema = z.object({
  version: z.literal("1"),
  generatedAt: z.string(),
  organizationId: z.string(),
  policy: EconomicPropagationPolicySchema,
  headline: z.string(),
  systemicRiskRollup: z.number().min(0).max(1),
  shockCount: z.number().int().min(0),
  chainCount: z.number().int().min(0),
  territoryFragileTop: z.number().int().min(0),
  diagnostics: z
    .object({
      /** Instruction 18.1A — canonical cache strategy label for clients. */
      cacheStrategy: z.literal("SHORT_TTL_PROPAGATION_CACHE"),
      composeCache: z.literal("SHORT_TTL_PROPAGATION_CACHE"),
      composeCacheHit: z.boolean(),
      cacheKey: z.string(),
      ruleCoverage: z
        .array(
          z.object({
            shockType: z.string(),
            explicitRuleFound: z.boolean(),
            usedDefaultRule: z.boolean(),
          }),
        )
        .max(40)
        .optional(),
    })
    .optional(),
});
export type EconomicPropagationOverview = z.infer<typeof EconomicPropagationOverviewSchema>;

export const EconomicPropagationBundleSchema = z.object({
  version: z.literal("1"),
  generatedAt: z.string(),
  organizationId: z.string(),
  overview: EconomicPropagationOverviewSchema,
  shocks: z.array(EconomicShockSchema).max(40),
  chains: z.array(EconomicPropagationChainSchema).max(24),
  territoryFragility: z.array(TerritoryFragilitySchema).max(32),
  simulationPreview: PropagationSimulationSchema,
  /**
   * When propagation compose reused Data Intelligence, echo the bundle here so coordination
   * can avoid a second DI compose (Instruction 18.4A).
   */
  upstreamDataIntelligenceBundle: DataIntelligenceBundleResponseSchema.optional(),
});
export type EconomicPropagationBundle = z.infer<typeof EconomicPropagationBundleSchema>;
