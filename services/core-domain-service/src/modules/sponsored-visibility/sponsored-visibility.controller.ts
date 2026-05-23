import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import type { SponsoredInjectionProjection } from "../relational-commerce/sponsored-injection-engine.service";
import { SponsoredVisibilityEngineService } from "./sponsored-visibility-engine.service";

function parseProjection(raw?: string): SponsoredInjectionProjection | undefined {
  if (raw === "summary" || raw === "standard" || raw === "full") return raw;
  return undefined;
}

@Controller("sponsored-visibility")
export class SponsoredVisibilityController {
  constructor(private readonly engine: SponsoredVisibilityEngineService) {}

  @Get("injections")
  injections(
    @Query("viewerCategory") viewerCategory?: string,
    @Query("viewerOrganizationId") viewerOrganizationId?: string,
    @Query("limit") limit?: string,
    @Query("cursor") cursor?: string,
    @Query("projection") projection?: string,
  ) {
    const lim = limit ? Number(limit) : undefined;
    return this.engine.listActiveInjections({
      viewerCategory,
      viewerOrganizationId,
      limit: Number.isFinite(lim ?? NaN) ? lim : undefined,
      cursor: cursor?.trim() || undefined,
      projection: parseProjection(projection),
    });
  }

  @Post("evaluate")
  evaluate(
    @Body()
    body: {
      injectionId?: string;
      productId: string;
      retailerOrganizationId: string;
      relationshipId?: string;
    },
  ) {
    return this.engine.evaluate(body);
  }
}
