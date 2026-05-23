import { Module } from "@nestjs/common";
import { RelationshipStabilityService } from "./relationship-stability.service";

@Module({
  providers: [RelationshipStabilityService],
  exports: [RelationshipStabilityService],
})
export class RelationshipStabilityModule {}
