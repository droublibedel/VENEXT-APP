import { Controller, Get, Param, ParseUUIDPipe, Query } from "@nestjs/common";
import { MessagesService } from "./messages.service";

@Controller("messages")
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  /** Conversation threads (commerce-contextual, not generic chat inbox). */
  @Get("threads")
  threads(
    @Query("productId") productId?: string,
    @Query("orderId") orderId?: string,
    @Query("negotiationId") negotiationId?: string,
    @Query("organizationId") organizationId?: string,
  ) {
    return this.messages.threads({
      productId,
      orderId,
      negotiationId,
      organizationId,
    });
  }

  @Get("threads/:threadId/items")
  threadItems(@Param("threadId", ParseUUIDPipe) threadId: string) {
    return this.messages.threadMessages(threadId);
  }
}
