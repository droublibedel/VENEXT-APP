import { Controller, Get, Param, ParseUUIDPipe, Post } from "@nestjs/common";
import { FinancialFeaturesService } from "../financial-feature-flags/financial-features.service";
import { WalletCoreService } from "./wallet-core.service";

@Controller("wallet-core")
export class WalletCoreController {
  constructor(
    private readonly wallet: WalletCoreService,
    private readonly flags: FinancialFeaturesService,
  ) {}

  @Get("organizations/:organizationId/overview")
  async overview(@Param("organizationId", ParseUUIDPipe) organizationId: string) {
    await this.flags.requireEnabled("wallet_enabled", organizationId);
    return this.wallet.overview(organizationId);
  }

  @Post("wallets/:walletId/refresh-merchant-qr")
  async refreshQr(@Param("walletId", ParseUUIDPipe) walletId: string) {
    return this.wallet.refreshMerchantQr(walletId);
  }
}
