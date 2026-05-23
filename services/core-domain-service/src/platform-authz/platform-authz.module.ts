import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { OrganizationAccessService } from "./organization-access.service";
import { RelationshipAccessService } from "./relationship-access.service";
import { VenextAuthzGuard } from "./venext-authz.guard";

@Module({
  imports: [PrismaModule],
  providers: [OrganizationAccessService, RelationshipAccessService, VenextAuthzGuard],
  exports: [OrganizationAccessService, RelationshipAccessService, VenextAuthzGuard],
})
export class PlatformAuthzModule {}
