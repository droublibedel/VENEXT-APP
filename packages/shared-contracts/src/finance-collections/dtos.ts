import { z } from "zod";

export const FinancePolicySchema = z.enum(["ACTIVE", "DEGRADED", "DISABLED"]);

export const FinanceOverviewResponseSchema = z.object({
  version: z.literal("1"),
  generatedAt: z.string(),
  organizationId: z.string(),
  policy: FinancePolicySchema,
  receivablesPressure: z.number().min(0).max(1),
  overduePressure: z.number().min(0).max(1),
  paymentReliability: z.number().min(0).max(1),
  unstableAccounts: z.number().int().min(0),
  delayedCollections: z.number().int().min(0),
  walletLiquidityState: z.enum(["STRONG", "NEUTRAL", "STRESSED", "CRITICAL"]),
  downstreamSolvency: z.number().min(0).max(1),
  paymentExecutionConfidence: z.number().min(0).max(1),
  creditExposure: z.number().min(0).max(1),
  financialInstability: z.number().min(0).max(1),
  headline: z.string(),
  territoryStressTop: z.array(z.string()).max(8),
});

export const PaymentPressureTerritoryRowSchema = z.object({
  territoryCode: z.string(),
  overdueMass: z.number(),
  unstableBuyerCount: z.number().int(),
  liquidityTension: z.number().min(0).max(1),
  settlementDelayClusterScore: z.number().min(0).max(1),
  groupBuyingPressureHint: z.number().min(0).max(1),
});

export const PaymentPressureRadarResponseSchema = z.object({
  version: z.literal("1"),
  generatedAt: z.string(),
  organizationId: z.string(),
  policy: FinancePolicySchema,
  overdueTerritories: z.array(PaymentPressureTerritoryRowSchema),
  unstableBuyers: z.array(
    z.object({
      buyerOrganizationId: z.string(),
      displayName: z.string(),
      territoryCode: z.string(),
      accelerationScore: z.number(),
      collapseRiskScore: z.number().min(0).max(1),
      concentrationShare: z.number().min(0).max(1),
    }),
  ),
  collectionCollapseRisk: z.number().min(0).max(1),
  paymentConcentrationIndex: z.number().min(0).max(1),
  liquidityTensionIndex: z.number().min(0).max(1),
});

export const ReceivableHealthRowSchema = z.object({
  id: z.string(),
  healthStatus: z.enum(["HEALTHY", "DELAYED", "UNSTABLE", "BLOCKED", "SUSPICIOUS"]),
  outstandingAmount: z.number(),
  currency: z.string(),
  delayDays: z.number().int(),
  buyerOrganizationId: z.string(),
  buyerDisplayName: z.string(),
  territoryCode: z.string(),
  confidence: z.number().min(0).max(1),
  recommendation: z.string(),
  orderId: z.string(),
});

export const ReceivablesHealthResponseSchema = z.object({
  version: z.literal("1"),
  generatedAt: z.string(),
  organizationId: z.string(),
  policy: FinancePolicySchema,
  rows: z.array(ReceivableHealthRowSchema),
  healthyCount: z.number().int(),
  delayedCount: z.number().int(),
  unstableCount: z.number().int(),
  blockedCount: z.number().int(),
  suspiciousCount: z.number().int(),
});

export const PaymentBehaviorPayerRowSchema = z.object({
  buyerOrganizationId: z.string(),
  displayName: z.string(),
  territoryCode: z.string(),
  disciplineScore: z.number().min(0).max(1),
  volatilityScore: z.number().min(0).max(1),
  latePaymentStreak: z.number().int(),
  negotiationPaymentMismatch: z.number().min(0).max(1),
  recurrenceQuality: z.enum(["STRONG", "MIXED", "WEAK"]),
  bucket: z.enum(["RELIABLE", "UNSTABLE", "DEGRADED"]),
});

export const PaymentBehaviorObservatoryResponseSchema = z.object({
  version: z.literal("1"),
  generatedAt: z.string(),
  organizationId: z.string(),
  policy: FinancePolicySchema,
  payers: z.array(PaymentBehaviorPayerRowSchema),
  networkVolatilityIndex: z.number().min(0).max(1),
});

export const WalletLiquiditySurfaceResponseSchema = z.object({
  version: z.literal("1"),
  generatedAt: z.string(),
  organizationId: z.string(),
  policy: FinancePolicySchema,
  providerMode: z.enum(["MOCK_PROVIDER", "NOT_CONFIGURED", "READY"]),
  wallets: z.array(
    z.object({
      organizationId: z.string(),
      currency: z.string(),
      balance: z.number(),
      status: z.string(),
      qrReadiness: z.number().min(0).max(1),
      nfcReadiness: z.number().min(0).max(1),
      electronicReadiness: z.number().min(0).max(1),
      liquidityStress: z.number().min(0).max(1),
      recentTxnVelocity: z.number(),
    }),
  ),
  liquidityStressIndex: z.number().min(0).max(1),
});

export const CreditRiskRowSchema = z.object({
  id: z.string(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  exposureAmount: z.number(),
  currency: z.string(),
  affectedOrganizationId: z.string(),
  affectedDisplayName: z.string(),
  probableCause: z.string(),
  recommendation: z.string(),
  confidence: z.number().min(0).max(1),
});

export const CreditRiskMatrixResponseSchema = z.object({
  version: z.literal("1"),
  generatedAt: z.string(),
  organizationId: z.string(),
  policy: FinancePolicySchema,
  rows: z.array(CreditRiskRowSchema),
  downstreamSolvencyRisk: z.number().min(0).max(1),
  exposureConcentration: z.number().min(0).max(1),
  collapseRiskField: z.number().min(0).max(1),
});

export const CashflowIntelligenceResponseSchema = z.object({
  version: z.literal("1"),
  generatedAt: z.string(),
  organizationId: z.string(),
  policy: FinancePolicySchema,
  inflowStability: z.number().min(0).max(1),
  delayedInflowSignal: z.number().min(0).max(1),
  collectionAcceleration: z.number(),
  unstableCycleScore: z.number().min(0).max(1),
  treasuryPressure: z.number().min(0).max(1),
  settlementRhythmDegradation: z.number().min(0).max(1),
});

export const PaymentAnomalyRowSchema = z.object({
  id: z.string(),
  kind: z.enum([
    "SUSPICIOUS_PATTERN",
    "SETTLEMENT_INSTABILITY",
    "ABNORMAL_LATENCY",
    "INCONSISTENT_PAYER",
    "WALLET_MOVEMENT",
  ]),
  buyerOrganizationId: z.string().optional(),
  detail: z.string(),
  severity: z.number().min(0).max(1),
  relatedOrderIds: z.array(z.string()),
});

export const PaymentAnomalyRadarResponseSchema = z.object({
  version: z.literal("1"),
  generatedAt: z.string(),
  organizationId: z.string(),
  policy: FinancePolicySchema,
  anomalies: z.array(PaymentAnomalyRowSchema),
});

export const CollectionPriorityItemSchema = z.object({
  id: z.string(),
  buyerOrganizationId: z.string(),
  buyerDisplayName: z.string(),
  territoryCode: z.string(),
  amount: z.number(),
  currency: z.string(),
  urgency: z.number().min(0).max(1),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  expectedRecoveryImpact: z.number().min(0).max(1),
  recommendedAction: z.string(),
  confidence: z.number().min(0).max(1),
  rankingBasis: z.string(),
  rank: z.number().int(),
});

export const CollectionPrioritiesResponseSchema = z.object({
  version: z.literal("1"),
  generatedAt: z.string(),
  organizationId: z.string(),
  policy: FinancePolicySchema,
  items: z.array(CollectionPriorityItemSchema),
});

export const FinanceCollectionsBriefingResponseSchema = z.object({
  provider: z.enum(["MockAIProvider"]),
  policy: z.enum(["ACTIVE", "DISABLED"]),
  title: z.string(),
  executiveSummary: z.string(),
  liquidityNote: z.string(),
  receivablesNote: z.string(),
  paymentInstabilityNote: z.string(),
  creditExposureNote: z.string(),
  recommendedCollectionMoves: z.array(z.string()).max(12),
  confidence: z.number().min(0).max(1),
  dataSources: z.array(z.string()),
  tone: z.literal("finance_strategist"),
  note: z.string(),
});

export const FinancialInterventionSchema = z.object({
  id: z.string(),
  kind: z.enum([
    "PRIORITIZE_COLLECTION",
    "STABILIZE_LIQUIDITY",
    "REDUCE_EXPOSURE",
    "REINFORCE_STRATEGIC_ACCOUNT",
    "REDUCE_PAYMENT_COLLAPSE_RISK",
    "ACCELERATE_SETTLEMENT",
    "RESTRICT_CREDIT_EXPOSURE",
    "MONITOR_UNSTABLE_PAYER",
  ]),
  urgency: z.number().min(0).max(1),
  expectedImpact: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
  affectedTerritories: z.array(z.string()),
  relatedSignals: z.array(z.string()),
  finalScore: z.number(),
  headline: z.string(),
});

export const FinancialInterventionsResponseSchema = z.object({
  version: z.literal("1"),
  generatedAt: z.string(),
  organizationId: z.string(),
  interventions: z.array(FinancialInterventionSchema),
});

export const FinanceCollectionsBundleResponseSchema = z.object({
  version: z.literal("1"),
  generatedAt: z.string(),
  organizationId: z.string(),
  overview: FinanceOverviewResponseSchema,
  paymentPressure: PaymentPressureRadarResponseSchema,
  receivablesHealth: ReceivablesHealthResponseSchema,
  paymentBehavior: PaymentBehaviorObservatoryResponseSchema,
  walletLiquidity: WalletLiquiditySurfaceResponseSchema,
  creditRisk: CreditRiskMatrixResponseSchema,
  cashflow: CashflowIntelligenceResponseSchema,
  paymentAnomalies: PaymentAnomalyRadarResponseSchema,
  collectionPriorities: CollectionPrioritiesResponseSchema,
  briefing: FinanceCollectionsBriefingResponseSchema,
  interventions: FinancialInterventionsResponseSchema,
});

export type ReceivableHealthRow = z.infer<typeof ReceivableHealthRowSchema>;
export type CollectionPriorityItem = z.infer<typeof CollectionPriorityItemSchema>;
export type FinanceOverviewResponse = z.infer<typeof FinanceOverviewResponseSchema>;
export type PaymentPressureRadarResponse = z.infer<typeof PaymentPressureRadarResponseSchema>;
export type ReceivablesHealthResponse = z.infer<typeof ReceivablesHealthResponseSchema>;
export type PaymentBehaviorObservatoryResponse = z.infer<typeof PaymentBehaviorObservatoryResponseSchema>;
export type WalletLiquiditySurfaceResponse = z.infer<typeof WalletLiquiditySurfaceResponseSchema>;
export type CreditRiskMatrixResponse = z.infer<typeof CreditRiskMatrixResponseSchema>;
export type CashflowIntelligenceResponse = z.infer<typeof CashflowIntelligenceResponseSchema>;
export type PaymentAnomalyRadarResponse = z.infer<typeof PaymentAnomalyRadarResponseSchema>;
export type CollectionPrioritiesResponse = z.infer<typeof CollectionPrioritiesResponseSchema>;
export type FinanceCollectionsBriefingResponse = z.infer<typeof FinanceCollectionsBriefingResponseSchema>;
export type FinancialInterventionsResponse = z.infer<typeof FinancialInterventionsResponseSchema>;
export type FinanceCollectionsBundleResponse = z.infer<typeof FinanceCollectionsBundleResponseSchema>;
