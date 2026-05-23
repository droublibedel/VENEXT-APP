import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { VenextAuthz } from "../../platform-authz/venext-authz.decorators";
import { VenextAuthzGuard } from "../../platform-authz/venext-authz.guard";
import {
  InviteByCommercialIdDtoSchema,
  RelationshipDecisionDtoSchema,
  RelationshipInviteDtoSchema,
} from "@venext/shared-contracts";
import { RelationshipService } from "./relationship.service";

@Controller("relationships")
@UseGuards(VenextAuthzGuard)
export class RelationshipController {
  constructor(private readonly relationships: RelationshipService) {}

  @Post("invite")
  invite(@Body() body: unknown) {
    const dto = RelationshipInviteDtoSchema.parse(body);
    return this.relationships.invite(dto);
  }

  @Post("invite-by-commercial-id")
  inviteByCommercialId(@Body() body: unknown) {
    const dto = InviteByCommercialIdDtoSchema.parse(body);
    return this.relationships.inviteByCommercialId(dto);
  }

  @Get("received/:organizationId")
  @VenextAuthz({ type: "orgRoute", orgParam: "organizationId" })
  received(@Param("organizationId", ParseUUIDPipe) organizationId: string) {
    return this.relationships.listReceived(organizationId);
  }

  @Get("sent/:organizationId")
  @VenextAuthz({ type: "orgRoute", orgParam: "organizationId" })
  sent(@Param("organizationId", ParseUUIDPipe) organizationId: string) {
    return this.relationships.listSent(organizationId);
  }

  @Get("active/:organizationId")
  @VenextAuthz({ type: "orgRoute", orgParam: "organizationId" })
  active(@Param("organizationId", ParseUUIDPipe) organizationId: string) {
    return this.relationships.listActive(organizationId);
  }

  @Patch(":relationshipId/accept")
  @VenextAuthz({ type: "relationshipRoute" })
  accept(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Body() body: unknown,
    @Query("actingOrganizationId", ParseUUIDPipe) actingOrganizationId: string,
  ) {
    const dto = RelationshipDecisionDtoSchema.parse(body);
    return this.relationships.accept(
      relationshipId,
      dto,
      actingOrganizationId,
    );
  }

  @Patch(":relationshipId/reject")
  @VenextAuthz({ type: "relationshipRoute" })
  reject(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("actingOrganizationId", ParseUUIDPipe) actingOrganizationId: string,
  ) {
    return this.relationships.reject(relationshipId, actingOrganizationId);
  }

  @Patch(":relationshipId/block")
  @VenextAuthz({ type: "relationshipRoute" })
  block(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("actingOrganizationId", ParseUUIDPipe) actingOrganizationId: string,
  ) {
    return this.relationships.block(relationshipId, actingOrganizationId);
  }

  @Get(":relationshipId/profile-preview")
  @VenextAuthz({ type: "relationshipRoute" })
  preview(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("viewerOrganizationId", ParseUUIDPipe) viewerOrganizationId: string,
  ) {
    return this.relationships.profilePreview(
      relationshipId,
      viewerOrganizationId,
    );
  }

  @Get(":id")
  @VenextAuthz({ type: "relationshipRoute", relationshipParam: "id" })
  get(@Param("id", ParseUUIDPipe) id: string) {
    return this.relationships.findOne(id);
  }
}
