import { z } from "zod";

export const EconomicMemoryPolicySchema = z.enum(["ACTIVE", "DISABLED"]);
export type EconomicMemoryPolicy = z.infer<typeof EconomicMemoryPolicySchema>;

export const EconomicMemoryBriefingSchema = z.object({
  provider: z.enum(["MockAIProvider"]),
  providerMode: z.enum(["MOCK_PROVIDER", "DISABLED"]).optional(),
  realLLMConnected: z.boolean().optional(),
  mockContextUsed: z.boolean().optional(),
  policy: EconomicMemoryPolicySchema,
  title: z.string(),
  executiveSummary: z.string(),
  recurrenceHighlights: z.array(z.string()).max(16),
  signatureHighlights: z.array(z.string()).max(16),
  patternHighlights: z.array(z.string()).max(16),
  trendHighlights: z.array(z.string()).max(16),
  confidence: z.number().min(0).max(1),
  analyticalLimits: z.array(z.string()).max(12),
  dataSources: z.array(z.string()).max(24),
  tone: z.literal("industrial_economic_memory"),
  note: z.string(),
});
export type EconomicMemoryBriefing = z.infer<typeof EconomicMemoryBriefingSchema>;

export const EconomicCrisisSignatureRowSchema = z.object({
  id: z.string(),
  signatureCode: z.string(),
  systemicRisk: z.number().min(0).max(1),
  recurrenceProbability: z.number().min(0).max(1),
  similarityIndex: z.number().min(0).max(1),
  explanation: z.string(),
  affectedPoles: z.array(z.string()).max(16),
  recommendedPriority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  territory: z.string().nullable().optional(),
  createdAt: z.string(),
});
export type EconomicCrisisSignatureRow = z.infer<typeof EconomicCrisisSignatureRowSchema>;

export const EconomicTemporalAnalysisSchema = z.object({
  trendDirection: z.enum(["UPWARD_STRESS", "FLAT", "DOWNWARD_STRESS"]),
  volatilityLevel: z.enum(["LOW", "MODERATE", "HIGH"]),
  accelerationFactor: z.number(),
  stabilizationProbability: z.number().min(0).max(1),
  unpaidEvolutionHint: z.string(),
  delayEvolutionHint: z.string(),
  fragileTerritoriesEvolutionHint: z.string(),
  trustEvolutionHint: z.string(),
  propagationVelocityHint: z.string(),
  similarEventScore: z.number().min(0).max(1),
  recurrenceWeight: z.number().min(0).max(1),
  historicalConfidence: z.number().min(0).max(1),
  propagationSimilarity: z.number().min(0).max(1),
});
export type EconomicTemporalAnalysis = z.infer<typeof EconomicTemporalAnalysisSchema>;

export const ShockPatternRowSchema = z.object({
  shockType: z.string(),
  count30d: z.number().int().min(0),
  frequencyIndex: z.number().min(0).max(1),
});
export type ShockPatternRow = z.infer<typeof ShockPatternRowSchema>;

export const EconomicMemoryHistoryRowSchema = z.object({
  id: z.string(),
  eventType: z.string(),
  pole: z.string(),
  territory: z.string().nullable(),
  severity: z.string(),
  confidence: z.number(),
  createdAt: z.string(),
  propagationDepth: z.number().nullable().optional(),
});
export type EconomicMemoryHistoryRow = z.infer<typeof EconomicMemoryHistoryRowSchema>;

export const EconomicMemoryBundleSchema = z.object({
  version: z.literal("1"),
  generatedAt: z.string(),
  organizationId: z.string(),
  policy: EconomicMemoryPolicySchema,
  headline: z.string(),
  disclaimer: z.string(),
  crisisSignatures: z.array(EconomicCrisisSignatureRowSchema).max(24),
  temporalAnalysis: EconomicTemporalAnalysisSchema.nullable(),
  propagationHistoryPreview: z.array(EconomicMemoryHistoryRowSchema).max(32),
  shockPatterns: z.array(ShockPatternRowSchema).max(32),
  territoryHistoryPreview: z.array(EconomicMemoryHistoryRowSchema).max(32),
  briefing: EconomicMemoryBriefingSchema.optional(),
});
export type EconomicMemoryBundle = z.infer<typeof EconomicMemoryBundleSchema>;
