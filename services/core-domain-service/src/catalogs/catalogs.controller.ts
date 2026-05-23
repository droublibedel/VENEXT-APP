import { Controller, Get, Param, ParseUUIDPipe, Query } from "@nestjs/common";
import { CatalogsService } from "./catalogs.service";

@Controller("catalogs")
export class CatalogsController {
  constructor(private readonly catalogs: CatalogsService) {}

  @Get()
  list(@Query("organizationId") organizationId?: string) {
    return this.catalogs.findAll(organizationId);
  }

  @Get(":id")
  get(@Param("id", ParseUUIDPipe) id: string) {
    return this.catalogs.findOne(id);
  }
}
