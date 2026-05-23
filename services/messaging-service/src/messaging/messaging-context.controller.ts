import { Controller, Get } from "@nestjs/common";

@Controller("v1/messaging-context")
export class MessagingContextController {
  @Get("foundation")
  foundation() {
    return {
      threading: "contextual_commerce_threads",
      persistence: "messages.context JSONB",
    };
  }
}
