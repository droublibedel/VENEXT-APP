import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { FinancialFeaturesService } from "../financial-feature-flags/financial-features.service";
import { QrCommerceEngineService } from "../qr-commerce/qr-commerce-engine.service";

@Injectable()
export class WalletCoreService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly qr: QrCommerceEngineService,
    private readonly flags: FinancialFeaturesService,
  ) {}

  async overview(organizationId: string) {
    const wallets = await this.prisma.wallet.findMany({
      where: { organizationId },
      orderBy: { updatedAt: "desc" },
      take: 20,
      include: {
        transactions: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    });
    return { organizationId, wallets };
  }

  async refreshMerchantQr(walletId: string) {
    const w = await this.prisma.wallet.findUnique({ where: { id: walletId } });
    if (!w) throw new NotFoundException(walletId);
    await this.flags.requireEnabled("wallet_enabled", w.organizationId);
    await this.flags.requireEnabled("qr_enabled", w.organizationId);
    const payload = this.qr.buildPayload({
      kind: "merchant_payment",
      rail: "hybrid",
      organizationId: w.organizationId,
      currency: w.currency,
      label: `wallet:${walletId}`,
    });
    const uri = this.qr.encodeToUri(payload);
    const updated = await this.prisma.wallet.update({
      where: { id: walletId },
      data: { qrPayload: uri },
    });
    return { wallet: updated, qr: payload };
  }
}
