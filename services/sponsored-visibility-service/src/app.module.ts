import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { SponsoredModule } from "./sponsored/sponsored.module";

@Module({
  imports: [SponsoredModule],
  controllers: [HealthController],
})
export class AppModule {}
