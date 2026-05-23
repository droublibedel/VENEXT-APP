import { Module } from "@nestjs/common";
import { DemoOperationalDataService } from "./demo-operational-data.service";
import { PolesController } from "./poles.controller";
import { PolesRegistryService } from "./poles-registry.service";

@Module({
  controllers: [PolesController],
  providers: [PolesRegistryService, DemoOperationalDataService],
  exports: [PolesRegistryService, DemoOperationalDataService],
})
export class PolesModule {}
