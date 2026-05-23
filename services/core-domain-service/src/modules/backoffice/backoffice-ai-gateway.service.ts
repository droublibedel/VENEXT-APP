import { Injectable } from "@nestjs/common";
import type {
  CommercialBriefingResponse,
  ExecutiveBriefingResponse,
  MarketingActivationBriefingResponse,
  OrderAdvBriefingResponse,
  SupplyLogisticsBriefingResponse,
  FinanceCollectionsBriefingResponse,
  DataIntelligenceBriefingResponse,
  EconomicMemoryBriefing,
  EconomicScenarioBriefing,
} from "@venext/shared-contracts";
import { BackofficeAuditLogService } from "../backoffice-audit-log/backoffice-audit-log.service";

export type CommercialNetworkBriefingGenerationInput = {
  activeWholesalers: number;
  unstableWholesalers: number;
  inactiveRegions: string[];
  commercialConfidence: number;
  negotiationActivityLevel: number;
  acceptanceRate: number;
  dataSources: string[];
};

/** Instruction 13 — activation operator narrative (MockAIProvider, no LLM). */
export type MarketingActivationBriefingGenerationInput = {
  sponsorshipPressure: number;
  activationVelocity: number;
  dormantTerritories: string[];
  risingProductsSample: number;
  weakCampaigns: number;
  retailerEngagementPulse: number;
  seasonalIntensity: number;
  seasonalExplanation: string;
  seasonalAffectedTerritories: string[];
  dataSources: string[];
};

/** Instruction 14 — orders / ADV execution narrative (MockAIProvider, no LLM). */
export type OrderAdvBriefingGenerationInput = {
  activeOrders: number;
  delayedOrders: number;
  negotiationIntensity: number;
  deliveryTension: number;
  groupedBuyingActivity: number;
  reservationPressure: number;
  transactionConfidence: number;
  conversationalCommerceIntensity: number;
  negotiationsOpen: number;
  blockedDeliveries: number;
  dataSources: string[];
};

/** Instruction 15 — logistics command narrative (MockAIProvider, no LLM). */
/** Instruction 16 — finance / encaissements intelligence pole (MockAIProvider, no LLM). */
/** Instruction 17 — data / economic intelligence pole (MockAIProvider, no LLM). */
export type DataIntelligenceBriefingGenerationInput = {
  organizationId: string;
  generatedAt: string;
  propagationScore: number;
  correlationCount: number;
  anomalyCount: number;
  predictiveRiskMax: number;
  orgEconomicScore: number;
  liquidityStress: number;
  dataSources: string[];
};

export type FinanceCollectionsBriefingGenerationInput = {
  receivablesPressure: number;
  overduePressure: number;
  paymentReliability: number;
  creditExposure: number;
  financialInstability: number;
  walletLiquidityState: string;
  liquidityStressIndex: number;
  topPrioritySummary: string;
  dataSources: string[];
};

export type SupplyLogisticsBriefingGenerationInput = {
  activeShipments: number;
  delayedShipments: number;
  routeCongestionIndex: number;
  warehousePressureIndex: number;
  loadingDelayIndex: number;
  fulfillmentConfidence: number;
  territoryInstability: number;
  unstableTerritories: number;
  dataSources: string[];
};

export type ExecutiveBriefingGenerationInput = {
  pressureBand: string;
  pressureHeadline: string;
  impactedRegions: string[];
  impactedCategories: string[];
  anomalyThesis?: string;
  topRiskLine?: string;
  acceptedRelationshipCount: number;
  signalDensity7d: number;
  dataSources: string[];
};

export type AiGatewayGovernanceState = {
  activeProvider: "MockAIProvider" | "Qwen" | "Custom" | "OpenAI";
  mockLatencyMs: number;
  poleInsightGeneration: "ENABLED" | "DEGRADED" | "DISABLED";
  externalSignalProviders: string[];
  lastGeneratedInsightAt: string | null;
  confidenceAverage: number;
  failedInsightCalls: number;
};

@Injectable()
export class BackofficeAiGatewayService {
  private state: AiGatewayGovernanceState = {
    activeProvider: "MockAIProvider",
    mockLatencyMs: 120,
    poleInsightGeneration: "ENABLED",
    externalSignalProviders: ["weather_stub", "economic_signal_stub"],
    lastGeneratedInsightAt: new Date(Date.now() - 3600_000).toISOString(),
    confidenceAverage: 0.74,
    failedInsightCalls: 0,
  };

  constructor(private readonly audit: BackofficeAuditLogService) {}

  getSnapshot() {
    return {
      ...this.state,
      futureProviders: ["Qwen", "Custom", "OpenAI"],
      note: "No live LLM integration — governance telemetry only (Instruction 10).",
    };
  }

  async patch(actor: string, body: Partial<Pick<AiGatewayGovernanceState, "mockLatencyMs" | "poleInsightGeneration">>) {
    const before = { ...this.state };
    if (body.mockLatencyMs != null) {
      this.state.mockLatencyMs = Math.min(Math.max(body.mockLatencyMs, 0), 5000);
    }
    if (body.poleInsightGeneration != null) {
      this.state.poleInsightGeneration = body.poleInsightGeneration;
    }
    await this.audit.append({
      actor,
      action: "ai_gateway_governance_patch",
      target: "ai_gateway",
      before,
      after: { ...this.state },
    });
    return this.getSnapshot();
  }

  recordMockInsight(confidence: number) {
    this.state.lastGeneratedInsightAt = new Date().toISOString();
    this.state.confidenceAverage = Number(((this.state.confidenceAverage * 0.85 + confidence * 0.15).toFixed(3)));
  }

  recordFailure() {
    this.state.failedInsightCalls += 1;
  }

  /**
   * Mock executive briefing — same provider contract as pole governance telemetry (no LLM).
   * Instruction 11A — reuse gateway instead of ad-hoc templates in strategic services.
   */
  generateExecutiveStrategicBriefing(input: ExecutiveBriefingGenerationInput): ExecutiveBriefingResponse {
    const confidence = Number(
      Math.min(0.97, Math.max(0.38, this.state.confidenceAverage * 0.94 + (input.signalDensity7d > 12 ? 0.06 : 0))).toFixed(
        3,
      ),
    );
    this.recordMockInsight(confidence);

    const anomalies: string[] = [];
    if (input.anomalyThesis) anomalies.push(input.anomalyThesis);
    if (input.topRiskLine) anomalies.push(input.topRiskLine);
    if (anomalies.length === 0) {
      anomalies.push(
        `Signal density ${input.signalDensity7d} / 7d cross-checked against external overlays — weak signals remain explicitly labeled.`,
      );
    }

    const opportunities = [
      input.impactedRegions.length
        ? `Reinforce wholesale corridors feeding: ${input.impactedRegions.slice(0, 4).join(", ")}.`
        : "Territory mix stable — allocate exploratory capacity to adjacent communes.",
      ...input.impactedCategories.slice(0, 3).map((c) => `Category lens: ${c} — align sponsorship visibility without price comparison theater.`),
    ];

    const recommendedActions = [
      "Calibrate allocation before negotiation spikes convert to fulfillment failure.",
      "Verify sponsor identity integrity on active injection lanes.",
      `Maintain graph instrumentation — ${input.acceptedRelationshipCount} accepted edges anchor industrial confidence.`,
    ];

    const title = `Strategic posture — ${input.pressureBand} market pressure`;

    const sections: { title: string; body: string }[] = [
      { title: "Strategic state", body: `${title}. ${input.pressureHeadline}` },
      { title: "Anomalies / weak signals", body: anomalies.join(" ") },
      { title: "Opportunity posture", body: opportunities.join(" ") },
      { title: "Recommended cadence", body: recommendedActions.join(" ") },
    ];

    const dataSources = [
      ...input.dataSources,
      "mock_ai_gateway",
      `gateway.confidenceAverage:${this.state.confidenceAverage}`,
      `poleInsightGeneration:${this.state.poleInsightGeneration}`,
    ];

    return {
      provider: "MockAIProvider",
      policy: "ACTIVE",
      title,
      executiveSummary: input.pressureHeadline,
      anomalies,
      opportunities,
      recommendedActions,
      confidence: Number(confidence),
      dataSources,
      headline: input.pressureHeadline,
      sections,
      tone: "executive_operational",
      note: "Structured executive briefing via MockAIProvider gateway contract — no chatbot, no live LLM.",
    };
  }

  /** Instruction 12 — commercial / network pole narrative (MockAIProvider, no LLM). */
  generateCommercialNetworkBriefing(input: CommercialNetworkBriefingGenerationInput): CommercialBriefingResponse {
    const confidence = Number(
      Math.min(0.96, Math.max(0.4, input.commercialConfidence * 0.92 + input.negotiationActivityLevel * 0.06)).toFixed(3),
    );
    this.recordMockInsight(confidence);

    const anomalies: string[] = [];
    if (input.unstableWholesalers > 0) {
      anomalies.push(`${input.unstableWholesalers} wholesale edge(s) show trust compression — supervise before downstream rupture.`);
    }
    if (input.inactiveRegions.length) {
      anomalies.push(`Quiet territories: ${input.inactiveRegions.slice(0, 4).join(", ")} — field commerce resonance absent.`);
    }
    if (anomalies.length === 0) {
      anomalies.push("No acute commercial fractures detected in the current graph window — maintain observation cadence.");
    }

    const opportunities = [
      input.activeWholesalers > 0
        ? `Anchor ${input.activeWholesalers} healthy wholesale corridors for expansion bursts.`
        : "Seed selective wholesale invitations in under-covered adjacencies.",
      `Relationship acceptance ${(input.acceptanceRate * 100).toFixed(0)}% — calibrate invitation hygiene vs velocity.`,
    ];

    const recommendedActions = [
      "Prioritize distributor reinforcement where order cadence diverges from negotiation heat.",
      "Tune sponsored injection density so relationship-native lanes keep primacy.",
      "Trace QR vs contact-sync growth to validate authentic downstream expansion.",
    ];

    const title = "Commercial network posture — distribution ecosystem command";

    return {
      provider: "MockAIProvider",
      policy: "ACTIVE",
      title,
      executiveSummary: `Confidence ${input.commercialConfidence.toFixed(2)} across closed-graph commerce; negotiation pulse ${input.negotiationActivityLevel.toFixed(2)}.`,
      anomalies,
      opportunities,
      recommendedActions,
      confidence: Number(confidence),
      dataSources: [
        ...input.dataSources,
        "mock_ai_gateway",
        `gateway.confidenceAverage:${this.state.confidenceAverage}`,
      ],
      tone: "commercial_strategist",
      note: "Structured commercial briefing — operational strategist voice, not chatbot.",
    };
  }

  /** Instruction 13 — marketing / activation pole (field stimulation, not ads UI). */
  generateMarketingActivationBriefing(input: MarketingActivationBriefingGenerationInput): MarketingActivationBriefingResponse {
    const confidence = Number(
      Math.min(
        0.95,
        Math.max(0.42, input.activationVelocity * 0.35 + input.retailerEngagementPulse * 0.28 + (1 - input.sponsorshipPressure) * 0.12),
      ).toFixed(3),
    );
    this.recordMockInsight(Number(confidence));

    const anomalies: string[] = [];
    if (input.sponsorshipPressure > 0.72) {
      anomalies.push("Sponsorship lane density exceeds comfort band — overexposure risk on downstream trust.");
    }
    if (input.dormantTerritories.length) {
      anomalies.push(`Stimulation voids: ${input.dormantTerritories.slice(0, 4).join(", ")} — commerce excitation below corridor baseline.`);
    }
    if (input.weakCampaigns > 0) {
      anomalies.push(`${input.weakCampaigns} activation wave(s) show efficiency decay — supervise before momentum collapses.`);
    }
    if (input.seasonalIntensity > 0.5) {
      anomalies.push(
        `MOCK_CONTEXT seasonal / external pressure ${input.seasonalIntensity.toFixed(2)} on ${input.seasonalAffectedTerritories.slice(0, 3).join(", ") || "field"} — ${input.seasonalExplanation.slice(0, 140)}…`,
      );
    }
    if (anomalies.length === 0) {
      anomalies.push("Activation field coherent — maintain observatory cadence on sponsorship vs order co-movement.");
    }

    const opportunities = [
      input.risingProductsSample > 0
        ? `Reinforce ${input.risingProductsSample} rising SKU(s) with territory-native sponsorship depth, not broadcast noise.`
        : "Probe adjacent SKUs for latent momentum where negotiation heat precedes order lift.",
      "Align retailer stimulation clusters with weak-network overlays from commercial pole context.",
    ];

    const recommendedActions = [
      "Throttle sponsor concentration where retailer attraction skews single-corridor.",
      "Schedule dormant-zone field pulses tied to negotiation reopen cadence.",
      "Cross-check activation bursts against fulfillment chokepoints (orders pole).",
    ];

    return {
      provider: "MockAIProvider",
      policy: "ACTIVE",
      title: "Activation posture — market stimulation command",
      executiveSummary: `Velocity ${input.activationVelocity.toFixed(2)} · sponsorship pressure ${input.sponsorshipPressure.toFixed(2)} · retailer pulse ${input.retailerEngagementPulse.toFixed(2)} · MOCK_CONTEXT seasonal ${input.seasonalIntensity.toFixed(2)}.`,
      anomalies,
      opportunities,
      recommendedActions,
      confidence: Number(confidence),
      dataSources: [
        ...input.dataSources,
        "mock_ai_gateway",
        `gateway.confidenceAverage:${this.state.confidenceAverage}`,
      ],
      tone: "activation_operator",
      note: "Structured activation briefing — strategic marketer / operator voice, not chatbot.",
    };
  }

  generateOrderAdvBriefing(input: OrderAdvBriefingGenerationInput): OrderAdvBriefingResponse {
    const confidence = Number(
      Math.min(
        0.94,
        Math.max(
          0.4,
          input.transactionConfidence * 0.32 +
            (1 - input.negotiationIntensity) * 0.12 +
            (1 - input.deliveryTension) * 0.18 +
            input.conversationalCommerceIntensity * 0.14,
        ),
      ).toFixed(3),
    );
    this.recordMockInsight(Number(confidence));

    const anomalies: string[] = [];
    if (input.delayedOrders > 3) {
      anomalies.push(`${input.delayedOrders} orders exceed ADV / fulfillment cadence — downstream trust compression risk.`);
    }
    if (input.negotiationIntensity > 0.55) {
      anomalies.push(`Negotiation field dense (${input.negotiationsOpen} open/proposed signals) — conversion discipline required.`);
    }
    if (input.blockedDeliveries > 0) {
      anomalies.push(`${input.blockedDeliveries} blocked delivery lane(s) — commercial fulfillment instability.`);
    }
    if (input.groupedBuyingActivity > 0.5) {
      anomalies.push("Grouped-buying surge — supervise threshold fill vs expiry asymmetry.");
    }
    if (input.reservationPressure > 0.48) {
      anomalies.push("Reservation / draft mass elevated — allocation conflicts may precede stock tension.");
    }
    if (anomalies.length === 0) {
      anomalies.push("Execution posture stable — maintain conversational commerce anchors on high-trust threads.");
    }

    const recommendedActions = [
      "Sequence ADV confirmations ahead of delivery commits on high-tension corridors.",
      "Pair negotiation bursts with thread-native product context to avoid sterile counter-offer loops.",
      "Rebalance group-buy participation where velocityHint trends stalled near expiry.",
    ];

    return {
      provider: "MockAIProvider",
      policy: "ACTIVE",
      title: "Orders / ADV — execution supervision command",
      executiveSummary: `Active ${input.activeOrders} · delayed ${input.delayedOrders} · negotiation intensity ${input.negotiationIntensity.toFixed(2)} · delivery tension ${input.deliveryTension.toFixed(2)} · conversational commerce ${input.conversationalCommerceIntensity.toFixed(2)}.`,
      anomalies,
      recommendedActions,
      dataSources: [...input.dataSources, "mock_ai_gateway", `gateway.confidenceAverage:${this.state.confidenceAverage}`],
      tone: "execution_strategist",
      note: "Structured execution briefing — operational strategist voice, not chatbot.",
    };
  }

  generateSupplyLogisticsBriefing(input: SupplyLogisticsBriefingGenerationInput): SupplyLogisticsBriefingResponse {
    const confidence = Number(
      Math.min(
        0.93,
        Math.max(
          0.41,
          input.fulfillmentConfidence * 0.38 +
            (1 - input.routeCongestionIndex) * 0.18 +
            (1 - input.territoryInstability) * 0.14 +
            (1 - input.warehousePressureIndex) * 0.12,
        ),
      ).toFixed(3),
    );
    this.recordMockInsight(Number(confidence));

    const anomalies: string[] = [];
    if (input.delayedShipments > 4) {
      anomalies.push(`${input.delayedShipments} active executions exceed movement cadence — downstream continuity risk.`);
    }
    if (input.routeCongestionIndex > 0.52) {
      anomalies.push("Corridor compression — route execution confidence degrading vs shipment mass.");
    }
    if (input.warehousePressureIndex > 0.5) {
      anomalies.push("Hub saturation — dispatch queue and inventory tension coupling.");
    }
    if (input.loadingDelayIndex > 0.45) {
      anomalies.push("Loading / dock dwell elevated — prep-to-motion gap widening.");
    }
    if (input.unstableTerritories > 2) {
      anomalies.push(`${input.unstableTerritories} territories show instability gradients — reinforce weak supply lanes.`);
    }
    if (anomalies.length === 0) {
      anomalies.push("Movement field within tactical envelope — maintain corridor telemetry readiness for edge sync.");
    }

    const recommendedActions = [
      "Sequence hub dispatch before corridor commits on high-tension territories.",
      "Pair delay radar hotspots with route intelligence — avoid single-corridor dependence.",
      "Stage offline route cache schema for intermittent connectivity (edge foundation).",
    ];

    return {
      provider: "MockAIProvider",
      policy: "ACTIVE",
      title: "Supply / logistics — movement command",
      executiveSummary: `Active ${input.activeShipments} · delayed ${input.delayedShipments} · corridor ${input.routeCongestionIndex.toFixed(2)} · hub ${input.warehousePressureIndex.toFixed(2)} · fulfillment ${input.fulfillmentConfidence.toFixed(2)}.`,
      anomalies,
      recommendedActions,
      dataSources: [...input.dataSources, "mock_ai_gateway", `gateway.confidenceAverage:${this.state.confidenceAverage}`],
      tone: "logistics_command",
      note: "Structured logistics briefing — tactical operator voice, not chatbot.",
    };
  }

  generateDataIntelligenceBriefing(input: DataIntelligenceBriefingGenerationInput): DataIntelligenceBriefingResponse {
    const confidence = Number(
      Math.min(
        0.94,
        Math.max(
          0.44,
          input.orgEconomicScore * 0.28 +
            (1 - input.liquidityStress) * 0.22 +
            (1 - input.propagationScore) * 0.18 +
            (input.correlationCount > 0 ? 0.12 : 0.04) +
            (input.anomalyCount > 0 ? 0.08 : 0.06),
        ),
      ).toFixed(3),
    );
    this.recordMockInsight(Number(confidence));

    const weakSignals: string[] = [];
    if (input.correlationCount < 2) {
      weakSignals.push("Cross-pole correlation density is thin — systemic coupling may be under-sampled.");
    }
    if (input.predictiveRiskMax < 0.35) {
      weakSignals.push("Predictive risk envelope is quiet — escalation radar may need wider signal ingestion.");
    }

    const systemicTensions: string[] = [];
    if (input.propagationScore > 0.45) {
      systemicTensions.push(`Economic propagation score ${input.propagationScore.toFixed(2)} — order/supply/finance move as one field.`);
    }
    if (input.liquidityStress > 0.5) {
      systemicTensions.push(`Liquidity stress ${input.liquidityStress.toFixed(2)} couples receivable discipline with ADV throughput.`);
    }

    const futureRisks: string[] = [];
    if (input.predictiveRiskMax > 0.45) {
      futureRisks.push("Payment or negotiation collapse tail risk within the predictive horizon — sequence proof before corridor expansion.");
    }
    futureRisks.push("Territory destabilization if activation spend rises while logistics remains non-terminal.");

    const hiddenOpportunities: string[] = [
      "Dense commercial graph with moderate propagation — selective territory reinforcement yields asymmetric trust yield.",
    ];

    const criticalAnomalies =
      input.anomalyCount > 0
        ? [`${input.anomalyCount} systemic anomalies flagged — isolate before they anchor into finance/supply coupling.`]
        : ["No acute anomaly cluster — maintain cross-pole observatory cadence."];

    const economicDependencies = [
      "ADV ↔ finance settlement discipline",
      "Supply motion ↔ territory congestion naming",
      "Commercial trust ↔ unpaid geography",
    ];

    return {
      provider: "MockAIProvider",
      providerMode: "MOCK_PROVIDER",
      realLLMConnected: false,
      mockContextUsed: true,
      policy: "ACTIVE",
      title: "Data intelligence — economic operating system narrative",
      executiveSummary: `Org ${input.organizationId.slice(0, 8)}… — propagation ${input.propagationScore.toFixed(2)}, correlations ${input.correlationCount}, anomalies ${input.anomalyCount}, predictive peak ${input.predictiveRiskMax.toFixed(2)}, economic score ${input.orgEconomicScore.toFixed(2)}.`,
      weakSignals,
      systemicTensions,
      futureRisks,
      hiddenOpportunities,
      criticalAnomalies,
      economicDependencies,
      confidence: Number(confidence),
      dataSources: [...input.dataSources, "mock_ai_gateway", `gateway.confidenceAverage:${this.state.confidenceAverage}`],
      tone: "economic_superintelligence",
      note: "Structured economic superintelligence briefing — systemic interpretation, not chatbot.",
    };
  }

  generateFinanceCollectionsBriefing(input: FinanceCollectionsBriefingGenerationInput): FinanceCollectionsBriefingResponse {
    const confidence = Number(
      Math.min(
        0.92,
        Math.max(
          0.42,
          input.paymentReliability * 0.34 +
            (1 - input.receivablesPressure) * 0.18 +
            (1 - input.creditExposure) * 0.16 +
            (1 - input.financialInstability) * 0.22,
        ),
      ).toFixed(3),
    );
    this.recordMockInsight(Number(confidence));

    const liquidityNote = `Liquidity state ${input.walletLiquidityState} — wallet stress index ${input.liquidityStressIndex.toFixed(2)}. Provider rails must stay explicitly labeled; do not infer bank settlement from UI alone.`;
    const receivablesNote = `Receivable pressure ${input.receivablesPressure.toFixed(2)} · overdue field ${input.overduePressure.toFixed(2)} — prioritize milestone settlements before corridor expansion.`;
    const paymentInstabilityNote = `Payment reliability ${input.paymentReliability.toFixed(2)} — discipline degradation maps to trust compression, not accounting variance.`;
    const creditExposureNote = `Credit exposure ${input.creditExposure.toFixed(2)} — downstream solvency supervision precedes incremental open terms.`;

    const recommendedCollectionMoves = [
      input.topPrioritySummary,
      "Sequence proof-of-pay on electronic lanes before dispatch commits on stressed territories.",
      "Pair negotiation payment proposals with actual order paymentStatus to detect mismatch early.",
    ];

    return {
      provider: "MockAIProvider",
      policy: "ACTIVE",
      title: "Finance / encaissements — network treasury command",
      executiveSummary: `Instability field ${input.financialInstability.toFixed(2)} with receivable pressure ${input.receivablesPressure.toFixed(2)} — supervise encaissement rhythm as economic intelligence, not ledger theater.`,
      liquidityNote,
      receivablesNote,
      paymentInstabilityNote,
      creditExposureNote,
      recommendedCollectionMoves,
      confidence: Number(confidence),
      dataSources: [...input.dataSources, "mock_ai_gateway", `gateway.confidenceAverage:${this.state.confidenceAverage}`],
      tone: "finance_strategist",
      note: "Structured finance briefing — sober strategist voice, not chatbot.",
    };
  }

  /** Instruction 18.2 — economic memory narrative (MockAIProvider; cites stored memory only via input fields). */
  generateEconomicMemoryBriefing(input: {
    organizationId: string;
    shockTypesSample: string[];
    signatureCodes: string[];
    topPatternTypes: string[];
    trendDirection: string;
    volatilityLevel: string;
    eventDepth30d: number;
    similarEventScore: number;
    historicalConfidence: number;
    dataSources: string[];
  }): EconomicMemoryBriefing {
    const confidence = Number(
      Math.min(0.9, Math.max(0.38, input.historicalConfidence * 0.55 + (input.eventDepth30d > 0 ? 0.18 : 0.05) + input.similarEventScore * 0.22)).toFixed(3),
    );
    this.recordMockInsight(Number(confidence));
    const sigLine =
      input.signatureCodes.length > 0
        ? `Active crisis-signature codes: ${input.signatureCodes.slice(0, 6).join(", ")} — analytic labels, not clinical diagnoses.`
        : "No crisis signatures above threshold on this slice — memory may still be sparse.";
    return {
      provider: "MockAIProvider",
      providerMode: "MOCK_PROVIDER",
      realLLMConnected: false,
      mockContextUsed: true,
      policy: "ACTIVE",
      title: "Industrial economic memory — recurrence & propagation posture",
      executiveSummary: `Org ${input.organizationId.slice(0, 8)}… — ${input.eventDepth30d} memory events (30d window ref.), trend ${input.trendDirection}, volatility ${input.volatilityLevel}. Similarity score ${input.similarEventScore.toFixed(2)} is heuristic vs stored propagation shapes only.`,
      recurrenceHighlights: [
        input.topPatternTypes.length
          ? `Top recurring shock families: ${input.topPatternTypes.slice(0, 5).join(", ")}.`
          : "Recurrence density still building — compare after more propagation bundles are persisted.",
      ],
      signatureHighlights: [sigLine],
      patternHighlights: [
        input.shockTypesSample.length
          ? `Latest bundle shock sample: ${input.shockTypesSample.slice(0, 6).join(", ")}.`
          : "No shock sample attached — briefing is intentionally conservative.",
      ],
      trendHighlights: [
        `Trend vector ${input.trendDirection} with volatility band ${input.volatilityLevel} — derived from temporal snapshot heuristics, not econometric ARIMA.`,
      ],
      confidence: Number(confidence),
      analyticalLimits: [
        "Memory rows originate from Instruction 18.1 propagation snapshots only — no synthetic history invented server-side.",
        "Symbolic map overlays remain non-GIS per Instruction 18.1A.",
        "Crisis signatures are supervisory analytics — not absolute financial or legal diagnoses.",
      ],
      dataSources: [...input.dataSources, "mock_ai_gateway", `gateway.confidenceAverage:${this.state.confidenceAverage}`],
      tone: "industrial_economic_memory",
      note: "Structured industrial memory briefing — explicit mock provider; no LLM chain.",
    };
  }

  /** Instruction 18.3 — economic scenario narrative (MockAIProvider; contrasts projections vs memory). */
  generateEconomicScenarioBriefing(input: {
    organizationId: string;
    scenarioTypesSample: string[];
    maxProjectedRisk: number;
    comparisonCount: number;
    memorySparse: boolean;
    dataSources: string[];
  }): EconomicScenarioBriefing {
    const confidence = Number(
      Math.min(0.9, Math.max(0.4, 0.45 + input.maxProjectedRisk * 0.28 + (input.memorySparse ? 0.04 : 0.1))).toFixed(3),
    );
    this.recordMockInsight(Number(confidence));
    return {
      provider: "MockAIProvider",
      providerMode: "MOCK_PROVIDER",
      realLLMConnected: false,
      mockContextUsed: true,
      policy: "ACTIVE",
      title: "Industrial economic scenarios — contrast & limits",
      executiveSummary: `Org ${input.organizationId.slice(0, 8)}… — ${input.scenarioTypesSample.length} scenario archetype(s) evaluated; max projected risk (heuristic) ${input.maxProjectedRisk.toFixed(2)}. Comparisons: ${input.comparisonCount} pair(s) on symbolic lattice only.`,
      scenarioContrast: [
        input.scenarioTypesSample.length
          ? `Sample types: ${input.scenarioTypesSample.join(", ")} — each is a deterministic branch from propagation + memory context.`
          : "No scenario slice attached — briefing withheld.",
      ],
      riskHighlights: [
        `Peak projected risk ${input.maxProjectedRisk.toFixed(2)} is a transparent heuristic axis — not a market-implied probability.`,
      ],
      memoryHighlights: [
        input.memorySparse
          ? "Sparse persisted memory — scenario-memory linkage will be conservative until more 18.1 snapshots are stored."
          : "Memory-linked patterns available — similarity still non-causal.",
      ],
      limits: [
        "Projections are synthetic multi-pole stress tests — not ERP decisions, not bankable forecasts.",
        "Map overlays remain symbolic — non-GIS per industrial pole rules.",
        "Distinguish: stored memory (18.2) vs forward projection (18.3) vs propagation snapshot (18.1).",
      ],
      confidence: Number(confidence),
      dataSources: [...input.dataSources, "mock_ai_gateway", `gateway.confidenceAverage:${this.state.confidenceAverage}`],
      tone: "industrial_economic_scenarios",
      note: "Structured scenario briefing — explicit mock provider; no LLM chain.",
    };
  }
}
