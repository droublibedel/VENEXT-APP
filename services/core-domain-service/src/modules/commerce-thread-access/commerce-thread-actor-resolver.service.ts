import { ForbiddenException, Injectable } from "@nestjs/common";

import { devAuthBypassEnabled, parseVenextActorFromRequest, type VenextHttpLike } from "../../platform-authz/venext-auth-context";
import type { VenextRequestActor } from "../../platform-authz/venext-authz.types";

export type CommerceThreadResolvedActor = {
  userId: string;
  organizationId: string;
  actorResolvedFrom: "AUTH_CONTEXT" | "DEV_FALLBACK";
};

/**
 * Instruction 20.1A/20.1B — single server authority for commerce actor (never trust body sender fields).
 */
@Injectable()
export class CommerceThreadActorResolver {
  resolveFromRequest(req: VenextHttpLike): CommerceThreadResolvedActor {
    const parsed = parseVenextActorFromRequest(req);
    const headerUser = typeof parsed.userId === "string" && parsed.userId.trim() ? parsed.userId.trim() : undefined;
    const headerOrg =
      typeof parsed.organizationId === "string" && parsed.organizationId.trim()
        ? parsed.organizationId.trim()
        : undefined;

    if (headerUser && headerOrg) {
      return { userId: headerUser, organizationId: headerOrg, actorResolvedFrom: "AUTH_CONTEXT" };
    }

    const devUser = process.env.VENEXT_DEV_CONVERSATION_ACTOR_USER_ID?.trim();
    const devOrg = process.env.VENEXT_DEV_CONVERSATION_ACTOR_ORG_ID?.trim();
    if (devAuthBypassEnabled() && devUser && devOrg) {
      return { userId: devUser, organizationId: devOrg, actorResolvedFrom: "DEV_FALLBACK" };
    }

    throw new ForbiddenException({
      code: "venext_commerce_auth_required",
      detail: "x-venext-user-id and x-venext-acting-organization-id required for commerce-messaging routes",
    });
  }

  assertActorMatchesThreadParticipant(
    actor: VenextRequestActor,
    thread: { buyerOrganizationId: string | null; sellerOrganizationId: string | null },
  ): void {
    const oid = actor.organizationId;
    if (!oid || (oid !== thread.buyerOrganizationId && oid !== thread.sellerOrganizationId)) {
      throw new ForbiddenException({ code: "venext_commerce_thread_actor_not_participant" });
    }
    if (!actor.userId) {
      throw new ForbiddenException({ code: "venext_auth_missing_user" });
    }
  }
}
