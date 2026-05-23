import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Headers,
  NotFoundException,
  Post,
  UnauthorizedException,
} from "@nestjs/common";

import type { CommerceThreadResolvedActor } from "../commerce-thread-access/commerce-thread-actor-resolver.service";
import { CommerceThreadAccessPolicy } from "../commerce-thread-access/commerce-thread-access.policy";

/**
 * Instruction 20.1B — gateway → core validation for commerce WebSocket subscribe (no DB in gateway).
 */
@Controller("internal/commerce-messaging")
export class InternalCommerceThreadWsController {
  constructor(private readonly policy: CommerceThreadAccessPolicy) {}

  @Post("ws-subscribe-validate")
  async validate(
    @Headers("x-venext-internal-key") key: string | undefined,
    @Body() body: { threadId: string; userId: string; organizationId: string },
  ) {
    const expect = process.env.VENEXT_INTERNAL_REALTIME_KEY?.trim();
    if (!expect || key !== expect) {
      throw new UnauthorizedException();
    }
    const threadId = body.threadId?.trim();
    const userId = body.userId?.trim();
    const organizationId = body.organizationId?.trim();
    if (!threadId || !userId || !organizationId) {
      return {
        authorized: false,
        realtimeAuthorizationValidated: true,
        wsThreadScopeValidated: false,
        actorResolvedFrom: "AUTH_CONTEXT" as const,
        bodyActorTrusted: false as const,
        threadMembershipValidated: false,
        threadWriteValidated: false,
        commercialConsistencyValidated: false,
        rejectedByThreadAccessCount: 1,
        rejectedByOrganizationMismatch: 0,
        rejectedByRelationshipMismatch: 0,
      };
    }
    const actor: CommerceThreadResolvedActor = {
      userId,
      organizationId,
      actorResolvedFrom: "AUTH_CONTEXT",
    };
    try {
      const diagnostics = await this.policy.assertCanReadThread(actor, threadId);
      return {
        authorized: true,
        realtimeAuthorizationValidated: true,
        wsThreadScopeValidated: diagnostics.threadMembershipValidated && diagnostics.commercialConsistencyValidated,
        ...diagnostics,
      };
    } catch (e) {
      if (e instanceof ForbiddenException || e instanceof NotFoundException || e instanceof BadRequestException) {
        return {
          authorized: false,
          realtimeAuthorizationValidated: true,
          wsThreadScopeValidated: false,
          actorResolvedFrom: actor.actorResolvedFrom,
          bodyActorTrusted: false as const,
          threadMembershipValidated: false,
          threadWriteValidated: false,
          commercialConsistencyValidated: false,
          rejectedByThreadAccessCount: 1,
          rejectedByOrganizationMismatch: e instanceof ForbiddenException ? 1 : 0,
          rejectedByRelationshipMismatch: 0,
        };
      }
      throw e;
    }
  }
}
