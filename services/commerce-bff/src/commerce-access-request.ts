import type { Request } from "express";
import {
  buildAccessContext,
  evaluateMessagingGuardPriority,
  guardBackendRoute,
  isBackendAccessGuardEnabled,
  normalizeParticipantStatus,
  type CommerceAccessContext,
  type CommerceAccessResource,
} from "commerce-access-control";

function mapActorRole(raw: string): CommerceAccessContext["actorRole"] {
  const u = raw.toUpperCase();
  if (u.includes("PRODUCER") || u === "PRODUCTEUR") return "PRODUCER";
  if (u.includes("GROSSISTE_A")) return "GROSSISTE_A";
  if (u.includes("DETAIL")) return "DETAILLANT";
  return "GROSSISTE_B";
}

export function accessContextFromRequest(req: Request): CommerceAccessContext {
  const viewerOrg = String(req.headers["x-organization-id"] ?? req.query.organizationId ?? "");
  const queryOrg = String(req.query.organizationId ?? "");
  const relationshipId = String(req.query.relationshipId ?? "");
  const relationshipStatus = String(req.query.relationshipStatus ?? "ACTIVE") as CommerceAccessContext["relationshipStatus"];
  const actorRole = mapActorRole(String(req.query.actorRole ?? req.headers["x-actor-role"] ?? "GROSSISTE_B"));
  const participantStatus = normalizeParticipantStatus(
    req.headers["x-participant-status"] ?? req.query.participantStatus,
  );
  return buildAccessContext({
    actorRole,
    organizationId: viewerOrg,
    relationshipId: relationshipId || undefined,
    relationshipStatus,
    participantStatus,
    partnerOrganizationId: String(req.headers["x-viewer-organization-id"] ?? queryOrg),
    catalogVisibility: relationshipId ? "RELATION_ONLY" : undefined,
    walletOwnerOrganizationId: queryOrg || viewerOrg,
    flags: {
      commerce_access_control_enabled: process.env.COMMERCE_ACCESS_CONTROL !== "false",
      commerce_visibility_guard_enabled: process.env.COMMERCE_VISIBILITY_GUARD !== "false",
      commerce_backend_access_guard_enabled: process.env.COMMERCE_BACKEND_ACCESS_GUARD !== "false",
    },
  });
}

export function evaluateBffAccess(
  req: Request,
  resource: CommerceAccessResource,
): { allowed: boolean; userMessage?: string } {
  const ctx = accessContextFromRequest(req);
  if (resource === "messaging" || resource === "mail") {
    const priority = evaluateMessagingGuardPriority(ctx, { route: resource });
    if (!priority.allowed) {
      return { allowed: false, userMessage: priority.userMessage };
    }
  }
  if (!isBackendAccessGuardEnabled(ctx.flags ?? {})) {
    return { allowed: true };
  }
  const requestedOrg = String(req.query.organizationId ?? req.headers["x-organization-id"] ?? "");
  const decision = guardBackendRoute(ctx, resource, requestedOrg);
  return { allowed: decision.allowed, userMessage: decision.userMessage };
}
