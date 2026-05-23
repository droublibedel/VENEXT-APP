import { Controller, Get, Param, ParseUUIDPipe } from "@nestjs/common";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  list() {
    return this.users.findAll();
  }

  @Get(":id")
  get(@Param("id", ParseUUIDPipe) id: string) {
    return this.users.findOne(id);
  }
}
