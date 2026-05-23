import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { CatalogVisibilityEngineService } from "./catalog-visibility-engine.service";

@Module({
  imports: [PrismaModule],
  providers: [CatalogVisibilityEngineService],
  exports: [CatalogVisibilityEngineService],
})
export class CatalogVisibilityModule {}
