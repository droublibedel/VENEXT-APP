import { Module } from "@nestjs/common";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { CommerceThreadActorResolver } from "./commerce-thread-actor-resolver.service";
import { CommerceMessagingActorGuard, CommerceThreadParticipantGuard } from "./commerce-thread-participant.guard";
import { CommerceThreadAccessPolicy } from "./commerce-thread-access.policy";
import { NegotiationParticipantGuard } from "./negotiation-participant.guard";
import { SponsoredNegotiationAccessService } from "./sponsored-negotiation-access.service";

@Module({
  imports: [PrismaModule, PlatformAuthzModule],
  providers: [
    CommerceThreadActorResolver,
    CommerceThreadParticipantGuard,
    CommerceMessagingActorGuard,
    NegotiationParticipantGuard,
    CommerceThreadAccessPolicy,
    SponsoredNegotiationAccessService,
  ],
  exports: [
    CommerceThreadActorResolver,
    CommerceThreadParticipantGuard,
    CommerceMessagingActorGuard,
    NegotiationParticipantGuard,
    CommerceThreadAccessPolicy,
    SponsoredNegotiationAccessService,
  ],
})
export class CommerceThreadAccessModule {}
