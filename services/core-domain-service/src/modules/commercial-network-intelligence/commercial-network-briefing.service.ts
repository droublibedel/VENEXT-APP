import { Injectable } from "@nestjs/common";
import type { CommercialBriefingResponse } from "@venext/shared-contracts";
import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { BackofficeAiGatewayService } from "../backoffice/backoffice-ai-gateway.service";
import { CommercialNetworkContext } from "./commercial-network-context.service";
import { CommercialNetworkOverviewService } from "./commercial-network-overview.service";

@Injectable()
export class CommercialNetworkBriefingService {
  constructor(
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly gateway: BackofficeAiGatewayService,
    private readonly overview: CommercialNetworkOverviewService,
  ) {}

  async briefing(organizationId: string, ctx: CommercialNetworkContext): Promise<CommercialBriefingResponse> {
    const aiOn = await this.flags.isEnabled("commercial_network_ai_enabled", { organizationId });
    if (!aiOn) {
      return {
        provider: "MockAIProvider",
        policy: "DISABLED",
        title: "Commercial AI briefing disabled",
        executiveSummary: "commercial_network_ai_enabled gates the commercial pole mock narrative (Instruction 12A).",
        anomalies: [],
        opportunities: [],
        recommendedActions: [],
        confidence: 0,
        dataSources: ["feature_flag:commercial_network_ai_enabled"],
        tone: "commercial_strategist",
        note: "Non-chatbot policy surface — enable commercial_network_ai_enabled for structured mock output.",
      };
    }

    const snap = this.overview.fromContext(ctx);
    return this.gateway.generateCommercialNetworkBriefing({
      activeWholesalers: snap.activeWholesalers,
      unstableWholesalers: snap.unstableWholesalers,
      inactiveRegions: snap.inactiveRegions,
      commercialConfidence: snap.commercialConfidence,
      negotiationActivityLevel: snap.negotiationActivityLevel,
      acceptanceRate: snap.relationshipAcceptanceRate,
      dataSources: [
        "commercial_network_context",
        "RelationalCommerceNetworkTraverserService.partnersPack (Instruction 19.1A — traverser; official bundle = CommercialRelationshipGraphEngineService)",
        "order_flow_30d",
        "negotiation_window",
      ],
    });
  }
}
