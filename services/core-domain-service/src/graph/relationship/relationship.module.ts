import { Module } from "@nestjs/common";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { GraphCoreModule } from "../graph-core.module";
import { CatalogVisibilityModule } from "../catalog-visibility/catalog-visibility.module";
import { RelationshipRepository } from "./relationship.repository";
import { RelationshipService } from "./relationship.service";
import { RelationshipController } from "./relationship.controller";
import { CommercialTrustModule } from "../../modules/commercial-trust/commercial-trust.module";
import { RelationshipGovernanceModule } from "../../modules/relationship-governance/relationship-governance.module";

@Module({
  imports: [PrismaModule, GraphCoreModule, CatalogVisibilityModule, PlatformAuthzModule, CommercialTrustModule, RelationshipGovernanceModule],
  controllers: [RelationshipController],
  providers: [RelationshipRepository, RelationshipService],
  exports: [RelationshipService, RelationshipRepository],
})
export class RelationshipModule {}
