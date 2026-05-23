import { Injectable } from "@nestjs/common";
import type {
  CampaignIntelligenceResponse,
  MarketingActivationBriefingResponse,
  MarketingActivationOverviewResponse,
  ProductMomentumObservatoryResponse,
  SponsorshipPressureObservatoryResponse,
  TerritoryActivationRadarResponse,
} from "@venext/shared-contracts";
import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { BackofficeAiGatewayService } from "../backoffice/backoffice-ai-gateway.service";
import type { CommercialNetworkContext } from "../commercial-network-intelligence/commercial-network-context.service";

@Injectable()
export class MarketingActivationBriefingService {
  constructor(
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly gateway: BackofficeAiGatewayService,
  ) {}

  async briefing(
    organizationId: string,
    ctx: CommercialNetworkContext,
    pack: {
      overview: MarketingActivationOverviewResponse;
      sponsorship: SponsorshipPressureObservatoryResponse;
      territory: TerritoryActivationRadarResponse;
      productMomentum: ProductMomentumObservatoryResponse;
      campaigns: CampaignIntelligenceResponse;
    },
  ): Promise<MarketingActivationBriefingResponse> {
    const aiOn = await this.flags.isEnabled("marketing_activation_ai_enabled", { organizationId });
    if (!aiOn) {
      return {
        provider: "MockAIProvider",
        policy: "DISABLED",
        executiveSummary: "marketing_activation_ai_enabled gates the activation pole mock narrative (Instruction 13).",
        dataSources: ["feature_flag:marketing_activation_ai_enabled"],
        note: "Non-chatbot policy surface — enable marketing_activation_ai_enabled for structured mock output.",
      };
    }

    const pressure =
      pack.sponsorship.policy === "ACTIVE" ? (pack.sponsorship.overexposureIndex ?? pack.sponsorship.territorySaturation ?? 0.4) : 0.38;
    const weakCampaigns = pack.campaigns.campaigns.filter((c) => c.status === "weak" || c.status === "declining").length;
    const risingProductsSample = pack.productMomentum.rows.filter((r) => r.state === "rising" || r.state === "spike").length;

    const sp = pack.overview.seasonalPressure;
    return this.gateway.generateMarketingActivationBriefing({
      sponsorshipPressure: pressure,
      activationVelocity: pack.overview.activationVelocity,
      dormantTerritories: pack.territory.dormantRegions,
      risingProductsSample,
      weakCampaigns,
      retailerEngagementPulse: pack.overview.retailerEngagementLevel,
      seasonalIntensity: sp?.intensity ?? 0,
      seasonalExplanation: sp?.explanation ?? "",
      seasonalAffectedTerritories: sp?.affectedTerritories ?? [],
      dataSources: [
        "marketing_activation_overview",
        "sponsorship_pressure_observatory",
        "territory_activation_radar",
        "product_momentum",
        "campaign_abstraction_v1",
        "MOCK_CONTEXT:seasonalPressure",
      ],
    });
  }
}
