import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { WalletProviderCode } from "@prisma/client";

import { WalletPlatformService } from "./wallet-platform.service";
import type { WalletKycSubmitBody } from "./wallet-platform.types";

@Controller("wallet")
export class WalletPlatformController {
  constructor(private readonly wallet: WalletPlatformService) {}

  @Get("me")
  getMe(@Query("organizationId") organizationId: string, @Query("deviceId") deviceId?: string) {
    return this.wallet.getMe(organizationId, deviceId);
  }

  @Post("activate")
  activate(@Body() body: { organizationId: string }) {
    return this.wallet.activateWallet(body.organizationId);
  }

  @Post("kyc/upload")
  submitKyc(@Body() body: WalletKycSubmitBody) {
    return this.wallet.submitKyc(body);
  }

  @Get("transactions")
  transactions(@Query("organizationId") organizationId: string) {
    return this.wallet.listTransactions(organizationId);
  }

  @Post("topup")
  topup(@Body() body: { organizationId: string; amountFcfa: number; provider?: WalletProviderCode }) {
    return this.wallet.topup(body.organizationId, body.amountFcfa, body.provider);
  }

  @Post("lock")
  lock(@Body() body: { organizationId: string; reason?: string }) {
    return this.wallet.lockWallet(body.organizationId, body.reason);
  }

  @Post("unlock")
  unlock(@Body() body: { organizationId: string; pin?: string }) {
    return this.wallet.unlockWallet(body.organizationId, body.pin);
  }

  @Post("biometric/enable")
  enableBiometric(@Body() body: { organizationId: string }) {
    return this.wallet.setBiometric(body.organizationId, true);
  }

  @Post("biometric/disable")
  disableBiometric(@Body() body: { organizationId: string }) {
    return this.wallet.setBiometric(body.organizationId, false);
  }

  @Post("security/pin")
  configurePin(@Body() body: { organizationId: string; pin: string }) {
    return this.wallet.configurePin(body.organizationId, body.pin);
  }

  @Post("security/inactivity-lock")
  inactivityLock(@Body() body: { organizationId: string }) {
    return this.wallet.recordInactivityLock(body.organizationId);
  }

  @Post("security/touch")
  touch(@Body() body: { organizationId: string }) {
    return this.wallet.touchActivity(body.organizationId);
  }

  @Post("sessions/:deviceId/revoke")
  revokeSession(
    @Param("deviceId") deviceId: string,
    @Body() body: { organizationId: string },
  ) {
    return this.wallet.revokeSession(body.organizationId, deviceId);
  }
}
