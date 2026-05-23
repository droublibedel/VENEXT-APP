import { Controller, Get, Param, ParseUUIDPipe } from "@nestjs/common";
import { OrganizationsService } from "./organizations.service";

@Controller("organizations")
export class OrganizationsController {
  constructor(private readonly orgs: OrganizationsService) {}

  @Get()
  list() {
    return this.orgs.findAll();
  }

  @Get(":id")
  get(@Param("id", ParseUUIDPipe) id: string) {
    return this.orgs.findOne(id);
  }
}
