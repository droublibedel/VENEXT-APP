import { type CanActivate, type ExecutionContext, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";

import { OrganizationAccessService } from "../../platform-authz/organization-access.service";
import type { VenextHttpLike } from "../../platform-authz/venext-auth-context";
import { PrismaService } from "../../prisma/prisma.service";
import { CommerceThreadActorResolver, type CommerceThreadResolvedActor } from "./commerce-thread-actor-resolver.service";

export const VENEXT_COMMERCE_THREAD_ACTOR_KEY = "venextCommerceThreadActor" as const;

/** Instruction 20.1B — thread-scoped commerce routes (read/write participant + membership). */
@Injectable()
export class CommerceThreadParticipantGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly resolver: CommerceThreadActorResolver,
    private readonly orgAccess: OrganizationAccessService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor }>();
    const threadId = req.params?.threadId;
    if (!threadId || typeof threadId !== "string") {
      throw new ForbiddenException({ code: "venext_commerce_missing_thread" });
    }

    const resolved = this.resolver.resolveFromRequest(req);
    const thread = await this.prisma.messageThread.findUnique({
      where: { id: threadId },
      select: { id: true, buyerOrganizationId: true, sellerOrganizationId: true },
    });
    if (!thread) throw new NotFoundException(threadId);

    this.resolver.assertActorMatchesThreadParticipant(
      { userId: resolved.userId, organizationId: resolved.organizationId },
      thread,
    );
    await this.orgAccess.assertMemberOrBypass(
      { userId: resolved.userId, organizationId: resolved.organizationId },
      resolved.organizationId,
    );

    req[VENEXT_COMMERCE_THREAD_ACTOR_KEY] = resolved;
    return true;
  }
}

/** Instruction 20.1B — resolves commerce actor from headers only (no thread param). */
@Injectable()
export class CommerceMessagingActorGuard implements CanActivate {
  constructor(
    private readonly resolver: CommerceThreadActorResolver,
    private readonly orgAccess: OrganizationAccessService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor }>();
    const resolved = this.resolver.resolveFromRequest(req);
    await this.orgAccess.assertMemberOrBypass(
      { userId: resolved.userId, organizationId: resolved.organizationId },
      resolved.organizationId,
    );
    req[VENEXT_COMMERCE_THREAD_ACTOR_KEY] = resolved;
    return true;
  }
}
