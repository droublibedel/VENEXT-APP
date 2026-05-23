import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { MessageType } from "@prisma/client";

import type { VenextHttpLike } from "../../platform-authz/venext-auth-context";
import type { CommerceThreadResolvedActor } from "../commerce-thread-access/commerce-thread-actor-resolver.service";
import {
  CommerceMessagingActorGuard,
  CommerceThreadParticipantGuard,
  VENEXT_COMMERCE_THREAD_ACTOR_KEY,
} from "../commerce-thread-access/commerce-thread-participant.guard";
import { CommerceMessagingService } from "./commerce-messaging.service";
import { MockConversationInsightService } from "./mock-conversation-insight.service";

@Controller("commerce-messaging")
export class CommerceMessagingController {
  constructor(
    private readonly messaging: CommerceMessagingService,
    private readonly insights: MockConversationInsightService,
  ) {}

  @Post("threads/from-product")
  @UseGuards(CommerceMessagingActorGuard)
  fromProduct(
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
    @Body() body: { productId: string; negotiationId: string },
  ) {
    const actor = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    return this.messaging.startOrGetProductThread(actor, body);
  }

  @Post("threads/:threadId/messages")
  @UseGuards(CommerceThreadParticipantGuard)
  postMessage(
    @Param("threadId", ParseUUIDPipe) threadId: string,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
    @Body()
    body: {
      messageType: MessageType;
      content?: string | null;
      structuredEvent?: object;
      voiceUrl?: string | null;
      mediaUrls?: string[];
    },
  ) {
    const actor = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    return this.messaging.postMessage(actor, { threadId, ...body });
  }

  @Get("threads/:threadId/commerce-context")
  @UseGuards(CommerceThreadParticipantGuard)
  context(
    @Param("threadId", ParseUUIDPipe) threadId: string,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
  ) {
    const actor = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    return this.messaging.commerceContext(actor, threadId);
  }

  @Patch("threads/:threadId/read")
  @UseGuards(CommerceThreadParticipantGuard)
  read(
    @Param("threadId", ParseUUIDPipe) threadId: string,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
  ) {
    const actor = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    return this.messaging.markThreadRead(actor, threadId);
  }

  @Post("threads/:threadId/insights/mock")
  @UseGuards(CommerceThreadParticipantGuard)
  async mockInsight(
    @Param("threadId", ParseUUIDPipe) threadId: string,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
  ) {
    const actor = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    const ctx = await this.messaging.commerceContext(actor, threadId);
    return this.insights.insightForThread(threadId, ctx.negotiation?.status);
  }
}
