import { Module } from "@nestjs/common";

import { RelationalLayerRegistryService } from "./relational-layer-registry.service";

@Module({
  providers: [RelationalLayerRegistryService],
  exports: [RelationalLayerRegistryService],
})
export class RelationalLayerRegistryModule {}
