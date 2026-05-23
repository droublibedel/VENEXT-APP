import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { VenextAuthz } from "../../platform-authz/venext-authz.decorators";
import { VenextAuthzGuard } from "../../platform-authz/venext-authz.guard";
import { CatalogVisibilityEngineService } from "../catalog-visibility/catalog-visibility-engine.service";
import { CommercialIdentityService } from "./commercial-identity.service";
import { WholesalerDualCatalogService } from "./wholesaler-dual-catalog.service";
import { RelationalCommerceNetworkTraverserService } from "./relational-commerce-network-traverser.service";
import { ContactGraphAnalyzerService } from "./contact-graph-analyzer.service";
import { RelationalCatalogEngineService } from "./relational-catalog-engine.service";
import { RelationalFlagsService } from "./relational-flags.service";
import { RelationshipSuggestionEngineService } from "./relationship-suggestion-engine.service";

function parseFeedLimit(raw?: string) {
  const n = raw == null ? 60 : Number(raw);
  return Number.isFinite(n) ? Math.min(Math.max(n, 1), 100) : 60;
}

function feedProjection(
  explicit: string | undefined,
  client: string | undefined,
): "summary" | "standard" | "full" {
  if (explicit === "summary" || explicit === "standard" || explicit === "full") return explicit;
  return client === "mobile" ? "summary" : "standard";
}

@Controller("relational-commerce")
@UseGuards(VenextAuthzGuard)
export class RelationalCommerceController {
  constructor(
    private readonly flags: RelationalFlagsService,
    private readonly networkTraverser: RelationalCommerceNetworkTraverserService,
    private readonly contacts: ContactGraphAnalyzerService,
    private readonly suggestionEngine: RelationshipSuggestionEngineService,
    private readonly catalog: RelationalCatalogEngineService,
    private readonly identity: CommercialIdentityService,
    private readonly catalogGate: CatalogVisibilityEngineService,
    private readonly wholesalerDual: WholesalerDualCatalogService,
  ) {}

  @Get("flags/snapshot")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  snapshot(@Query("organizationId") organizationId?: string) {
    return this.flags.snapshot(organizationId);
  }

  @Get("graph/:organizationId/partners")
  @VenextAuthz({ type: "orgRoute", orgParam: "organizationId" })
  async partners(@Param("organizationId", ParseUUIDPipe) organizationId: string) {
    if (!(await this.flags.isEnabled("relationship_graph_enabled", organizationId))) {
      throw new ForbiddenException("relationship_graph_disabled");
    }
    return this.networkTraverser.partners(organizationId);
  }

  @Get("graph/:organizationId/traverse")
  @VenextAuthz({ type: "orgRoute", orgParam: "organizationId" })
  async traverse(
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
    @Query("maxDepth") maxDepth?: string,
  ) {
    if (!(await this.flags.isEnabled("relationship_graph_enabled", organizationId))) {
      throw new ForbiddenException("relationship_graph_disabled");
    }
    const d = maxDepth ? Number(maxDepth) : 2;
    return this.networkTraverser.traverseNetwork(organizationId, Number.isFinite(d) ? d : 2);
  }

  @Post("graph/qr-join")
  async qrJoin(
    @Body()
    body: {
      requesterOrganizationId: string;
      targetCommercialNetworkId: string;
      upstreamOrganizationId: string;
      downstreamOrganizationId: string;
      actingOrganizationId?: string;
    },
  ) {
    const orgId = body.actingOrganizationId ?? body.requesterOrganizationId;
    if (!(await this.flags.isEnabled("qr_relationship_enabled", orgId))) {
      throw new ForbiddenException("qr_relationship_disabled");
    }
    return this.networkTraverser.createQrJoinInvite({
      requesterOrganizationId: body.requesterOrganizationId,
      targetCommercialNetworkId: body.targetCommercialNetworkId,
      upstreamOrganizationId: body.upstreamOrganizationId,
      downstreamOrganizationId: body.downstreamOrganizationId,
    });
  }

  @Post("contacts/sync")
  @VenextAuthz({ type: "contactSyncBodyUser" })
  async syncContacts(
    @Body() body: { userId: string; phones: string[]; actingOrganizationId?: string },
  ) {
    if (!body.userId || !Array.isArray(body.phones)) throw new BadRequestException("invalid_body");
    if (!(await this.flags.isEnabled("contact_sync_enabled", body.actingOrganizationId))) {
      throw new ForbiddenException("contact_sync_disabled");
    }
    return this.contacts.syncContacts(body.userId, body.phones);
  }

  @Get("contacts/mutual")
  mutual() {
    return this.contacts.mutualContactHandles(2);
  }

  @Get("suggestions/users/:userId")
  @VenextAuthz({ type: "userSelfRoute", userParam: "userId" })
  async suggestionsForUser(@Param("userId", ParseUUIDPipe) userId: string) {
    return this.suggestionEngine.suggestionsForUser(userId);
  }

  @Get("catalog/segmented-feed")
  @VenextAuthz({ type: "relationshipRoute" })
  async segmented(
    @Query("relationshipId") relationshipId?: string,
    @Query("viewerOrganizationId") viewerOrganizationId?: string,
    @Query("supplierOrganizationId") supplierOrganizationId?: string,
    @Query("viewerCategory") viewerCategory?: string,
    @Query("limitPartners") limitPartners?: string,
    @Query("limit") limit?: string,
    @Query("cursor") cursor?: string,
    @Query("projection") projection?: string,
    @Query("sponsoredLimit") sponsoredLimit?: string,
    @Query("sponsoredCursor") sponsoredCursor?: string,
    @Query("sponsoredProjection") sponsoredProjection?: string,
    @Query("client") client?: string,
  ) {
    if (!relationshipId) throw new BadRequestException("relationshipId_required");
    if (!(await this.flags.isEnabled("sponsored_products_enabled", viewerOrganizationId))) {
      /* catalog still works; sponsored lane may be empty client-side */
    }
    const lp = limitPartners ? Number(limitPartners) : undefined;
    const catalogProjection = feedProjection(projection, client);
    const sponsoredProj =
      sponsoredProjection === "summary" || sponsoredProjection === "standard" || sponsoredProjection === "full"
        ? sponsoredProjection
        : catalogProjection;
    return this.catalog.segmentedPartnerFeed({
      relationshipId,
      viewerOrganizationId,
      supplierOrganizationId,
      viewerCategory,
      limitPartners: Number.isFinite(lp ?? NaN) ? lp : undefined,
      catalogLimit: parseFeedLimit(limit),
      catalogCursor: cursor?.trim() || undefined,
      catalogProjection,
      sponsoredLimit: parseFeedLimit(sponsoredLimit ?? limit),
      sponsoredCursor: sponsoredCursor?.trim() || undefined,
      sponsoredProjection: sponsoredProj,
    });
  }

  @Get("identity/:organizationId")
  @VenextAuthz({ type: "orgRoute", orgParam: "organizationId" })
  async identityProfile(@Param("organizationId", ParseUUIDPipe) organizationId: string) {
    if (!(await this.flags.isEnabled("commercial_identity_enabled", organizationId))) {
      throw new ForbiddenException("commercial_identity_disabled");
    }
    return this.identity.profile(organizationId);
  }

  /** Lightweight gate for UI — relationship must be active before catalog engines run */
  @Get("catalog/relationship-check/:relationshipId")
  @VenextAuthz({ type: "relationshipRoute" })
  async relCheck(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("viewerOrganizationId") viewerOrganizationId?: string,
  ) {
    const v = viewerOrganizationId?.trim();
    if (v && !/^[0-9a-f-]{36}$/i.test(v)) throw new BadRequestException("invalid_viewerOrganizationId");
    return this.catalogGate.assertRelationshipAcceptedForCatalog(relationshipId, v || undefined);
  }

  @Get("wholesaler/:organizationId/dual-catalog")
  @VenextAuthz({ type: "orgRoute", orgParam: "organizationId" })
  async dualCatalog(@Param("organizationId", ParseUUIDPipe) organizationId: string) {
    return this.wholesalerDual.dualCatalog(organizationId);
  }
}
