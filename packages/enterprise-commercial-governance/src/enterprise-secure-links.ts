import { getVenextCanonicalPole, rejectUnknownPoleCreation } from "./venext-canonical-poles";
import type { EnterpriseSecureInvitation } from "./enterprise-governance.types";

const DEFAULT_TTL_MS = 72 * 60 * 60 * 1000;

function randomToken(bytes = 24): string {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const buf = new Uint8Array(bytes);
    crypto.getRandomValues(buf);
    return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  return `tok-${Date.now()}-${Math.random().toString(36).slice(2, 14)}`;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
}

export function generateEnterpriseActivationCode(): string {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `VEN-${n}`;
}

export type SecureLinkResult = {
  invitation: EnterpriseSecureInvitation;
  privateUrl: string;
  activationCode: string;
};

export function buildEnterprisePrivateUrl(
  enterpriseId: string,
  poleId: string,
  secureSlug: string,
  baseHost = "venext.co",
): string {
  const ent = slugify(enterpriseId);
  const pole = slugify(poleId);
  return `https://${baseHost}/e/${ent}/${pole}/${secureSlug}`;
}

export function generateEnterpriseSecureLink(input: {
  enterpriseId: string;
  poleId: string;
  ttlMs?: number;
  baseHost?: string;
}): SecureLinkResult {
  rejectUnknownPoleCreation(input.poleId);
  const pole = getVenextCanonicalPole(input.poleId)!;
  const token = randomToken();
  const secureSlug = randomToken(12);
  const activationCode = generateEnterpriseActivationCode();
  const expiresAt = new Date(Date.now() + (input.ttlMs ?? DEFAULT_TTL_MS)).toISOString();

  const invitation: EnterpriseSecureInvitation = {
    token,
    enterpriseId: input.enterpriseId,
    poleId: input.poleId,
    poleLabel: pole.label,
    activationCode,
    expiresAt,
  };

  return {
    invitation,
    privateUrl: buildEnterprisePrivateUrl(input.enterpriseId, input.poleId, secureSlug, input.baseHost),
    activationCode,
  };
}

export function resolveEnterpriseInvitation(
  invitation: EnterpriseSecureInvitation,
  now = Date.now(),
): { ok: boolean; reason?: "expired" | "revoked" | "used" | "invalid" } {
  if (invitation.revokedAt) return { ok: false, reason: "revoked" };
  if (invitation.usedAt) return { ok: false, reason: "used" };
  if (new Date(invitation.expiresAt).getTime() < now) return { ok: false, reason: "expired" };
  if (!assertInvitationPoleValid(invitation.poleId)) return { ok: false, reason: "invalid" };
  return { ok: true };
}

function assertInvitationPoleValid(poleId: string): boolean {
  try {
    rejectUnknownPoleCreation(poleId);
    return true;
  } catch {
    return false;
  }
}

export function invalidateEnterpriseInvitation(invitation: EnterpriseSecureInvitation): EnterpriseSecureInvitation {
  return { ...invitation, revokedAt: new Date().toISOString() };
}
