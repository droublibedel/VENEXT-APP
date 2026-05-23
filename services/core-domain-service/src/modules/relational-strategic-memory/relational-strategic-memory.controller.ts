/**
 * Instruction 20.18 — strategic memory & corridor learning registry API.
 */
import { Body, Controller, ForbiddenException, Get, Param, ParseUUIDPipe, Post, Query, Req, UseGuards } from "@nestjs/common";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import type { VenextHttpLike } from "../../platform-authz/venext-auth-context";
import { VenextAuthzGuard } from "../../platform-authz/venext-authz.guard";
import { VenextAuthz } from "../../platform-authz/venext-authz.decorators";
import type { CommerceThreadResolvedActor } from "../commerce-thread-access/commerce-thread-actor-resolver.service";
import { VENEXT_COMMERCE_THREAD_ACTOR_KEY } from "../commerce-thread-access/commerce-thread-participant.guard";
import { RelationalStrategicMemoryParticipantGuard } from "./relational-strategic-memory-participant.guard";
import { RelationalStrategicMemoryService } from "./relational-strategic-memory.service";

@Controller("relational-strategic-memory")
@UseGuards(VenextAuthzGuard, RelationalStrategicMemoryParticipantGuard)
export class RelationalStrategicMemoryController {
  constructor(
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly memory: RelationalStrategicMemoryService,
  ) {}

  private async assertFlag(organizationId: string): Promise<void> {
    if (!(await this.flags.isEnabled("relational_strategic_memory_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "relational_strategic_memory_disabled" });
    }
  }

  @Get("memories")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async list(
    @Query("organizationId") organizationId: string,
    @Query("relationshipId") relationshipId: string | undefined,
  ) {
    await this.assertFlag(organizationId);
    return this.memory.listMemories({
      organizationId,
      relationshipId: relationshipId?.trim() || undefined,
    });
  }

  @Get("overview/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async overview(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    return this.memory.buildOverview(relationshipId);
  }

  @Post("memories/:id/archive")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async archive(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("organizationId") organizationId: string,
    @Body() body: unknown,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
  ) {
    await this.assertFlag(organizationId);
    const actor = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    return this.memory.archiveMemory({
      memoryId: id,
      body,
      actorOrganizationId: actor.organizationId,
      actorUserId: actor.userId,
    });
  }

  @Post("memories/:id/invalidate")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async invalidate(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("organizationId") organizationId: string,
    @Body() body: unknown,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
  ) {
    await this.assertFlag(organizationId);
    const actor = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    return this.memory.invalidateMemory({
      memoryId: id,
      body,
      actorOrganizationId: actor.organizationId,
      actorUserId: actor.userId,
    });
  }

  @Post("memories/:id/reuse")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async reuse(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("organizationId") organizationId: string,
    @Body() body: unknown,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
  ) {
    await this.assertFlag(organizationId);
    const actor = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    return this.memory.reuseMemory({
      memoryId: id,
      body,
      actorOrganizationId: actor.organizationId,
      actorUserId: actor.userId,
    });
  }

  @Post("memories/:id/assess-outcome")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async assessOutcome(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("organizationId") organizationId: string,
    @Body() body: unknown,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
  ) {
    await this.assertFlag(organizationId);
    const actor = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    return this.memory.assessMemoryOutcome({
      memoryId: id,
      body,
      actorOrganizationId: actor.organizationId,
      actorUserId: actor.userId,
    });
  }
}
