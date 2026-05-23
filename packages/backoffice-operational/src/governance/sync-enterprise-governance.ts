import { isBackofficeLiveGovernanceFlagEnabled } from "../persistence/persistence-mode.js";
import { getBackofficeEnterpriseGovernanceRepository } from "../repositories/backoffice-enterprise-governance.repository.js";
import { BackofficeOperationalEventStream } from "../stream/operational-event-stream.js";
import { getBackofficeInternalNotificationRepository } from "../repositories/backoffice-internal-notification.repository.js";
import { fetchEnterpriseGovernanceLiveSnapshot } from "./enterprise-governance-live-client.js";

const GOVERNANCE_EVENT_MAP: Record<string, string> = {
  SUSPEND_USER: "suspension_utilisateur",
  REACTIVATE_USER: "reactivation_utilisateur",
  ARCHIVE_USER: "archivage_utilisateur",
  ARCHIVE_ENTERPRISE: "archivage_entreprise",
  REACTIVATE_ENTERPRISE: "reprise_entreprise",
  APPROVE_DEVICE: "trusted_device",
  REVOKE_DEVICE: "revocation_device",
  INVALIDATE_SESSION: "invalidation_session",
  CHANNEL_OPEN: "ouverture_canal",
  POLE_ACTIVATED: "activation_pole",
  INVITATION_CREATED: "invitation_creee",
  COLLABORATOR_VALIDATED: "collaborateur_valide",
  REVOKE_INVITATION: "revocation_invitation",
};

export type GovernanceSyncResult = {
  synced: number;
  dataSource: "LIVE" | "FALLBACK" | "HYBRID";
  persistenceMode: "LIVE" | "FALLBACK" | "HYBRID";
  fallbackUsed: boolean;
  lastSyncAt: string;
};

/** Synchronise gouvernance grands comptes → back-office (BACKOFFICE-01-B : source LIVE core/Prisma). */
export async function syncEnterpriseGovernanceToBackoffice(): Promise<GovernanceSyncResult> {
  if (!isBackofficeLiveGovernanceFlagEnabled()) {
    return {
      synced: 0,
      dataSource: "FALLBACK",
      persistenceMode: "FALLBACK",
      fallbackUsed: true,
      lastSyncAt: new Date().toISOString(),
    };
  }

  const snapshot = await fetchEnterpriseGovernanceLiveSnapshot();
  const repo = getBackofficeEnterpriseGovernanceRepository();
  const stream = BackofficeOperationalEventStream.shared();
  const notifications = getBackofficeInternalNotificationRepository();
  let synced = 0;

  for (const ch of snapshot.channels) {
    const poles = snapshot.polesByEnterprise.get(ch.enterpriseId) ?? [];
    const alerts = snapshot.alertsByEnterprise.get(ch.enterpriseId) ?? [];

    await repo.upsertEnterpriseProfile({
      id: ch.enterpriseId,
      name: ch.companyName,
      channelStatus: repo.channelStatusFromGovernance(ch.governanceStatus),
      contractRef: ch.contractReference,
      polesActivated: poles,
      activeCollaborators: 0,
      suspendedUsers: ch.activationStatus === "SUSPENDED" || ch.activationStatus === "ARCHIVED" ? 1 : 0,
      pendingInvitations: alerts.filter((a) => a.alertType === "invitation_expired").length,
      securityAlerts: alerts.filter((a) => !a.acknowledged).length,
    });

    await repo.appendGovernanceEvent({
      enterpriseId: ch.enterpriseId,
      eventKind: "channel_snapshot",
      title: `Canal ${ch.governanceStatus}`,
      detail: `${ch.companyName} [${snapshot.dataSource}]`,
      newState: ch.governanceStatus,
    });

    await stream.append({
      kind: "GOVERNANCE_EVENT",
      title: `Canal entreprise ${ch.companyName}`,
      payload: {
        enterpriseId: ch.enterpriseId,
        status: ch.governanceStatus,
        dataSource: snapshot.dataSource,
      },
      enterpriseId: ch.enterpriseId,
    });

    synced += 1;
  }

  for (const h of snapshot.history) {
    const kind = GOVERNANCE_EVENT_MAP[h.action] ?? h.action.toLowerCase();
    await repo.appendGovernanceEvent({
      enterpriseId: h.enterpriseId,
      eventKind: kind,
      title: h.action,
      detail: h.note,
      author: h.author,
      previousState: h.previousState,
      newState: h.newState,
    });

    if (h.action === "ARCHIVE_ENTERPRISE" || h.action === "SUSPEND_USER") {
      await notifications.push({
        priority: "high",
        title: `Gouvernance : ${h.action}`,
        body: h.note,
        linkedType: "enterprise",
        linkedId: h.enterpriseId,
      });
    }

    synced += 1;
  }

  for (const ch of snapshot.channels) {
    for (const alert of snapshot.alertsByEnterprise.get(ch.enterpriseId) ?? []) {
      if (alert.acknowledged) continue;
      await repo.appendGovernanceEvent({
        enterpriseId: ch.enterpriseId,
        eventKind: `security_${alert.alertType}`,
        title: alert.alertType,
        detail: alert.message,
      });
      synced += 1;
    }
  }

  return {
    synced,
    dataSource: snapshot.dataSource,
    persistenceMode: snapshot.persistenceMode,
    fallbackUsed: snapshot.fallbackUsed,
    lastSyncAt: snapshot.lastSyncAt,
  };
}
