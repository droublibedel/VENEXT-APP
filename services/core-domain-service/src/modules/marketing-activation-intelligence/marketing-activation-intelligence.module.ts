import { Module } from "@nestjs/common";
import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { BackofficeModule } from "../backoffice/backoffice.module";
import { CommercialNetworkIntelligenceModule } from "../commercial-network-intelligence/commercial-network-intelligence.module";
import { RelationalCommerceModule } from "../relational-commerce/relational-commerce.module";
import { ActivationInterventionsService } from "../activation-interventions/activation-interventions.service";
import { CampaignIntelligenceService } from "../campaign-intelligence/campaign-intelligence.service";
import { ProductMomentumService } from "../product-momentum/product-momentum.service";
import { RetailerEngagementService } from "../retailer-engagement/retailer-engagement.service";
import { SponsorshipPressureService } from "../sponsorship-pressure/sponsorship-pressure.service";
import { TerritoryActivationRadarService } from "../territory-activation-radar/territory-activation-radar.service";
import { ActivationOpportunityMapService } from "./activation-opportunity-map.service";
import { MarketingActivationBriefingService } from "./marketing-activation-briefing.service";
import { MarketingActivationBundleService } from "./marketing-activation-bundle.service";
import { MarketingActivationController } from "./marketing-activation.controller";
import { MarketingActivationOverviewService } from "./marketing-activation-overview.service";
import { MarketingExternalSignalAdapter } from "./marketing-external-signal.adapter";
import { ActivationCampaignProvider } from "../campaign-intelligence/activation-campaign.provider";

@Module({
  imports: [
    PrismaModule,
    FeatureFlagsModule,
    PlatformAuthzModule,
    RelationalCommerceModule,
    BackofficeModule,
    CommercialNetworkIntelligenceModule,
  ],
  controllers: [MarketingActivationController],
  providers: [
    MarketingExternalSignalAdapter,
    ActivationCampaignProvider,
    SponsorshipPressureService,
    TerritoryActivationRadarService,
    ProductMomentumService,
    RetailerEngagementService,
    CampaignIntelligenceService,
    ActivationInterventionsService,
    MarketingActivationOverviewService,
    ActivationOpportunityMapService,
    MarketingActivationBriefingService,
    MarketingActivationBundleService,
  ],
  exports: [
    MarketingActivationOverviewService,
    MarketingExternalSignalAdapter,
    SponsorshipPressureService,
    MarketingActivationBundleService,
  ],
})
export class MarketingActivationIntelligenceModule {}
