import { Module } from "@nestjs/common";

import { PrismaModule } from "../../prisma/prisma.module";
import { RelationalCommerceModule } from "../relational-commerce/relational-commerce.module";
import { CommerceMarketCatalogController } from "./commerce-market-catalog.controller";
import { CommerceMarketCatalogSeedService } from "./commerce-market-catalog.seed.service";
import { CommerceMarketCatalogService } from "./commerce-market-catalog.service";

@Module({
  imports: [PrismaModule, RelationalCommerceModule],
  controllers: [CommerceMarketCatalogController],
  providers: [CommerceMarketCatalogService, CommerceMarketCatalogSeedService],
  exports: [CommerceMarketCatalogService, CommerceMarketCatalogSeedService],
})
export class CommerceMarketCatalogModule {}
