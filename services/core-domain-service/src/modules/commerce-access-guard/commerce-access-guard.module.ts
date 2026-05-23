import { Module } from "@nestjs/common";

import { CommerceAccessGuardService } from "./commerce-access-guard.service";

@Module({
  providers: [CommerceAccessGuardService],
  exports: [CommerceAccessGuardService],
})
export class CommerceAccessGuardModule {}
