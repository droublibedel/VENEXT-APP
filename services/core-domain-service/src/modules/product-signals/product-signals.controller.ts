import { Controller, Get, Param, ParseUUIDPipe } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { ProductDiscussionSignalsService } from "../product-intelligence/product-discussion-signals.service";
import { ProductMarketEnergyEngineService } from "../product-intelligence/product-market-energy-engine.service";

@Controller("product-signals")
export class ProductSignalsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly discussion: ProductDiscussionSignalsService,
    private readonly marketEnergy: ProductMarketEnergyEngineService,
  ) {}

  @Get("products/:productId/discussion")
  getDiscussion(@Param("productId", ParseUUIDPipe) productId: string) {
    return this.discussion.getSignals(productId);
  }

  @Get("products/:productId/market-energy")
  async getMarketEnergy(@Param("productId", ParseUUIDPipe) productId: string) {
    const state = await this.prisma.productEconomicState.findUnique({
      where: { productId },
    });
    return this.marketEnergy.compute(productId, state);
  }
}
