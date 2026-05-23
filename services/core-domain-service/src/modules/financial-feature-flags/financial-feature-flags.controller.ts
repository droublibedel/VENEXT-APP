import { Controller, Get, Query } from "@nestjs/common";
import { FinancialFeaturesService } from "./financial-features.service";

/** Public read model for clients (Instruction 8 §10). */
@Controller("financial-feature-flags")
export class FinancialFeatureFlagsController {
  constructor(private readonly financial: FinancialFeaturesService) {}

  @Get("snapshot")
  snapshot(
    @Query("organizationId") organizationId?: string,
    @Query("regionCode") regionCode?: string,
  ) {
    return this.financial.snapshotForOrg(organizationId, regionCode);
  }
}
