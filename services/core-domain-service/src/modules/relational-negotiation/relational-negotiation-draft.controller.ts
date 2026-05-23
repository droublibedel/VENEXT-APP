import { Controller, Get, Param, ParseUUIDPipe, Post, Req, UseGuards } from "@nestjs/common";

import type { VenextHttpLike } from "../../platform-authz/venext-auth-context";
import {
  CommerceThreadParticipantGuard,
  VENEXT_COMMERCE_THREAD_ACTOR_KEY,
} from "../commerce-thread-access/commerce-thread-participant.guard";
import type { CommerceThreadResolvedActor } from "../commerce-thread-access/commerce-thread-actor-resolver.service";
import { RelationalNegotiationDraftService } from "./relational-negotiation-draft.service";

@Controller("commerce-messaging")
@UseGuards(CommerceThreadParticipantGuard)
export class RelationalNegotiationDraftController {
  constructor(private readonly drafts: RelationalNegotiationDraftService) {}

  @Get("threads/:threadId/conversational-order-draft")
  getDraft(@Param("threadId", ParseUUIDPipe) threadId: string, @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor }) {
    const actor = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    return this.drafts.getDraftSnapshot(threadId, actor);
  }

  @Post("threads/:threadId/conversational-order-draft/confirm-human")
  confirm(@Param("threadId", ParseUUIDPipe) threadId: string, @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor }) {
    const actor = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    return this.drafts.confirmDraftHuman({ threadId, actor });
  }

  @Post("threads/:threadId/conversational-order-draft/reject-human")
  reject(@Param("threadId", ParseUUIDPipe) threadId: string, @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor }) {
    const actor = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    return this.drafts.rejectDraftHuman({ threadId, actor });
  }
}
