import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Req, UseGuards } from "@nestjs/common";

import type { VenextHttpLike } from "../../platform-authz/venext-auth-context";
import type { CommerceThreadResolvedActor } from "../commerce-thread-access/commerce-thread-actor-resolver.service";
import { CommerceThreadAccessPolicy } from "../commerce-thread-access/commerce-thread-access.policy";
import {
  CommerceMessagingActorGuard,
  VENEXT_COMMERCE_THREAD_ACTOR_KEY,
} from "../commerce-thread-access/commerce-thread-participant.guard";
import { OfflineMessageSyncService } from "./offline-message-sync.service";

@Controller("offline-message-sync")
export class OfflineMessageSyncController {
  constructor(
    private readonly sync: OfflineMessageSyncService,
    private readonly policy: CommerceThreadAccessPolicy,
  ) {}

  @Get("pending")
  @UseGuards(CommerceMessagingActorGuard)
  pending(@Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor }) {
    const actor = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    return this.sync.listPendingForActor(actor);
  }

  @Post("enqueue")
  @UseGuards(CommerceMessagingActorGuard)
  async enqueue(
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
    @Body() body: { threadId: string; payload: object },
  ) {
    const actor = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    await this.policy.assertCanWriteThread(actor, body.threadId);
    return this.sync.enqueue(body.threadId, body.payload);
  }

  @Post("pending/:id/ack-sent")
  @UseGuards(CommerceMessagingActorGuard)
  ack(
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    const actor = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    return this.sync.markSentForActor(id, actor);
  }
}
