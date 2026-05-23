import { Global, Module } from "@nestjs/common";
import { DomainRealtimeFanoutClient } from "./domain-realtime-fanout.client";

@Global()
@Module({
  providers: [DomainRealtimeFanoutClient],
  exports: [DomainRealtimeFanoutClient],
})
export class DomainRealtimeModule {}
