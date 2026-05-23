import { Injectable } from "@nestjs/common";
import type {
  AnomalyIntelligenceResponse,
  CrossPoleCorrelationResponse,
  DataIntelligenceBriefingResponse,
  EconomicOntologyResponse,
  EconomicScoreResponse,
  PredictiveSignalsResponse,
} from "@venext/shared-contracts";
import { BackofficeAiGatewayService } from "../backoffice/backoffice-ai-gateway.service";

@Injectable()
export class DataIntelligenceBriefingService {
  constructor(private readonly ai: BackofficeAiGatewayService) {}

  briefing(
    organizationId: string,
    generatedAt: string,
    ontology: EconomicOntologyResponse,
    correlations: CrossPoleCorrelationResponse,
    anomalies: AnomalyIntelligenceResponse,
    predictive: PredictiveSignalsResponse,
    scores: EconomicScoreResponse,
  ): DataIntelligenceBriefingResponse {
    return this.ai.generateDataIntelligenceBriefing({
      organizationId,
      generatedAt,
      propagationScore: ontology.economicPropagationScore,
      correlationCount: correlations.rows.length,
      anomalyCount: anomalies.anomalies.length,
      predictiveRiskMax: predictive.signals.reduce((m, x) => Math.max(m, x.riskLevel), 0),
      orgEconomicScore: scores.organizationEconomicScore.score,
      liquidityStress: scores.liquidityStressScore.score,
      dataSources: [
        "cross_pole_snapshot",
        "economic_ontology",
        "anomaly_intelligence",
        "predictive_signals_engine",
        "economic_score_engine",
      ],
    });
  }
}
