import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { RelationalCatalogModule } from "./catalog/relational-catalog.module";

@Module({
  imports: [RelationalCatalogModule],
  controllers: [HealthController],
})
export class AppModule {}
