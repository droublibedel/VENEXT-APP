import { Controller, Get, NotFoundException, Query } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { FinancialFeaturesService } from "../financial-feature-flags/financial-features.service";

@Controller("payments")
export class PaymentsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: FinancialFeaturesService,
  ) {}

  /** Product-level payment modes (Instruction 8 §7). */
  @Get("product-modes")
  async productModes(
    @Query("productId") productId: string,
    @Query("organizationId") organizationId?: string,
    @Query("regionCode") regionCode?: string,
  ) {
    await this.flags.requireEnabled("wallet_enabled", organizationId, regionCode);
    const p = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, paymentModes: true, organizationId: true },
    });
    if (!p) throw new NotFoundException(productId);
    return {
      productId: p.id,
      name: p.name,
      paymentModes: p.paymentModes,
      sellerOrganizationId: p.organizationId,
    };
  }
}
