import { ForbiddenException, Injectable } from "@nestjs/common";
import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";

/**
 * Runtime financial gates — GLOBAL then ORGANIZATION / REGION override (Instruction 8 §10).
 * Delegates to {@link CanonicalFeatureFlagEvaluator} (Instruction 9B).
 */
@Injectable()
export class FinancialFeaturesService {
  constructor(private readonly flags: CanonicalFeatureFlagEvaluator) {}

  async isEnabled(key: string, organizationId?: string, regionCode?: string): Promise<boolean> {
    return this.flags.isEnabled(key, { organizationId, region: regionCode, country: regionCode });
  }

  async requireEnabled(key: string, organizationId?: string, regionCode?: string) {
    if (!(await this.isEnabled(key, organizationId, regionCode))) {
      throw new ForbiddenException({ code: "financial_feature_disabled", key });
    }
  }

  async snapshotForOrg(organizationId?: string, regionCode?: string) {
    const keys = [
      "wallet_enabled",
      "wallet_kyc_enabled",
      "wallet_biometric_enabled",
      "wallet_auto_lock_enabled",
      "wallet_provider_gateway_enabled",
      "qr_enabled",
      "nfc_enabled",
      "payments_enabled",
      "transfer_enabled",
      "electronic_payment_enabled",
      "provider_orange_enabled",
      "provider_wave_enabled",
      "provider_mtn_enabled",
    ] as const;
    const out: Record<string, boolean> = {};
    for (const k of keys) {
      out[k] = await this.isEnabled(k, organizationId, regionCode);
    }
    return out;
  }
}
