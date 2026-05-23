import { z } from "zod";

export const DataIntelligencePolicySchema = z.enum(["ACTIVE", "DISABLED"]);
export type DataIntelligencePolicy = z.infer<typeof DataIntelligencePolicySchema>;

export const OntologyDependencyChainSchema = z.object({
  id: z.string(),
  trigger: z.string(),
  poles: z.array(z.string()),
  narrative: z.string(),
  propagationScore: z.number().min(0).max(1),
});
export type OntologyDependencyChain = z.infer<typeof OntologyDependencyChainSchema>;

export const EconomicOntologyResponseSchema = z.object({
  version: z.literal("1"),
  generatedAt: z.string(),
  organizationId: z.string(),
  policy: DataIntelligencePolicySchema,
  graphDensity: z.number().min(0).max(1),
  poleConnectivity: z.record(z.string(), z.number().min(0).max(1)),
  dependencyChains: z.array(OntologyDependencyChainSchema).max(24),
  cascadingImpacts: z.array(
    z.object({
      scenario: z.string(),
      polesAffected: z.array(z.string()),
      severity: z.number().min(0).max(1),
      explanation: z.string(),
    }),
  ),
  economicPropagationScore: z.number().min(0).max(1),
  orderFailureImpactNarrative: z.string(),
  entityCounts: z.object({
    orders: z.number(),
    negotiations: z.number(),
    messages: z.number(),
    relationships: z.number(),
    wallets: z.number(),
    shipments: z.number(),
    economicSignals7d: z.number(),
  }),
});
export type EconomicOntologyResponse = z.infer<typeof EconomicOntologyResponseSchema>;

export const CrossPoleCorrelationRowSchema = z.object({
  id: z.string(),
  kind: z.string(),
  strength: z.number().min(0).max(1),
  poles: z.tuple([z.string(), z.string()]),
  evidence: z.string(),
  territoryHint: z.string().optional(),
  /** Instruction 17A — explicit pole labels (mirrors poles for API clarity). */
  sourcePoles: z.tuple([z.string(), z.string()]).optional(),
  confidence: z.number().min(0).max(1).optional(),
  affectedTerritories: z.array(z.string()).max(24).optional(),
  explanation: z.string().optional(),
  /** Snapshot field names actually used in strength/evidence (no misleading labels). */
  sourceFields: z.array(z.string()).max(24).optional(),
});
export type CrossPoleCorrelationRow = z.infer<typeof CrossPoleCorrelationRowSchema>;

export const CrossPoleCorrelationResponseSchema = z.object({
  version: z.literal("1"),
  generatedAt: z.string(),
  organizationId: z.string(),
  policy: DataIntelligencePolicySchema,
  rows: z.array(CrossPoleCorrelationRowSchema).max(32),
  summary: z.string(),
});
export type CrossPoleCorrelationResponse = z.infer<typeof CrossPoleCorrelationResponseSchema>;

export const DataAnomalySchema = z.object({
  id: z.string(),
  kind: z.string(),
  severity: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
  impactedPoles: z.array(z.string()),
  propagationRisk: z.number().min(0).max(1),
  territory: z.string().optional(),
  probableCause: z.string(),
  recommendedActions: z.array(z.string()).max(8),
});
export type DataAnomaly = z.infer<typeof DataAnomalySchema>;

export const AnomalyIntelligenceResponseSchema = z.object({
  version: z.literal("1"),
  generatedAt: z.string(),
  organizationId: z.string(),
  policy: DataIntelligencePolicySchema,
  anomalies: z.array(DataAnomalySchema).max(40),
});
export type AnomalyIntelligenceResponse = z.infer<typeof AnomalyIntelligenceResponseSchema>;

export const PredictiveSignalSchema = z.object({
  id: z.string(),
  kind: z.string(),
  confidence: z.number().min(0).max(1),
  timeHorizon: z.enum(["24h", "72h", "7d", "30d"]),
  predictionBasis: z.string(),
  sourceSignals: z.array(z.string()).max(12),
  headline: z.string(),
  riskLevel: z.number().min(0).max(1),
});
export type PredictiveSignal = z.infer<typeof PredictiveSignalSchema>;

export const PredictiveSignalsResponseSchema = z.object({
  version: z.literal("1"),
  generatedAt: z.string(),
  organizationId: z.string(),
  policy: DataIntelligencePolicySchema,
  signals: z.array(PredictiveSignalSchema).max(24),
});
export type PredictiveSignalsResponse = z.infer<typeof PredictiveSignalsResponseSchema>;

export const TerritoryIntelligenceResponseSchema = z.object({
  version: z.literal("1"),
  generatedAt: z.string(),
  organizationId: z.string(),
  policy: DataIntelligencePolicySchema,
  fragileTerritories: z.array(
    z.object({
      territoryCode: z.string(),
      fragilityScore: z.number(),
      drivers: z.array(z.string()).max(8),
    }),
  ),
  crossPoleStress: z.number().min(0).max(1),
  narrative: z.string(),
});
export type TerritoryIntelligenceResponse = z.infer<typeof TerritoryIntelligenceResponseSchema>;

export const GraphIntelligenceResponseSchema = z.object({
  version: z.literal("1"),
  generatedAt: z.string(),
  organizationId: z.string(),
  policy: DataIntelligencePolicySchema,
  networkStress: z.number().min(0).max(1),
  clusterHealth: z.number().min(0).max(1),
  orphanEdges: z.number(),
  trustCompression: z.number().min(0).max(1),
  narrative: z.string(),
  /** Instruction 17A — graph engine / depth (optional for backward clients). */
  graphDensity: z.number().min(0).max(1).optional(),
  weakClusters: z.number().int().min(0).optional(),
  dependencyHubs: z.number().int().min(0).optional(),
  centralityProxy: z.number().min(0).max(1).optional(),
  resilienceScore: z.number().min(0).max(1).optional(),
  isolatedActors: z.number().int().min(0).optional(),
  bridgeActors: z.number().int().min(0).optional(),
  graphEngineReuse: z.string().optional(),
});
export type GraphIntelligenceResponse = z.infer<typeof GraphIntelligenceResponseSchema>;

export const DecisionSimulationTradeoffSchema = z.object({
  dimension: z.string(),
  delta: z.number(),
  unit: z.enum(["score", "ratio", "currency_pressure"]),
  prescription: z.string(),
});

export const DecisionSimulationScenarioSchema = z.object({
  id: z.string(),
  decision: z.string(),
  riskDelta: z.number(),
  marginPressure: z.number(),
  logisticsPressure: z.number(),
  networkStress: z.number(),
  liquidityImpact: z.number(),
  tradeoffs: z.array(DecisionSimulationTradeoffSchema).max(12),
  headlinePrescription: z.string(),
});
export type DecisionSimulationScenario = z.infer<typeof DecisionSimulationScenarioSchema>;

export const DecisionSimulationResponseSchema = z.object({
  version: z.literal("1"),
  generatedAt: z.string(),
  organizationId: z.string(),
  policy: DataIntelligencePolicySchema,
  scenarios: z.array(DecisionSimulationScenarioSchema).max(8),
  acceptOrderSimulation: DecisionSimulationScenarioSchema.optional(),
});
export type DecisionSimulationResponse = z.infer<typeof DecisionSimulationResponseSchema>;

export const ExplainedScoreSchema = z.object({
  score: z.number().min(0).max(1),
  explanation: z.string(),
  sources: z.array(z.string()).max(16),
});

export const EconomicScoreResponseSchema = z.object({
  version: z.literal("1"),
  generatedAt: z.string(),
  organizationId: z.string(),
  policy: DataIntelligencePolicySchema,
  organizationEconomicScore: ExplainedScoreSchema,
  territoryEconomicScore: ExplainedScoreSchema,
  networkResilienceScore: ExplainedScoreSchema,
  liquidityStressScore: ExplainedScoreSchema,
  fulfillmentReliabilityScore: ExplainedScoreSchema,
  relationshipTrustScore: ExplainedScoreSchema,
});
export type EconomicScoreResponse = z.infer<typeof EconomicScoreResponseSchema>;

export const DataQualityIssueSchema = z.object({
  id: z.string(),
  kind: z.string(),
  severity: z.number().min(0).max(1),
  detail: z.string(),
  poles: z.array(z.string()),
  entityRef: z.string().optional(),
  affectedPole: z.string().optional(),
  recommendation: z.string().optional(),
});

export const DataQualityIntelligenceResponseSchema = z.object({
  version: z.literal("1"),
  generatedAt: z.string(),
  organizationId: z.string(),
  policy: DataIntelligencePolicySchema,
  issues: z.array(DataQualityIssueSchema).max(32),
  guardianReadiness: z.number().min(0).max(1),
});
export type DataQualityIntelligenceResponse = z.infer<typeof DataQualityIntelligenceResponseSchema>;

export const IntelligenceInterventionRankingBasisSchema = z.object({
  urgencyScore: z.number(),
  impactScore: z.number(),
  confidenceScore: z.number(),
  signalStrengthScore: z.number(),
  territoryFactor: z.number(),
  finalScore: z.number(),
});

export const IntelligenceInterventionSchema = z.object({
  id: z.string(),
  kind: z.enum([
    "stabilize_territory",
    "reduce_network_fragility",
    "protect_liquidity",
    "reduce_supply_chain_stress",
    "reinforce_relationship_cluster",
    "isolate_anomaly",
    "stabilize_distribution_flow",
    "reduce_prediction_risk",
  ]),
  headline: z.string(),
  urgency: z.enum(["low", "medium", "high", "critical"]),
  affectedTerritories: z.array(z.string()),
  relatedSignals: z.array(z.string()),
  /** Instruction 17A — explicit pole targets (may mirror relatedSignals semantics). */
  impactedPoles: z.array(z.string()).max(12).optional(),
  /** Instruction 17A — upstream metric keys feeding the intervention. */
  sourceSignals: z.array(z.string()).max(16).optional(),
  confidence: z.number(),
  rankingBasis: IntelligenceInterventionRankingBasisSchema.optional(),
  finalScore: z.number().optional(),
});
export type IntelligenceIntervention = z.infer<typeof IntelligenceInterventionSchema>;

export const IntelligenceInterventionsResponseSchema = z.object({
  version: z.literal("1"),
  generatedAt: z.string(),
  organizationId: z.string(),
  interventions: z.array(IntelligenceInterventionSchema).max(16),
});
export type IntelligenceInterventionsResponse = z.infer<typeof IntelligenceInterventionsResponseSchema>;

export const DataIntelligenceBriefingResponseSchema = z.object({
  provider: z.enum(["MockAIProvider"]),
  /** Instruction 17A — explicit mock / non-LLM labeling. */
  providerMode: z.enum(["MOCK_PROVIDER", "DISABLED"]).optional(),
  realLLMConnected: z.boolean().optional(),
  mockContextUsed: z.boolean().optional(),
  policy: DataIntelligencePolicySchema,
  title: z.string(),
  executiveSummary: z.string(),
  weakSignals: z.array(z.string()).max(16),
  systemicTensions: z.array(z.string()).max(16),
  futureRisks: z.array(z.string()).max(16),
  hiddenOpportunities: z.array(z.string()).max(12),
  criticalAnomalies: z.array(z.string()).max(12),
  economicDependencies: z.array(z.string()).max(12),
  confidence: z.number().min(0).max(1),
  dataSources: z.array(z.string()),
  tone: z.literal("economic_superintelligence"),
  note: z.string(),
});
export type DataIntelligenceBriefingResponse = z.infer<typeof DataIntelligenceBriefingResponseSchema>;

export const DataIntelligenceOverviewResponseSchema = z.object({
  version: z.literal("1"),
  generatedAt: z.string(),
  organizationId: z.string(),
  policy: DataIntelligencePolicySchema,
  economicPropagationScore: z.number(),
  activeCorrelations: z.number(),
  openAnomalies: z.number(),
  predictiveHighRisk: z.number(),
  dataQualityGuardianReadiness: z.number(),
  headline: z.string(),
  diagnostics: z
    .object({
      composeCache: z.literal("SHORT_TTL_COMPOSE_CACHE"),
      composeCacheHit: z.boolean(),
    })
    .optional(),
});
export type DataIntelligenceOverviewResponse = z.infer<typeof DataIntelligenceOverviewResponseSchema>;

export const DataIntelligenceBundleResponseSchema = z.object({
  version: z.literal("1"),
  generatedAt: z.string(),
  organizationId: z.string(),
  overview: DataIntelligenceOverviewResponseSchema,
  ontology: EconomicOntologyResponseSchema,
  correlations: CrossPoleCorrelationResponseSchema,
  anomalies: AnomalyIntelligenceResponseSchema,
  predictiveSignals: PredictiveSignalsResponseSchema,
  territoryIntelligence: TerritoryIntelligenceResponseSchema,
  graphIntelligence: GraphIntelligenceResponseSchema,
  decisionSimulation: DecisionSimulationResponseSchema,
  economicScore: EconomicScoreResponseSchema,
  dataQuality: DataQualityIntelligenceResponseSchema,
  briefing: DataIntelligenceBriefingResponseSchema,
  interventions: IntelligenceInterventionsResponseSchema,
});
export type DataIntelligenceBundleResponse = z.infer<typeof DataIntelligenceBundleResponseSchema>;
