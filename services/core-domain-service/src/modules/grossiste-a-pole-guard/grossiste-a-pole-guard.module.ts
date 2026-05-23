import { Module } from "@nestjs/common";

import { GrossisteAPoleGuardService } from "./grossiste-a-pole-guard.service";

@Module({
  providers: [GrossisteAPoleGuardService],
  exports: [GrossisteAPoleGuardService],
})
export class GrossisteAPoleGuardModule {}
