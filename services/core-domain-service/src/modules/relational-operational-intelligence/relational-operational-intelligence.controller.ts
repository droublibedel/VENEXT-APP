/**
 * Instruction 20.12 — corridor operational intelligence API (non-public, no marketplace KPI).
 */
import { Body, Controller, ForbiddenException, Get, Param, ParseUUIDPipe, Post, Query, Req, UseGuards } from "@nestjs/common";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import type { VenextHttpLike } from "../../platform-authz/venext-auth-context";
import { VenextAuthzGuard } from "../../platform-authz/venext-authz.guard";
import { VenextAuthz } from "../../platform-authz/venext-authz.decorators";
import type { CommerceThreadResolvedActor } from "../commerce-thread-access/commerce-thread-actor-resolver.service";
import { VENEXT_COMMERCE_THREAD_ACTOR_KEY } from "../commerce-thread-access/commerce-thread-participant.guard";
import { RelationalOperationalIntelligenceParticipantGuard } from "./relational-operational-intelligence-participant.guard";
import { RelationalOperationalIntelligenceService } from "./relational-operational-intelligence.service";
import { RelationalOperationalSlaService } from "./relational-operational-sla.service";

@Controller("relational-operational-intelligence")
@UseGuards(VenextAuthzGuard, RelationalOperationalIntelligenceParticipantGuard)
export class RelationalOperationalIntelligenceController {
  constructor(
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly intelligence: RelationalOperationalIntelligenceService,
    private readonly sla: RelationalOperationalSlaService,
  ) {}

  private async assertIntelligenceFlag(organizationId: string): Promise<void> {
    if (!(await this.flags.isEnabled("relational_operational_intelligence_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "relational_operational_intelligence_disabled" });
    }
  }

  private actorOrg(req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor }): string {
    return req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!.organizationId;
  }

  @Get("alerts")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async listAlerts(
    @Query("organizationId") organizationId: string,
    @Query("relationshipId") relationshipId: string | undefined,
    @Query("unresolvedOnly") unresolvedOnly: string | undefined,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
  ) {
    await this.assertIntelligenceFlag(organizationId);
    return this.intelligence.listAlerts({
      organizationId: this.actorOrg(req),
      relationshipId: relationshipId?.trim() || undefined,
      unresolvedOnly: unresolvedOnly === "1" || unresolvedOnly === "true",
    });
  }

  @Post("alerts/:alertId/resolve")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async resolveAlert(
    @Param("alertId", ParseUUIDPipe) alertId: string,
    @Query("organizationId") organizationId: string,
    @Body() body: unknown,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
  ) {
    await this.assertIntelligenceFlag(organizationId);
    return this.intelligence.resolveAlert({
      organizationId: this.actorOrg(req),
      alertId,
      body,
    });
  }

  @Get("metrics")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async listMetrics(
    @Query("organizationId") organizationId: string,
    @Query("relationshipId") relationshipId: string,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
  ) {
    await this.assertIntelligenceFlag(organizationId);
    if (!relationshipId?.trim()) {
      throw new ForbiddenException({ code: "operational_intelligence_relationship_required" });
    }
    await this.intelligence.assertPartyOnRelationship(this.actorOrg(req), relationshipId.trim());
    return this.intelligence.listMetrics({
      organizationId: this.actorOrg(req),
      relationshipId: relationshipId.trim(),
    });
  }

  @Get("sla-snapshot/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async slaSnapshot(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
  ) {
    await this.assertIntelligenceFlag(organizationId);
    await this.intelligence.assertPartyOnRelationship(this.actorOrg(req), relationshipId);
    return this.sla.buildSlaSnapshot(relationshipId);
  }

  @Get("risk-overview")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async riskOverview(
    @Query("organizationId") organizationId: string,
    @Query("relationshipId") relationshipId: string,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
  ) {
    await this.assertIntelligenceFlag(organizationId);
    if (!relationshipId?.trim()) {
      throw new ForbiddenException({ code: "operational_intelligence_relationship_required" });
    }
    await this.intelligence.assertPartyOnRelationship(this.actorOrg(req), relationshipId.trim());
    return this.sla.buildRiskOverview(relationshipId.trim());
  }
}
