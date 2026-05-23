import type { CommerceAccessContext } from "./commerce-access-control.types";
import { buildAccessContext, type BuildAccessContextInput } from "./commerce-access-control-context";

/** Message utilisateur — jamais Forbidden/Unauthorized (Instruction 20.86-E1). */
export const MESSAGING_SUSPENDED_UX =
  "Cet accès n’est pas disponible actuellement. Veuillez contacter le service compétent si nécessaire.";

export type MessagingParticipantStatus = "ACTIVE" | "SUSPENDED";

export type MessagingAccessRuntimeState = {
  offlineInvalidated: boolean;
  routingInvalidated: boolean;
  suspendLog: ReadonlyArray<Readonly<Record<string, unknown>>>;
};

let runtimeState: MessagingAccessRuntimeState = {
  offlineInvalidated: false,
  routingInvalidated: false,
  suspendLog: [],
};

export function resetCommerceAccessTestState(): void {
  runtimeState = {
    offlineInvalidated: false,
    routingInvalidated: false,
    suspendLog: [],
  };
}

export function invalidateMessagingAccessRuntime(): void {
  runtimeState = {
    ...runtimeState,
    offlineInvalidated: true,
    routingInvalidated: true,
  };
}

export function getMessagingAccessRuntimeState(): Readonly<MessagingAccessRuntimeState> {
  return runtimeState;
}

export function normalizeParticipantStatus(raw: unknown): MessagingParticipantStatus | undefined {
  if (raw === "ACTIVE" || raw === "SUSPENDED") return raw;
  if (typeof raw === "string") {
    const u = raw.trim().toUpperCase();
    if (u === "ACTIVE") return "ACTIVE";
    if (u === "SUSPENDED") return "SUSPENDED";
  }
  return undefined;
}

export function isParticipantSuspended(status: unknown): boolean {
  return normalizeParticipantStatus(status) === "SUSPENDED";
}

export function logMessagingAccessBlockedSuspended(entry: Record<string, unknown>): void {
  runtimeState = {
    ...runtimeState,
    suspendLog: Object.freeze([
      ...runtimeState.suspendLog,
      Object.freeze({
        ...entry,
        at: new Date().toISOString(),
        code: "MESSAGING_ACCESS_BLOCKED_SUSPENDED",
      }),
    ]),
  };
}

export function freezeMessagingAccessContext(
  ctx: CommerceAccessContext,
): Readonly<CommerceAccessContext> {
  const participantStatus = normalizeParticipantStatus(ctx.participantStatus);
  const frozen = Object.freeze({
    ...ctx,
    participantStatus,
    flags: Object.freeze({ ...(ctx.flags ?? {}) }),
  });
  return frozen;
}

export function buildSafeMessagingAccessContext(
  input: BuildAccessContextInput,
): Readonly<CommerceAccessContext> {
  return freezeMessagingAccessContext(
    buildAccessContext({
      ...input,
      participantStatus: normalizeParticipantStatus(input.participantStatus),
    }),
  );
}

export type MessagingGuardBlockReason =
  | "participant_suspended"
  | "access_revoked"
  | "relation_inactive";

export type MessagingGuardPipelineResult =
  | { allowed: true }
  | { allowed: false; reason: MessagingGuardBlockReason; userMessage: string };

/** Ordre obligatoire : suspension → révocation runtime → relation → (permissions via caller). */
export function evaluateMessagingGuardPriority(
  ctx: Pick<
    CommerceAccessContext,
    "participantStatus" | "relationshipStatus" | "relationshipId" | "organizationId"
  >,
  meta?: { route?: string; actor?: string },
): MessagingGuardPipelineResult {
  const participantStatus = normalizeParticipantStatus(ctx.participantStatus);

  if (participantStatus === "SUSPENDED") {
    logMessagingAccessBlockedSuspended({
      actor: meta?.actor ?? ctx.organizationId,
      participant: ctx.organizationId,
      relationship: ctx.relationshipId,
      route: meta?.route,
    });
    return { allowed: false, reason: "participant_suspended", userMessage: MESSAGING_SUSPENDED_UX };
  }

  if (runtimeState.offlineInvalidated || runtimeState.routingInvalidated) {
    return { allowed: false, reason: "access_revoked", userMessage: MESSAGING_SUSPENDED_UX };
  }

  if (ctx.relationshipStatus === "REMOVED" || ctx.relationshipStatus === "SUSPENDED") {
    return { allowed: false, reason: "relation_inactive", userMessage: MESSAGING_SUSPENDED_UX };
  }

  return { allowed: true };
}
