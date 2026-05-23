import { Module } from "@nestjs/common";
import { RelationshipGraphController } from "./relationship-graph.controller";
import { RelationshipGraphService } from "./relationship-graph.service";

@Module({
  controllers: [RelationshipGraphController],
  providers: [RelationshipGraphService],
  exports: [RelationshipGraphService],
})
export class RelationshipGraphModule {}
