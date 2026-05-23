import { forwardRef, Module } from "@nestjs/common";
import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { RelationshipModule } from "../../graph/relationship/relationship.module";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { ProductCommerceModule } from "../product-commerce/product-commerce.module";
import { CommercialIdentityService } from "./commercial-identity.service";
import { RelationalCommerceNetworkTraverserService } from "./relational-commerce-network-traverser.service";
import { ContactGraphAnalyzerService } from "./contact-graph-analyzer.service";
import { RelationalCatalogEngineService } from "./relational-catalog-engine.service";
import { RelationalCommerceController } from "./relational-commerce.controller";
import { RelationalFlagsService } from "./relational-flags.service";
import { RelationshipSuggestionEngineService } from "./relationship-suggestion-engine.service";
import { SponsoredInjectionEngineService } from "./sponsored-injection-engine.service";
import { WholesalerDualCatalogService } from "./wholesaler-dual-catalog.service";

@Module({
  imports: [
    PrismaModule,
    RelationshipModule,
    PlatformAuthzModule,
    FeatureFlagsModule,
    forwardRef(() => ProductCommerceModule),
  ],
  controllers: [RelationalCommerceController],
  providers: [
    RelationalFlagsService,
    RelationalCommerceNetworkTraverserService,
    ContactGraphAnalyzerService,
    RelationshipSuggestionEngineService,
    RelationalCatalogEngineService,
    SponsoredInjectionEngineService,
    CommercialIdentityService,
    WholesalerDualCatalogService,
  ],
  exports: [
    SponsoredInjectionEngineService,
    RelationalFlagsService,
    RelationalCommerceNetworkTraverserService,
    ContactGraphAnalyzerService,
    RelationshipSuggestionEngineService,
  ],
})
export class RelationalCommerceModule {}
