import { Controller, Headers, Param, ParseUUIDPipe, Post, UnauthorizedException } from "@nestjs/common";

import { CommercialTrustComputationService } from "./commercial-trust-computation.service";
import { COMMERCIAL_TRUST_INTERNAL_CONTROLLER_PATH } from "./commercial-trust-routes.constants";

/**
 * Instruction 20.3 — internal recompute (cron / ops). Nest global prefix `v1` →
 * `POST /v1/internal/v1/commercial-trust/recompute/:organizationId`
 *
 * Instruction 20.3A — orders impact recompute uses the same per-org heuristic (Order rows are read inside compute).
 */
@Controller(COMMERCIAL_TRUST_INTERNAL_CONTROLLER_PATH)
export class InternalCommercialTrustController {
  constructor(private readonly computation: CommercialTrustComputationService) {}

  @Post("recompute/:organizationId")
  async recompute(
    @Headers("x-venext-internal-key") key: string | undefined,
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
  ) {
    this.assertKey(key);
    await this.computation.computeAndPersist(organizationId);
    return { ok: true, organizationId };
  }

  @Post("recompute-orders-impact/:organizationId")
  async recomputeOrdersImpact(
    @Headers("x-venext-internal-key") key: string | undefined,
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
  ) {
    this.assertKey(key);
    await this.computation.computeAndPersist(organizationId);
    return { ok: true, organizationId, mode: "ORDERS_IMPACT_RECOMPUTE" as const };
  }

  private assertKey(key: string | undefined) {
    const expect =
      process.env.VENEXT_INTERNAL_COMMERCIAL_TRUST_KEY?.trim() ||
      process.env.VENEXT_INTERNAL_REALTIME_KEY?.trim();
    if (!expect || key !== expect) {
      throw new UnauthorizedException();
    }
  }
}
