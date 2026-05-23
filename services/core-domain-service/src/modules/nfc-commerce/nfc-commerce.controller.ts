import { Body, Controller, Get, Headers, Post, Query } from "@nestjs/common";
import { FinancialFeaturesService } from "../financial-feature-flags/financial-features.service";
import { NfcCommerceService } from "./nfc-commerce.service";

@Controller("nfc-commerce")
export class NfcCommerceController {
  constructor(
    private readonly nfc: NfcCommerceService,
    private readonly flags: FinancialFeaturesService,
  ) {}

  @Get("capability")
  async capability(
    @Headers("user-agent") ua?: string,
    @Query("organizationId") organizationId?: string,
    @Query("regionCode") regionCode?: string,
  ) {
    const enabled = await this.flags.isEnabled("nfc_enabled", organizationId, regionCode);
    const nfcLikely = Boolean(ua && /android|iphone|ios/i.test(ua));
    return {
      nfc_enabled_flag: enabled,
      device_nfc_likely: nfcLikely,
      tap_protocol: "venext-nfc-intent-v1",
      note: "Merchant validation and PSP tap routes are feature-flagged; no hardcoded wallet vendor.",
    };
  }

  @Post("intent")
  async intent(
    @Body()
    body: {
      organizationId: string;
      currency: string;
      amountMinor?: number | null;
      productId?: string | null;
      regionCode?: string;
    },
  ) {
    await this.flags.requireEnabled("nfc_enabled", body.organizationId, body.regionCode);
    await this.flags.requireEnabled("wallet_enabled", body.organizationId, body.regionCode);
    return this.nfc.createIntent({
      organizationId: body.organizationId,
      currency: body.currency,
      amountMinor: body.amountMinor,
      productId: body.productId,
    });
  }
}
