import { Injectable } from "@nestjs/common";
import type { DataIntelligenceBundleResponse, DataIntelligenceOverviewResponse } from "@venext/shared-contracts";
import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { AnomalyIntelligenceService } from "./anomaly-intelligence/anomaly-intelligence.service";
import { CrossPoleCorrelationService } from "./cross-pole-correlation/cross-pole-correlation.service";
import { DataIntelligenceBriefingService } from "./data-intelligence-briefing.service";
import { DataIntelligenceDataService } from "./data-intelligence-data.service";
import { DataIntelligenceRealtimePublishService } from "./data-intelligence-realtime-publish.service";
import { DataQualityIntelligenceService } from "./data-quality-intelligence/data-quality-intelligence.service";
import { DecisionSimulationService } from "./decision-simulation/decision-simulation.service";
import { EconomicOntologyService } from "./economic-ontology/economic-ontology.service";
import { EconomicScoreService } from "./economic-score/economic-score.service";
import { GraphIntelligenceService } from "./graph-intelligence/graph-intelligence.service";
import { IntelligenceInterventionsService } from "./intelligence-interventions/intelligence-interventions.service";
import { PredictiveSignalsService } from "./predictive-signals/predictive-signals.service";
import { TerritoryIntelligenceService } from "./territory-intelligence/territory-intelligence.service";

@Injectable()
export class DataIntelligenceBundleService {
  private readonly composePackCache = new Map<string, { at: number; pack: DataIntelligenceBundleResponse }>();
  private readonly composePackTtlMs = 4200;

  constructor(
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly data: DataIntelligenceDataService,
    private readonly ontologySvc: EconomicOntologyService,
    private readonly correlationSvc: CrossPoleCorrelationService,
    private readonly anomalySvc: AnomalyIntelligenceService,
    private readonly predictiveSvc: PredictiveSignalsService,
    private readonly territorySvc: TerritoryIntelligenceService,
    private readonly graphSvc: GraphIntelligenceService,
    private readonly simulationSvc: DecisionSimulationService,
    private readonly scoreSvc: EconomicScoreService,
    private readonly qualitySvc: DataQualityIntelligenceService,
    private readonly briefingSvc: DataIntelligenceBriefingService,
    private readonly interventionsSvc: IntelligenceInterventionsService,
    private readonly realtimePublish: DataIntelligenceRealtimePublishService,
  ) {}

  private async gates(organizationId: string) {
    const poleOn = await this.flags.isEnabled("data_intelligence_enabled", { organizationId });
    const predictiveOn = poleOn && (await this.flags.isEnabled("predictive_signals_enabled", { organizationId }));
    const graphOn = poleOn && (await this.flags.isEnabled("graph_intelligence_enabled", { organizationId }));
    const simOn = poleOn && (await this.flags.isEnabled("decision_simulation_enabled", { organizationId }));
    const aiOn = poleOn && (await this.flags.isEnabled("data_intelligence_ai_enabled", { organizationId }));
    return { poleOn, predictiveOn, graphOn, simOn, aiOn };
  }

  private buildOverview(
    s: Awaited<ReturnType<DataIntelligenceDataService["loadCrossCut"]>>,
    g: { poleOn: boolean; predictiveOn: boolean; graphOn: boolean; simOn: boolean; aiOn: boolean },
    ontology: ReturnType<EconomicOntologyService["build"]>,
    correlations: ReturnType<CrossPoleCorrelationService["build"]>,
    anomalies: ReturnType<AnomalyIntelligenceService["build"]>,
    predictive: ReturnType<PredictiveSignalsService["build"]>,
    quality: ReturnType<DataQualityIntelligenceService["build"]>,
  ): DataIntelligenceOverviewResponse {
    const policy = g.poleOn ? ("ACTIVE" as const) : ("DISABLED" as const);
    const predictiveHigh = predictive.signals.reduce((m, x) => Math.max(m, x.riskLevel), 0);
    return {
      version: "1",
      generatedAt: s.generatedAt,
      organizationId: s.organizationId,
      policy,
      economicPropagationScore: ontology.economicPropagationScore,
      activeCorrelations: correlations.rows.length,
      openAnomalies: anomalies.anomalies.length,
      predictiveHighRisk: predictiveHigh,
      dataQualityGuardianReadiness: quality.guardianReadiness,
      headline:
        policy === "DISABLED"
          ? "Data intelligence pole disabled."
          : `Propagation ${ontology.economicPropagationScore.toFixed(2)} · ${correlations.rows.length} correlations · ${anomalies.anomalies.length} anomalies`,
    };
  }

  private withDiagnostics(pack: DataIntelligenceBundleResponse, composeCacheHit: boolean): DataIntelligenceBundleResponse {
    return {
      ...pack,
      overview: {
        ...pack.overview,
        diagnostics: { composeCache: "SHORT_TTL_COMPOSE_CACHE", composeCacheHit },
      },
    };
  }

  /** Full pack without realtime fan-out (used by granular HTTP routes + bundle). */
  async compose(organizationId: string): Promise<DataIntelligenceBundleResponse> {
    const now = Date.now();
    const cached = this.composePackCache.get(organizationId);
    if (cached && now - cached.at < this.composePackTtlMs) {
      return this.withDiagnostics(cached.pack, true);
    }

    const g = await this.gates(organizationId);
    const s = await this.data.loadCrossCut(organizationId);

    const ontology = this.ontologySvc.build(s, g.poleOn);
    const correlations = this.correlationSvc.build(s, g.poleOn);
    const anomalies = this.anomalySvc.build(s, g.poleOn);
    const predictive = this.predictiveSvc.build(s, g.poleOn, g.predictiveOn);
    const territoryIntelligence = this.territorySvc.build(s, g.poleOn);
    const graphIntelligence = this.graphSvc.build(s, g.poleOn, g.graphOn);
    const decisionSimulation = this.simulationSvc.build(s, g.poleOn, g.simOn);
    const economicScore = this.scoreSvc.build(s, g.poleOn);
    const dataQuality = this.qualitySvc.build(s, g.poleOn);
    const overview = this.buildOverview(s, g, ontology, correlations, anomalies, predictive, dataQuality);

    const briefing =
      g.poleOn && g.aiOn
        ? this.briefingSvc.briefing(organizationId, s.generatedAt, ontology, correlations, anomalies, predictive, economicScore)
        : {
            provider: "MockAIProvider" as const,
            providerMode: "DISABLED" as const,
            realLLMConnected: false,
            mockContextUsed: true,
            policy: "DISABLED" as const,
            title: "Data intelligence — briefing gated",
            executiveSummary: g.poleOn ? "MockAI narrative disabled by data_intelligence_ai_enabled flag." : "Pole disabled.",
            weakSignals: [],
            systemicTensions: [],
            futureRisks: [],
            hiddenOpportunities: [],
            criticalAnomalies: [],
            economicDependencies: [],
            confidence: 0,
            dataSources: [],
            tone: "economic_superintelligence" as const,
            note: g.poleOn ? "data_intelligence_ai_enabled off" : "data_intelligence_enabled off",
          };

    const interventions = this.interventionsSvc.synthesize(s, g.poleOn);

    const inner: DataIntelligenceBundleResponse = {
      version: "1",
      generatedAt: s.generatedAt,
      organizationId,
      overview,
      ontology,
      correlations,
      anomalies,
      predictiveSignals: predictive,
      territoryIntelligence,
      graphIntelligence,
      decisionSimulation,
      economicScore,
      dataQuality,
      briefing,
      interventions,
    };
    this.composePackCache.set(organizationId, { at: now, pack: inner });
    return this.withDiagnostics(inner, false);
  }

  async bundle(organizationId: string): Promise<DataIntelligenceBundleResponse> {
    const packed = await this.compose(organizationId);
    void this.realtimePublish.publishDomainAnalysis(organizationId, packed);
    return packed;
  }
}
