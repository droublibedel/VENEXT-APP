import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { RelationshipGraphModule } from "./graph/relationship-graph.module";

@Module({
  imports: [RelationshipGraphModule],
  controllers: [HealthController],
})
export class AppModule {}
