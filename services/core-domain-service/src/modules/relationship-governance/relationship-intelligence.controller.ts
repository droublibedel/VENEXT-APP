import { Controller, Get, Param, ParseUUIDPipe, Req, UseGuards } from "@nestjs/common";

import type { VenextHttpLike } from "../../platform-authz/venext-auth-context";
import { parseVenextActorFromRequest } from "../../platform-authz/venext-auth-context";
import { VenextAuthzGuard } from "../../platform-authz/venext-authz.guard";
import { VenextAuthz } from "../../platform-authz/venext-authz.decorators";
import { RelationshipGovernanceQueryService } from "./relationship-governance-query.service";
import { RelationshipIntelligenceAccessGuard } from "./relationship-intelligence-access.guard";

@Controller("relationship-intelligence")
@UseGuards(VenextAuthzGuard)
export class RelationshipIntelligenceController {
  constructor(private readonly query: RelationshipGovernanceQueryService) {}

  @Get("profile/:relationshipId")
  @UseGuards(RelationshipIntelligenceAccessGuard)
  @VenextAuthz({ type: "relationshipRoute", relationshipParam: "relationshipId" })
  async profile(@Req() req: VenextHttpLike, @Param("relationshipId", ParseUUIDPipe) relationshipId: string) {
    const actor = parseVenextActorFromRequest(req);
    return this.query.getProfile(actor, relationshipId);
  }

  @Get("health/:relationshipId")
  @UseGuards(RelationshipIntelligenceAccessGuard)
  @VenextAuthz({ type: "relationshipRoute", relationshipParam: "relationshipId" })
  async health(@Req() req: VenextHttpLike, @Param("relationshipId", ParseUUIDPipe) relationshipId: string) {
    const actor = parseVenextActorFromRequest(req);
    return this.query.getHealth(actor, relationshipId);
  }
}
