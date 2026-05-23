import { Module } from "@nestjs/common";
import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { BackofficeModule } from "../backoffice/backoffice.module";
import { DistributorObservatoryModule } from "../distributor-observatory/distributor-observatory.module";
import { NetworkInterventionsModule } from "../network-interventions/network-interventions.module";
import { RelationshipStabilityModule } from "../relationship-stability/relationship-stability.module";
import { RetailerRadarModule } from "../retailer-radar/retailer-radar.module";
import { RelationalCommerceModule } from "../relational-commerce/relational-commerce.module";
import { SponsorshipObservatoryModule } from "../sponsorship-observatory/sponsorship-observatory.module";
import { CommercialNetworkBriefingService } from "./commercial-network-briefing.service";
import { CommercialNetworkBundleService } from "./commercial-network-bundle.service";
import { CommercialNetworkController } from "./commercial-network.controller";
import { CommercialNetworkContextService } from "./commercial-network-context.service";
import { CommercialExpansionMapService } from "./commercial-expansion-map.service";
import { CommercialNetworkOverviewService } from "./commercial-network-overview.service";
import { CommercialNetworkRelationshipsService } from "./commercial-network-relationships.service";

@Module({
  imports: [
    PrismaModule,
    FeatureFlagsModule,
    PlatformAuthzModule,
    RelationalCommerceModule,
    BackofficeModule,
    DistributorObservatoryModule,
    RetailerRadarModule,
    RelationshipStabilityModule,
    SponsorshipObservatoryModule,
    NetworkInterventionsModule,
  ],
  controllers: [CommercialNetworkController],
  providers: [
    CommercialNetworkContextService,
    CommercialNetworkOverviewService,
    CommercialNetworkRelationshipsService,
    CommercialExpansionMapService,
    CommercialNetworkBriefingService,
    CommercialNetworkBundleService,
  ],
  exports: [CommercialNetworkContextService],
})
export class CommercialNetworkIntelligenceModule {}
