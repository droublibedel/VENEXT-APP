import { listAllGovernanceHistory } from "./enterprise-governance-history";
import {
  getEnterpriseChannel,
  listCollaboratorsByEnterprise,
  listInvitationsForEnterprise,
  listTrustedDevices,
} from "./enterprise-governance-storage";
import { listSessionsForEnterprise } from "./enterprise-security-sessions";
import { resolveEnterpriseInvitation } from "./enterprise-secure-links";
import { compareActorPoleAccess } from "./grossiste-a-producer-separation";
import { isEnterpriseRouteIndexable } from "./enterprise-private-routes";

export type EnterpriseGovernanceAuditIssue = {
  code: string;
  enterpriseId?: string;
  detail: string;
};

export function auditEnterpriseGovernanceIntegrity(enterpriseIds: string[]): {
  ok: boolean;
  issues: EnterpriseGovernanceAuditIssue[];
} {
  const issues: EnterpriseGovernanceAuditIssue[] = [];

  for (const enterpriseId of enterpriseIds) {
    const channel = getEnterpriseChannel(enterpriseId);
    if (!channel) {
      issues.push({ code: "missing_channel", enterpriseId, detail: "Canal entreprise absent" });
      continue;
    }

    if (channel.actorKind === "grossiste_a") {
      for (const inv of listInvitationsForEnterprise(enterpriseId)) {
        const cmp = compareActorPoleAccess("GROSSISTE_A", inv.poleId);
        if (!cmp.allowed) {
          issues.push({
            code: "incompatible_pole",
            enterpriseId,
            detail: `Invitation pôle incompatible: ${inv.poleId}`,
          });
        }
      }
    }

    for (const inv of listInvitationsForEnterprise(enterpriseId)) {
      const check = resolveEnterpriseInvitation(inv);
      if (!check.ok && !inv.revokedAt) {
        issues.push({
          code: "invalid_invitation",
          enterpriseId,
          detail: `Invitation ${inv.token.slice(0, 8)}… ${check.reason}`,
        });
      }
    }

    const activeSessions = listSessionsForEnterprise(enterpriseId).filter((s) => !s.locked);
    const archivedUsers = listCollaboratorsByEnterprise(enterpriseId).filter(
      (c) => c.status === "ARCHIVED" || c.status === "SUSPENDED",
    );
    for (const user of archivedUsers) {
      const ghost = activeSessions.filter((s) => s.internalEnterpriseUserId === user.internalEnterpriseUserId);
      if (ghost.length > 0) {
        issues.push({
          code: "residual_session",
          enterpriseId,
          detail: `Sessions actives pour utilisateur ${user.status}: ${user.internalEnterpriseUserId}`,
        });
      }
    }

    const devices = listTrustedDevices(enterpriseId);
    const fingerprints = new Set<string>();
    for (const d of devices) {
      if (d.status === "REVOKED") continue;
      if (!d.internalEnterpriseUserId) {
        issues.push({ code: "orphan_device", enterpriseId, detail: `Device sans utilisateur: ${d.id}` });
      }
      if (fingerprints.has(d.fingerprint)) {
        issues.push({ code: "duplicate_device", enterpriseId, detail: `Empreinte dupliquée: ${d.fingerprint}` });
      }
      fingerprints.add(d.fingerprint);
    }

    if (channel.governanceStatus === "ARCHIVED" && activeSessions.length > 0) {
      issues.push({
        code: "archived_with_sessions",
        enterpriseId,
        detail: `${activeSessions.length} session(s) après archivage`,
      });
    }
  }

  const samplePrivate = `https://venext.co/e/${enterpriseIds[0] ?? "ent"}/commercial/x7f9k2`;
  if (isEnterpriseRouteIndexable(samplePrivate)) {
    issues.push({ code: "public_route_risk", detail: "Route privée potentiellement indexable" });
  }

  const history = listAllGovernanceHistory();
  if (history.some((h) => !h.id || !h.createdAt)) {
    issues.push({ code: "history_integrity", detail: "Entrée historique incomplète" });
  }

  return { ok: issues.length === 0, issues };
}
