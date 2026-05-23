import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Patch,
  Param,
} from "@nestjs/common";
import { FeatureFlagScopeType } from "@prisma/client";
import { FeatureFlagsService } from "../../feature-flags/feature-flags.service";
import { FinancialFeaturesService } from "../financial-feature-flags/financial-features.service";

const TOKEN_ENV = "VENEXT_BACKOFFICE_TOKEN";

/**
 * Strategic operational control (Instruction 8 §11).
 * Secured with shared token — replace with IAM in production.
 */
@Controller("financial-backoffice")
export class FinancialBackofficeController {
  constructor(
    private readonly featureFlags: FeatureFlagsService,
    private readonly financial: FinancialFeaturesService,
  ) {}

  private assertToken(token: string | undefined) {
    const expected = process.env[TOKEN_ENV]?.trim() || "dev-backoffice-token";
    if (!token || token !== expected) throw new ForbiddenException("backoffice_token");
  }

  @Get("panel")
  async panel(
    @Headers("x-venext-backoffice-token") token: string | undefined,
    @Headers("x-venext-organization-id") org?: string,
    @Headers("x-venext-region") region?: string,
  ) {
    this.assertToken(token);
    const [globalFlags, snapshot] = await Promise.all([
      this.featureFlags.findRuntime({ scopeType: FeatureFlagScopeType.GLOBAL }),
      this.financial.snapshotForOrg(org, region),
    ]);
    return {
      globalFlags: globalFlags.filter((f) =>
        [
          "wallet_enabled",
          "qr_enabled",
          "nfc_enabled",
          "payments_enabled",
          "transfer_enabled",
          "electronic_payment_enabled",
          "provider_orange_enabled",
          "provider_wave_enabled",
          "provider_mtn_enabled",
        ].includes(f.key),
      ),
      effectiveSnapshot: snapshot,
    };
  }

  @Patch("flags/:key")
  async patchFlag(
    @Headers("x-venext-backoffice-token") token: string | undefined,
    @Param("key") key: string,
    @Body()
    body: {
      enabled: boolean;
      description?: string;
      scopeType?: FeatureFlagScopeType;
      scopeValue?: string | null;
    },
  ) {
    this.assertToken(token);
    return this.featureFlags.upsertRuntime({
      key,
      enabled: body.enabled,
      description: body.description,
      scopeType: body.scopeType,
      scopeValue: body.scopeValue,
    });
  }
}
