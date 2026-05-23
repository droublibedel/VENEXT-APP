import { Controller, Headers, Param, ParseUUIDPipe, Post, UnauthorizedException } from "@nestjs/common";

import { RelationshipGovernanceService } from "./relationship-governance.service";

/**
 * Effective path: `POST /v1/internal/v1/relationship-intelligence/recompute/:relationshipId`
 * (Nest global prefix `v1` + controller base `internal/v1/relationship-intelligence`).
 */
@Controller("internal/v1/relationship-intelligence")
export class InternalRelationshipIntelligenceController {
  constructor(private readonly governance: RelationshipGovernanceService) {}

  @Post("recompute/:relationshipId")
  async recompute(
    @Headers("x-venext-internal-key") key: string | undefined,
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
  ) {
    this.assertKey(key);
    await this.governance.computeCorridorHealth(relationshipId);
    return { ok: true, relationshipId, mode: "CORRIDOR_RECOMPUTE" as const };
  }

  private assertKey(key: string | undefined) {
    const expect =
      process.env.VENEXT_INTERNAL_CORRIDOR_INTELLIGENCE_KEY?.trim() ||
      process.env.VENEXT_INTERNAL_REALTIME_KEY?.trim();
    if (!expect || key !== expect) {
      throw new UnauthorizedException();
    }
  }
}
