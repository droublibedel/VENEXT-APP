import { Controller, Get, Param, ParseUUIDPipe, Query, Req, UseGuards } from "@nestjs/common";

import type { VenextHttpLike } from "../../platform-authz/venext-auth-context";
import { parseVenextActorFromRequest } from "../../platform-authz/venext-auth-context";
import { VenextAuthzGuard } from "../../platform-authz/venext-authz.guard";
import { VenextAuthz } from "../../platform-authz/venext-authz.decorators";
import { CommercialTrustProfileAccessGuard } from "./commercial-trust-profile-access.guard";
import { CommercialTrustQueryService } from "./commercial-trust-query.service";

@Controller("commercial-trust")
@UseGuards(VenextAuthzGuard)
export class CommercialTrustController {
  constructor(private readonly query: CommercialTrustQueryService) {}

  @Get("profile/:organizationId")
  @UseGuards(CommercialTrustProfileAccessGuard)
  async profile(
    @Req() req: VenextHttpLike,
    @Param("organizationId", ParseUUIDPipe) organizationId: string,
    @Query("refresh") refresh?: string,
  ) {
    const actor = parseVenextActorFromRequest(req);
    const wantRefresh = refresh === "1" || refresh === "true";
    return this.query.getProfile(actor, organizationId, wantRefresh);
  }

  @Get("relationship/:relationshipId")
  @UseGuards(CommercialTrustProfileAccessGuard)
  @VenextAuthz({ type: "relationshipRoute", relationshipParam: "relationshipId" })
  async relationship(
    @Req() req: VenextHttpLike,
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("refresh") refresh?: string,
  ) {
    const actor = parseVenextActorFromRequest(req);
    const wantRefresh = refresh === "1" || refresh === "true";
    return this.query.getRelationship(actor, relationshipId, wantRefresh);
  }
}
