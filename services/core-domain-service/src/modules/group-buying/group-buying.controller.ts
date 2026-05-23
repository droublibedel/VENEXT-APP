import { Controller, Get, Param, ParseUUIDPipe, Query } from "@nestjs/common";
import { GroupBuyingStatus } from "@prisma/client";
import { GroupBuyingService } from "./group-buying.service";

@Controller("group-buying")
export class GroupBuyingController {
  constructor(private readonly sessions: GroupBuyingService) {}

  @Get("sessions")
  list(
    @Query("relationshipId") relationshipId?: string,
    @Query("status") status?: GroupBuyingStatus,
  ) {
    return this.sessions.listSessions({ relationshipId, status });
  }

  @Get("sessions/:id")
  one(@Param("id", ParseUUIDPipe) id: string) {
    return this.sessions.getSession(id);
  }
}
