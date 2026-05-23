import { Module } from "@nestjs/common";
import { MessagingContextController } from "./messaging-context.controller";

@Module({
  controllers: [MessagingContextController],
})
export class MessagingContextModule {}
