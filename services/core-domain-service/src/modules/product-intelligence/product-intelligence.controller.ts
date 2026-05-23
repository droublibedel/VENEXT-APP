import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { VenextAuthz } from "../../platform-authz/venext-authz.decorators";
import { VenextAuthzGuard } from "../../platform-authz/venext-authz.guard";
import { ProductIntelligenceService } from "./product-intelligence.service";
import { ProductRelevanceResolverService } from "./product-relevance-resolver.service";

function parseCatalogLimit(raw?: string) {
  const n = raw == null ? 60 : Number(raw);
  return Number.isFinite(n) ? Math.min(Math.max(n, 1), 100) : 60;
}

function catalogProjection(explicit: string | undefined, client: string | undefined): "summary" | "standard" | "full" {
  if (explicit === "summary" || explicit === "standard" || explicit === "full") return explicit;
  return client === "mobile" ? "summary" : "standard";
}

@Controller("product-intelligence")
@UseGuards(VenextAuthzGuard)
export class ProductIntelligenceController {
  constructor(
    private readonly intelligence: ProductIntelligenceService,
    private readonly relevance: ProductRelevanceResolverService,
  ) {}

  @Get("living-catalog")
  @VenextAuthz({ type: "relationshipRoute" })
  livingCatalog(
    @Query("relationshipId") relationshipId?: string,
    @Query("viewerOrganizationId") viewerOrganizationId?: string,
    @Query("limit") limit?: string,
    @Query("cursor") cursor?: string,
    @Query("projection") projection?: string,
    @Query("client") client?: string,
  ) {
    if (!relationshipId) throw new BadRequestException("relationshipId is required");
    return this.intelligence.livingCatalog(relationshipId, viewerOrganizationId, {
      limit: parseCatalogLimit(limit),
      cursor: cursor?.trim() || undefined,
      projection: catalogProjection(projection, client),
    });
  }

  @Get("products/:productId/living-card")
  @VenextAuthz({ type: "relationshipRoute" })
  livingCard(
    @Param("productId", ParseUUIDPipe) productId: string,
    @Query("relationshipId") relationshipId?: string,
    @Query("viewerOrganizationId") viewerOrganizationId?: string,
  ) {
    if (!relationshipId) throw new BadRequestException("relationshipId is required");
    return this.intelligence.livingCard(productId, relationshipId, viewerOrganizationId);
  }

  @Post("relevance/resolve")
  resolveRelevance(
    @Body()
    body: {
      productId: string;
      retailerOrganizationId: string;
      relationshipId?: string;
      zoneCode?: string;
    },
  ) {
    return this.relevance.resolve(body);
  }
}
