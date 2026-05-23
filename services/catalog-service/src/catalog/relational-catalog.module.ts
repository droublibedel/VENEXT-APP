import { Module } from "@nestjs/common";
import { RelationalCatalogController } from "./relational-catalog.controller";

@Module({
  controllers: [RelationalCatalogController],
})
export class RelationalCatalogModule {}
