import { forwardRef, Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { CatalogVisibilityModule } from "../catalog-visibility/catalog-visibility.module";
import { GroupBuyingController } from "../group-buying/group-buying.controller";
import { GroupBuyingService } from "../group-buying/group-buying.service";
import { ProductDiscussionSignalsService } from "../product-intelligence/product-discussion-signals.service";
import { ProductIntelligenceController } from "../product-intelligence/product-intelligence.controller";
import { ProductIntelligenceService } from "../product-intelligence/product-intelligence.service";
import { ProductMarketEnergyEngineService } from "../product-intelligence/product-market-energy-engine.service";
import { ProductRelevanceResolverService } from "../product-intelligence/product-relevance-resolver.service";
import { ProductSignalsController } from "../product-signals/product-signals.controller";
import { ProductTraceabilityController } from "../product-traceability/product-traceability.controller";
import { ProductTraceabilityService } from "../product-traceability/product-traceability.service";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { RelationalCommerceModule } from "../relational-commerce/relational-commerce.module";
import { SponsoredVisibilityController } from "../sponsored-visibility/sponsored-visibility.controller";
import { SponsoredVisibilityEngineService } from "../sponsored-visibility/sponsored-visibility-engine.service";

/**
 * Instruction 6 — living commerce (single Nest module, code split by folder).
 */
@Module({
  imports: [PrismaModule, CatalogVisibilityModule, PlatformAuthzModule, forwardRef(() => RelationalCommerceModule)],
  controllers: [
    ProductIntelligenceController,
    ProductSignalsController,
    GroupBuyingController,
    SponsoredVisibilityController,
    ProductTraceabilityController,
  ],
  providers: [
    ProductDiscussionSignalsService,
    ProductMarketEnergyEngineService,
    ProductRelevanceResolverService,
    ProductIntelligenceService,
    SponsoredVisibilityEngineService,
    GroupBuyingService,
    ProductTraceabilityService,
  ],
  exports: [ProductIntelligenceService, ProductRelevanceResolverService, CatalogVisibilityModule],
})
export class ProductCommerceModule {}
