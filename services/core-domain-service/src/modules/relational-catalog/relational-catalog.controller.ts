/**
 * Instruction 19.2 — HTTP surface for relationship-scoped catalog snapshots (no public discovery).
 */
import { BadRequestException, Controller, ForbiddenException, Get, Query, UseGuards } from "@nestjs/common";
import { RelationalCatalogResponseSchema } from "@venext/shared-contracts";
import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { VenextAuthzGuard } from "../../platform-authz/venext-authz.guard";
import { VenextAuthz } from "../../platform-authz/venext-authz.decorators";
import { RelationalCatalogAccessService } from "./relational-catalog-access.service";

@Controller("relational-catalog")
@UseGuards(VenextAuthzGuard)
export class RelationalCatalogController {
  constructor(
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly access: RelationalCatalogAccessService,
  ) {}

  private parseProjection(raw: string | undefined): "summary" | "full" {
    return raw === "full" ? "full" : "summary";
  }

  @Get("snapshot")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async snapshot(
    @Query("organizationId") organizationId?: string,
    @Query("projection") projectionRaw?: string,
    @Query("productCursor") productCursor?: string,
    @Query("catalogCursor") catalogCursor?: string,
  ) {
    if (!organizationId) throw new BadRequestException("organizationId_required");
    if (!(await this.flags.isEnabled("relational_catalog_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "relational_catalog_disabled" });
    }
    const projection = this.parseProjection(projectionRaw);
    const out = await this.access.buildSnapshot(organizationId, projection, { productCursor, catalogCursor });
    const parsed = RelationalCatalogResponseSchema.safeParse(out);
    if (!parsed.success) {
      throw new BadRequestException({ code: "relational_catalog_contract_invalid", issues: parsed.error.flatten() });
    }
    return parsed.data;
  }
}
