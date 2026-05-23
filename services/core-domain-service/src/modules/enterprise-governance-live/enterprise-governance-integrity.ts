import type { EnterpriseGovernanceLiveService } from "./enterprise-governance-live.service";

export type GovernanceIntegrityIssue = {
  code: string;
  detail: string;
  enterpriseId?: string;
  entityId?: string;
};

export type GovernanceIntegrityReport = {
  ok: boolean;
  issues: GovernanceIntegrityIssue[];
};

export async function auditEnterpriseLiveGovernanceIntegrity(
  svc: EnterpriseGovernanceLiveService,
): Promise<GovernanceIntegrityReport> {
  const issues: GovernanceIntegrityIssue[] = [];
  const channels = await svc.listEnterpriseChannels();

  for (const ch of channels) {
    const enterpriseId = ch.enterpriseId;
    const contracts = await svc.listContractDocuments(enterpriseId);
    if (contracts.length === 0) {
      issues.push({
        code: "channel_without_contract",
        detail: "Canal sans document contrat",
        enterpriseId,
      });
    }

    const poles = await svc.listPoleActivations(enterpriseId);
    for (const pole of poles) {
      if (pole.enterpriseId !== enterpriseId) {
        issues.push({
          code: "pole_enterprise_mismatch",
          detail: "Pôle rattaché à une autre entreprise",
          enterpriseId,
          entityId: pole.id,
        });
      }
    }

    const invitations = await svc.listEnterpriseInvitations(enterpriseId);
    for (const inv of invitations) {
      if (!poles.some((p) => p.poleId === inv.poleId)) {
        issues.push({
          code: "invitation_without_pole",
          detail: "Invitation sans pôle activé correspondant",
          enterpriseId,
          entityId: inv.token,
        });
      }
    }

    const collaborators = await svc.listCollaborators(enterpriseId);
    for (const col of collaborators) {
      if (col.status === "ACTIVE" && !invitations.some((i) => i.poleId === col.poleId)) {
        issues.push({
          code: "collaborator_without_invitation_trail",
          detail: "Collaborateur actif sans invitation liée au pôle",
          enterpriseId,
          entityId: col.internalEnterpriseUserId,
        });
      }
    }

    const devices = await svc.listTrustedDevices(enterpriseId);
    for (const d of devices) {
      if (d.status === "APPROVED" && ch.governanceStatus === "ARCHIVED") {
        issues.push({
          code: "trusted_device_orphan_channel_archived",
          detail: "Device approuvé sur canal archivé",
          enterpriseId,
          entityId: d.id,
        });
      }
    }

    const history = await svc.listGovernanceHistory(enterpriseId);
    if (history.length === 0 && ch.governanceStatus !== "DRAFT") {
      issues.push({
        code: "missing_governance_history",
        detail: "Historique gouvernance absent",
        enterpriseId,
      });
    }

    if (ch.governanceStatus === "ACTIVE" && ch.activationStatus === "ARCHIVED") {
      issues.push({
        code: "incoherent_channel_status",
        detail: "governanceStatus ACTIVE avec activationStatus ARCHIVED",
        enterpriseId,
      });
    }
  }

  return { ok: issues.length === 0, issues };
}
