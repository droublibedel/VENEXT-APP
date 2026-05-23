import { Module } from "@nestjs/common";
import { FeatureFlagsModule } from "../feature-flags/feature-flags.module";
import { IndustrialPolesController } from "./industrial-poles.controller";
import { IndustrialPolesService } from "./industrial-poles.service";

@Module({
  imports: [FeatureFlagsModule],
  controllers: [IndustrialPolesController],
  providers: [IndustrialPolesService],
})
export class IndustrialPolesModule {}
