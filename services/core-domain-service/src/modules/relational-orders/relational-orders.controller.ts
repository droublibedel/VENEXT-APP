/**
 * Instruction 20.0 — HTTP read surface for corridor-scoped relational orders (no checkout / payment).
 */
import { BadRequestException, Controller, ForbiddenException, Get, Query, UseGuards } from "@nestjs/common";
import {
  type RelationalOrderStatus,
  RelationalOrdersResponseSchema,
  RelationalOrderStatusSchema,
} from "@venext/shared-contracts";
import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { VenextAuthzGuard } from "../../platform-authz/venext-authz.guard";
import { VenextAuthz } from "../../platform-authz/venext-authz.decorators";
import { RelationalOrdersAccessService } from "./relational-orders-access.service";

@Controller("relational-orders")
@UseGuards(VenextAuthzGuard)
export class RelationalOrdersController {
  constructor(
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly access: RelationalOrdersAccessService,
  ) {}

  private parseProjection(raw: string | undefined): "summary" | "full" {
    return raw === "full" ? "full" : "summary";
  }

  @Get("snapshot")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async snapshot(
    @Query("organizationId") organizationId?: string,
    @Query("projection") projectionRaw?: string,
    @Query("orderCursor") orderCursor?: string,
    @Query("relationshipId") relationshipId?: string,
    @Query("status") statusRaw?: string,
  ) {
    if (!organizationId) throw new BadRequestException("organizationId_required");
    if (!(await this.flags.isEnabled("relational_orders_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "relational_orders_disabled" });
    }
    let status: RelationalOrderStatus | undefined;
    if (statusRaw !== undefined && statusRaw !== "") {
      const st = RelationalOrderStatusSchema.safeParse(statusRaw);
      if (!st.success) {
        throw new BadRequestException({ code: "relational_orders_status_invalid", issues: st.error.flatten() });
      }
      status = st.data;
    }
    const projection = this.parseProjection(projectionRaw);
    const out = await this.access.buildSnapshot(organizationId, projection, { orderCursor, relationshipId, status });
    const parsed = RelationalOrdersResponseSchema.safeParse(out);
    if (!parsed.success) {
      throw new BadRequestException({ code: "relational_orders_contract_invalid", issues: parsed.error.flatten() });
    }
    return parsed.data;
  }
}
