import type { EnterpriseSecureInvitation } from "./enterprise-governance.types";
import {
  getEnterpriseChannel,
  getInvitation,
  listInvitationsForEnterprise,
  saveInvitation,
} from "./enterprise-governance-storage";
import {
  invalidateEnterpriseInvitation,
  resolveEnterpriseInvitation,
} from "./enterprise-secure-links";
import { assertEnterprisePoleCompatibility } from "./enterprise-pole-compatibility";

export class EnterpriseInvitationReuseError extends Error {
  constructor(reason: string) {
    super(`ENTERPRISE_INVITATION_BLOCKED:${reason}`);
    this.name = "EnterpriseInvitationReuseError";
  }
}

export function revokeEnterpriseInvitation(token: string): EnterpriseSecureInvitation | undefined {
  const row = getInvitation(token);
  if (!row) return undefined;
  const revoked = invalidateEnterpriseInvitation(row);
  saveInvitation(revoked);
  return revoked;
}

export function revokeAllEnterpriseInvitations(enterpriseId: string): number {
  const rows = listInvitationsForEnterprise(enterpriseId);
  let count = 0;
  for (const inv of rows) {
    if (!inv.revokedAt) {
      saveInvitation(invalidateEnterpriseInvitation(inv));
      count += 1;
    }
  }
  return count;
}

export function invalidateExpiredInvitation(token: string): EnterpriseSecureInvitation | undefined {
  const row = getInvitation(token);
  if (!row) return undefined;
  const check = resolveEnterpriseInvitation(row);
  if (check.reason === "expired") {
    const revoked = invalidateEnterpriseInvitation(row);
    saveInvitation(revoked);
    return revoked;
  }
  return row;
}

export function markEnterpriseInvitationUsed(token: string): EnterpriseSecureInvitation {
  const row = getInvitation(token);
  if (!row) throw new EnterpriseInvitationReuseError("missing");
  const check = resolveEnterpriseInvitation(row);
  if (!check.ok) throw new EnterpriseInvitationReuseError(check.reason ?? "invalid");
  assertInvitationScopeLocked(row);
  const used = { ...row, usedAt: new Date().toISOString() };
  saveInvitation(used);
  return used;
}

/** Une invitation = une entreprise, un pôle, un collaborateur (Instruction 20.86-D). */
export function assertInvitationScopeLocked(invitation: EnterpriseSecureInvitation): void {
  if (!invitation.enterpriseId?.trim() || !invitation.poleId?.trim()) {
    throw new EnterpriseInvitationReuseError("scope");
  }
  const channel = getEnterpriseChannel(invitation.enterpriseId);
  const actorKind = channel?.actorKind ?? "producteur";
  assertEnterprisePoleCompatibility(actorKind, invitation.poleId, invitation.enterpriseId);
}

export function assertInvitationNotReused(token: string): void {
  const row = getInvitation(token);
  if (!row) throw new EnterpriseInvitationReuseError("missing");
  const check = resolveEnterpriseInvitation(row);
  if (!check.ok) throw new EnterpriseInvitationReuseError(check.reason ?? "invalid");
}
