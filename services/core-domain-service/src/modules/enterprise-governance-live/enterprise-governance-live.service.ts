import { Injectable } from "@nestjs/common";

import {
  EnterpriseChannelRepository,
  EnterpriseCollaboratorRepository,
  EnterpriseContractDocumentRepository,
  EnterpriseGovernanceHistoryRepository,
  EnterpriseInvitationRepository,
  EnterprisePoleActivationRepository,
  EnterpriseSecurityAlertRepository,
  EnterpriseTrustedDeviceRepository,
} from "./repositories/enterprise-governance.repositories";
import {
  resolveEnterpriseGovernancePersistenceMode,
  type EnterpriseGovernancePersistenceMode,
} from "./enterprise-governance.persistence-mode";

export type EnterpriseGovernanceEnvelopeMeta = {
  dataSource: EnterpriseGovernancePersistenceMode;
  persistenceMode: EnterpriseGovernancePersistenceMode;
  fallbackUsed: boolean;
};

@Injectable()
export class EnterpriseGovernanceLiveService {
  constructor(
    private readonly channels: EnterpriseChannelRepository,
    private readonly poles: EnterprisePoleActivationRepository,
    private readonly invitations: EnterpriseInvitationRepository,
    private readonly collaborators: EnterpriseCollaboratorRepository,
    private readonly devices: EnterpriseTrustedDeviceRepository,
    private readonly alerts: EnterpriseSecurityAlertRepository,
    private readonly history: EnterpriseGovernanceHistoryRepository,
    private readonly contracts: EnterpriseContractDocumentRepository,
  ) {}

  meta(fallbackUsed = false): EnterpriseGovernanceEnvelopeMeta {
    const persistenceMode = resolveEnterpriseGovernancePersistenceMode();
    return {
      dataSource: fallbackUsed && persistenceMode === "HYBRID" ? "HYBRID" : persistenceMode,
      persistenceMode,
      fallbackUsed,
    };
  }

  async createEnterpriseChannel(input: {
    enterpriseId: string;
    actorKind: string;
    contractReference: string;
    companyName: string;
    headquarters?: string;
    governanceStatus?: string;
    activationStatus?: string;
  }) {
    const row = await this.channels.upsert({
      enterpriseId: input.enterpriseId,
      actorKind: input.actorKind,
      contractReference: input.contractReference,
      companyName: input.companyName,
      headquarters: input.headquarters,
      governanceStatus: input.governanceStatus ?? "DRAFT",
      activationStatus: input.activationStatus ?? "PENDING_VALIDATION",
    });
    await this.appendEnterpriseGovernanceHistory({
      enterpriseId: input.enterpriseId,
      action: "CHANNEL_OPEN",
      author: "system",
      target: input.enterpriseId,
      note: "Ouverture canal entreprise",
      previousState: "NONE",
      newState: row.governanceStatus,
    });
    return row;
  }

  listEnterpriseChannels() {
    return this.channels.list();
  }

  getEnterpriseChannel(enterpriseId: string) {
    return this.channels.get(enterpriseId);
  }

  async activateEnterprisePole(input: {
    enterpriseId: string;
    poleId: string;
    poleLabel: string;
    secureSlug?: string;
    privateUrl?: string;
    activationCode?: string;
    collaboratorEmail?: string;
  }) {
    const id = `epa-${input.enterpriseId}-${input.poleId}`;
    const row = await this.poles.upsert({ id, ...input });
    await this.appendEnterpriseGovernanceHistory({
      enterpriseId: input.enterpriseId,
      action: "POLE_ACTIVATED",
      author: "system",
      target: input.poleId,
      note: `Activation pôle ${input.poleLabel}`,
      previousState: "INACTIVE",
      newState: "ACTIVE",
    });
    return row;
  }

  listPoleActivations(enterpriseId: string) {
    return this.poles.list(enterpriseId);
  }

  async createEnterpriseInvitation(input: {
    token: string;
    enterpriseId: string;
    poleId: string;
    poleLabel: string;
    activationCode: string;
    expiresAt?: Date;
  }) {
    const row = await this.invitations.create(input);
    await this.appendEnterpriseGovernanceHistory({
      enterpriseId: input.enterpriseId,
      action: "INVITATION_CREATED",
      author: "system",
      target: input.token,
      note: `Invitation pôle ${input.poleLabel}`,
      previousState: "NONE",
      newState: "PENDING",
    });
    return row;
  }

  listEnterpriseInvitations(enterpriseId: string) {
    return this.invitations.list(enterpriseId);
  }

  async registerEnterpriseCollaborator(input: {
    internalEnterpriseUserId: string;
    enterpriseId: string;
    poleId: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  }) {
    return this.collaborators.upsert({ status: "PENDING_VALIDATION", ...input });
  }

  async validateEnterpriseCollaborator(internalEnterpriseUserId: string) {
    const row = await this.collaborators.setStatus(internalEnterpriseUserId, "ACTIVE");
    await this.appendEnterpriseGovernanceHistory({
      enterpriseId: row.enterpriseId,
      action: "COLLABORATOR_VALIDATED",
      author: "system",
      target: internalEnterpriseUserId,
      note: "Collaborateur validé",
      previousState: "PENDING_VALIDATION",
      newState: "ACTIVE",
    });
    return row;
  }

  async suspendEnterpriseCollaborator(internalEnterpriseUserId: string, reason: string) {
    const row = await this.collaborators.setStatus(internalEnterpriseUserId, "SUSPENDED");
    await this.appendEnterpriseGovernanceHistory({
      enterpriseId: row.enterpriseId,
      action: "SUSPEND_USER",
      author: "system",
      target: internalEnterpriseUserId,
      note: reason,
      previousState: "ACTIVE",
      newState: "SUSPENDED",
    });
    return row;
  }

  async replaceEnterpriseCollaborator(
    previousId: string,
    next: {
      internalEnterpriseUserId: string;
      enterpriseId: string;
      poleId: string;
      firstName: string;
      lastName: string;
      phone: string;
      email: string;
    },
    reason: string,
  ) {
    await this.collaborators.setStatus(previousId, "ARCHIVED", reason);
    return this.registerEnterpriseCollaborator(next);
  }

  listCollaborators(enterpriseId: string) {
    return this.collaborators.list(enterpriseId);
  }

  async archiveEnterpriseChannel(enterpriseId: string, reason: string) {
    const row = await this.channels.archive(enterpriseId, reason);
    await this.appendEnterpriseGovernanceHistory({
      enterpriseId,
      action: "ARCHIVE_ENTERPRISE",
      author: "system",
      target: enterpriseId,
      note: reason,
      previousState: row.governanceStatus,
      newState: "ARCHIVED",
    });
    return row;
  }

  async reactivateEnterpriseChannel(enterpriseId: string, reason: string) {
    const row = await this.channels.reactivate(enterpriseId);
    await this.appendEnterpriseGovernanceHistory({
      enterpriseId,
      action: "REACTIVATE_ENTERPRISE",
      author: "system",
      target: enterpriseId,
      note: reason,
      previousState: "ARCHIVED",
      newState: "ACTIVE",
    });
    return row;
  }

  listEnterpriseSecurityAlerts(enterpriseId: string) {
    return this.alerts.list(enterpriseId);
  }

  async appendEnterpriseGovernanceHistory(input: {
    enterpriseId: string;
    action: string;
    author: string;
    authorLevel?: string;
    target: string;
    note: string;
    document?: string;
    previousState: string;
    newState: string;
  }) {
    return this.history.append(input);
  }

  listGovernanceHistory(enterpriseId: string) {
    return this.history.list(enterpriseId);
  }

  listTrustedDevices(enterpriseId: string) {
    return this.devices.list(enterpriseId);
  }

  async revokeInvitation(token: string, reason: string) {
    const row = await this.invitations.revoke(token, reason);
    await this.appendEnterpriseGovernanceHistory({
      enterpriseId: row.enterpriseId,
      action: "REVOKE_INVITATION",
      author: "system",
      target: token,
      note: reason,
      previousState: "PENDING",
      newState: "REVOKED",
    });
    return row;
  }

  async revokeTrustedDevice(id: string, enterpriseId: string, reason: string) {
    const row = await this.devices.revoke(id, reason);
    await this.appendEnterpriseGovernanceHistory({
      enterpriseId,
      action: "REVOKE_DEVICE",
      author: "system",
      target: id,
      note: reason,
      previousState: "APPROVED",
      newState: "REVOKED",
    });
    return row;
  }

  listContractDocuments(enterpriseId: string) {
    return this.contracts.list(enterpriseId);
  }
}
