import { type CanActivate, type ExecutionContext, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";

import { OrganizationAccessService } from "../../platform-authz/organization-access.service";
import type { VenextHttpLike } from "../../platform-authz/venext-auth-context";
import { PrismaService } from "../../prisma/prisma.service";
import {
  CommerceThreadActorResolver,
  type CommerceThreadResolvedActor,
} from "../commerce-thread-access/commerce-thread-actor-resolver.service";
import { VENEXT_COMMERCE_THREAD_ACTOR_KEY } from "../commerce-thread-access/commerce-thread-participant.guard";

/** Instruction 20.11 — task action routes: buyer/seller on linked fulfillment only. */
@Injectable()
export class RelationalFulfillmentTaskParticipantGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly resolver: CommerceThreadActorResolver,
    private readonly orgAccess: OrganizationAccessService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor }>();
    const taskId = req.params?.taskId;
    if (!taskId || typeof taskId !== "string") {
      throw new ForbiddenException({ code: "relational_fulfillment_missing_task_id" });
    }

    const resolved = this.resolver.resolveFromRequest(req);
    const task = await this.prisma.relationalFulfillmentTask.findUnique({
      where: { id: taskId },
      include: {
        fulfillmentRecord: {
          select: { buyerOrganizationId: true, sellerOrganizationId: true },
        },
      },
    });
    if (!task?.fulfillmentRecord) throw new NotFoundException(taskId);

    const { buyerOrganizationId, sellerOrganizationId } = task.fulfillmentRecord;
    if (resolved.organizationId !== buyerOrganizationId && resolved.organizationId !== sellerOrganizationId) {
      throw new ForbiddenException({ code: "relational_fulfillment_participant_only" });
    }

    await this.orgAccess.assertMemberOrBypass(
      { userId: resolved.userId, organizationId: resolved.organizationId },
      resolved.organizationId,
    );

    req[VENEXT_COMMERCE_THREAD_ACTOR_KEY] = resolved;
    return true;
  }
}
