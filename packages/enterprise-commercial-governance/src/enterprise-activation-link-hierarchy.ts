import type { EnterpriseCommercialChannel, EnterpriseSecureInvitation } from "./enterprise-governance.types";
import {
  getEnterpriseChannel,
  listInvitationsForEnterprise,
  saveInvitation,
} from "./enterprise-governance-storage";
import { invalidateEnterpriseInvitation } from "./enterprise-secure-links";
import {
  assertEnterprisePoleCompatibility,
  assertInvitationActorConsistency,
} from "./enterprise-pole-compatibility";
import {
  normalizeGrossisteAPoleKey,
  poleSlugForBusinessPole,
  type GrossisteACanonicalPole,
} from "./grossiste-a-canonical-poles";
import { revokeAllEnterpriseInvitations } from "./enterprise-invitation-governance";

export type ActivationLinkKind = "enterprise" | "pole" | "collaborator";

export type ActivationLinkRecord = {
  kind: ActivationLinkKind;
  enterpriseId: string;
  enterpriseSlug: string;
  poleId?: string;
  poleSlug?: string;
  poleBusinessKey?: GrossisteACanonicalPole;
  internalUserId?: string;
  secureToken: string;
  parentToken?: string;
  url: string;
  signature: string;
  revokedAt?: string;
};

const links = new Map<string, ActivationLinkRecord>();

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
}

function randomToken(bytes = 16): string {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const buf = new Uint8Array(bytes);
    crypto.getRandomValues(buf);
    return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  return `tok-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function signLinkPayload(parts: string[]): string {
  const raw = parts.join("|");
  let h = 0;
  for (let i = 0; i < raw.length; i++) h = (h * 31 + raw.charCodeAt(i)) >>> 0;
  return `sig-${h.toString(16)}`;
}

function privateUrl(enterpriseSlug: string, poleSlug: string, secureToken: string, baseHost = "venext.co"): string {
  return `https://${baseHost}/e/${enterpriseSlug}/${poleSlug}/${secureToken}`;
}

export function buildEnterpriseRootLink(input: {
  enterpriseId: string;
  actorKind: "producteur" | "grossiste_a";
  baseHost?: string;
}): ActivationLinkRecord {
  const channel = getEnterpriseChannel(input.enterpriseId);
  if (!channel) throw new Error("ENTERPRISE_CHANNEL_NOT_FOUND");
  if (channel.actorKind !== input.actorKind) throw new Error("ENTERPRISE_ACTOR_MISMATCH");

  const enterpriseSlug = slugify(input.enterpriseId);
  const secureToken = randomToken(20);
  const record: ActivationLinkRecord = {
    kind: "enterprise",
    enterpriseId: input.enterpriseId,
    enterpriseSlug,
    secureToken,
    url: `https://${input.baseHost ?? "venext.co"}/e/${enterpriseSlug}`,
    signature: signLinkPayload([input.enterpriseId, "enterprise", secureToken]),
  };
  links.set(record.secureToken, record);
  return record;
}

export function buildPoleActivationLink(input: {
  enterpriseId: string;
  poleId: string;
  parentEnterpriseToken: string;
  baseHost?: string;
}): ActivationLinkRecord {
  const parent = links.get(input.parentEnterpriseToken);
  assertEnterpriseLinkIntegrity(parent, input.enterpriseId);

  const channel = getEnterpriseChannel(input.enterpriseId)!;
  const businessKey = normalizeGrossisteAPoleKey(input.poleId);
  if (channel.actorKind === "grossiste_a") {
    assertEnterprisePoleCompatibility("grossiste_a", input.poleId, input.enterpriseId);
  }

  const poleSlug = businessKey ? poleSlugForBusinessPole(businessKey) : slugify(input.poleId);
  const secureToken = randomToken(18);
  const record: ActivationLinkRecord = {
    kind: "pole",
    enterpriseId: input.enterpriseId,
    enterpriseSlug: parent!.enterpriseSlug,
    poleId: input.poleId,
    poleSlug,
    poleBusinessKey: businessKey ?? undefined,
    secureToken,
    parentToken: parent!.secureToken,
    url: privateUrl(parent!.enterpriseSlug, poleSlug, secureToken, input.baseHost),
    signature: signLinkPayload([input.enterpriseId, input.poleId, secureToken]),
  };
  links.set(record.secureToken, record);
  return record;
}

export function buildCollaboratorInvitationLink(input: {
  enterpriseId: string;
  poleId: string;
  internalUserId: string;
  parentPoleToken: string;
  invitation: EnterpriseSecureInvitation;
  baseHost?: string;
}): ActivationLinkRecord {
  const parent = links.get(input.parentPoleToken);
  assertPoleLinkIntegrity(parent, input.enterpriseId, input.poleId);

  const channel = getEnterpriseChannel(input.enterpriseId)!;
  assertInvitationActorConsistency(input.invitation, channel);

  const secureToken = randomToken(18);
  const record: ActivationLinkRecord = {
    kind: "collaborator",
    enterpriseId: input.enterpriseId,
    enterpriseSlug: parent!.enterpriseSlug,
    poleId: input.poleId,
    poleSlug: parent!.poleSlug,
    poleBusinessKey: parent!.poleBusinessKey,
    internalUserId: input.internalUserId,
    secureToken,
    parentToken: parent!.secureToken,
    url: privateUrl(parent!.enterpriseSlug, parent!.poleSlug!, secureToken, input.baseHost),
    signature: signLinkPayload([
      input.enterpriseId,
      input.poleId,
      input.internalUserId,
      secureToken,
    ]),
  };
  links.set(record.secureToken, record);
  saveInvitation({ ...input.invitation, token: input.invitation.token || secureToken });
  return record;
}

export function assertEnterpriseLinkIntegrity(
  link: ActivationLinkRecord | undefined,
  enterpriseId: string,
): asserts link is ActivationLinkRecord {
  if (!link || link.kind !== "enterprise" || link.enterpriseId !== enterpriseId) {
    throw new Error("ENTERPRISE_LINK_INTEGRITY_FAILED");
  }
  if (link.revokedAt) throw new Error("ENTERPRISE_LINK_REVOKED");
}

export function assertPoleLinkIntegrity(
  link: ActivationLinkRecord | undefined,
  enterpriseId: string,
  poleId: string,
): asserts link is ActivationLinkRecord {
  if (!link || link.kind !== "pole" || link.enterpriseId !== enterpriseId || link.poleId !== poleId) {
    throw new Error("POLE_LINK_INTEGRITY_FAILED");
  }
  if (link.revokedAt) throw new Error("POLE_LINK_REVOKED");
  if (!link.parentToken) throw new Error("POLE_LINK_MISSING_PARENT");
}

export function assertInvitationHierarchy(
  invitation: EnterpriseSecureInvitation,
  channel: EnterpriseCommercialChannel,
): void {
  if (invitation.enterpriseId !== channel.enterpriseId) {
    throw new Error("INVITATION_ENTERPRISE_MISMATCH");
  }
  assertInvitationActorConsistency(invitation, channel);
}

/** Révocation cascade entreprise → pôles → utilisateurs (Instruction 20.86-E). */
export function revokeActivationLinkCascade(enterpriseId: string): number {
  let count = 0;
  for (const [token, link] of links) {
    if (link.enterpriseId === enterpriseId && !link.revokedAt) {
      links.set(token, { ...link, revokedAt: new Date().toISOString() });
      count += 1;
    }
  }
  count += revokeAllEnterpriseInvitations(enterpriseId);
  return count;
}

export function getActivationLink(token: string): ActivationLinkRecord | undefined {
  return links.get(token);
}

export function resetActivationLinkRegistry(): void {
  links.clear();
}
