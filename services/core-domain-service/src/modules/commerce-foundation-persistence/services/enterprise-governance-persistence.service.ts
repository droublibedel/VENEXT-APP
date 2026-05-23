import { Injectable } from "@nestjs/common";

import { BaseCommercePersistenceService } from "./base-commerce-persistence.service";
import { CommerceFoundationRepository } from "../commerce-foundation.repository";

const CANONICAL_POLE_IDS = [
  "executive",
  "commercial",
  "relational-commercial",
  "professional-commercial-network-workspace",
  "order-fulfillment",
  "producer-commercial-mail-workspace",
  "catalog-products",
  "territory-distribution",
  "marketing-activation-workspace",
  "supply-logistics-workspace",
  "finance-collections-workspace",
  "data-intelligence-workspace",
  "industrial-security",
] as const;

export type EnterpriseChannelPayload = Record<string, unknown> & {
  enterpriseId: string;
  companyName: string;
  contractReference: string;
  governanceStatus: string;
  onboardingProgress: number;
  activationStatus: string;
};

@Injectable()
export class EnterpriseGovernancePersistenceService extends BaseCommercePersistenceService {
  constructor(repo: CommerceFoundationRepository) {
    super(repo);
  }

  listCanonicalPoleIds(): string[] {
    return [...CANONICAL_POLE_IDS];
  }

  assertPoleExists(poleId: string): void {
    if (!CANONICAL_POLE_IDS.includes(poleId as (typeof CANONICAL_POLE_IDS)[number])) {
      throw new Error("VENEXT_POLE_NOT_IN_PLATFORM");
    }
  }

  listChannels() {
    return this.list<EnterpriseChannelPayload>("EnterpriseCommercialChannel");
  }

  getChannel(enterpriseId: string) {
    return this.getByKey<EnterpriseChannelPayload>("EnterpriseCommercialChannel", enterpriseId);
  }

  upsertChannel(enterpriseId: string, payload: EnterpriseChannelPayload) {
    return this.upsert("EnterpriseCommercialChannel", enterpriseId, payload, { organizationId: enterpriseId });
  }

  listPoleActivations(enterpriseId: string) {
    return this.list<Record<string, unknown>>("EnterprisePoleActivation", {
      organizationId: enterpriseId,
    });
  }

  upsertPoleActivation(entityKey: string, payload: Record<string, unknown>, enterpriseId: string) {
    this.assertPoleExists(String(payload.poleId ?? ""));
    return this.upsert("EnterprisePoleActivation", entityKey, payload, { organizationId: enterpriseId });
  }

  upsertInvitation(token: string, payload: Record<string, unknown>, enterpriseId: string) {
    return this.upsert("EnterpriseSecureInvitation", token, payload, { organizationId: enterpriseId });
  }

  getInvitation(token: string) {
    return this.getByKey<Record<string, unknown>>("EnterpriseSecureInvitation", token);
  }

  listPendingCollaborators() {
    return this.list<Record<string, unknown>>("EnterpriseCollaboratorOnboarding").then((rows) =>
      rows.filter((r) => r.status === "PENDING_VALIDATION"),
    );
  }

  getCollaborator(internalId: string) {
    return this.getByKey<Record<string, unknown>>("EnterpriseCollaboratorOnboarding", internalId);
  }

  upsertCollaborator(internalId: string, payload: Record<string, unknown>, enterpriseId: string) {
    return this.upsert("EnterpriseCollaboratorOnboarding", internalId, payload, {
      organizationId: enterpriseId,
    });
  }

  listTrustedDevices(enterpriseId: string) {
    return this.list<Record<string, unknown>>("EnterpriseTrustedDevice", {
      organizationId: enterpriseId,
    });
  }

  upsertTrustedDevice(deviceId: string, payload: Record<string, unknown>, enterpriseId: string) {
    return this.upsert("EnterpriseTrustedDevice", deviceId, payload, { organizationId: enterpriseId });
  }

  async recordSecurityAction(body: Record<string, unknown>) {
    const enterpriseId = String(body.enterpriseId ?? "");
    const entityKey = `egh-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const entry = {
      enterpriseId,
      action: body.action,
      author: body.author,
      authorLevel: body.authorLevel,
      target: body.target,
      note: body.reason,
      document: body.optionalDocument,
      previousState: body.previousState ?? "UNKNOWN",
      newState: body.newState ?? "RECORDED",
      createdAt: new Date().toISOString(),
    };
    await this.upsert("EnterpriseGovernanceHistory", entityKey, entry, { organizationId: enterpriseId });
    if (body.action === "ARCHIVE_ENTERPRISE" && enterpriseId) {
      await this.upsertChannel(enterpriseId, {
        enterpriseId,
        governanceStatus: "ARCHIVED",
        activationStatus: "SUSPENDED",
        updatedAt: new Date().toISOString(),
      } as never);
    }
    return entry;
  }

  listGovernanceHistory(enterpriseId: string) {
    return this.list<Record<string, unknown>>("EnterpriseGovernanceHistory", {
      organizationId: enterpriseId,
    });
  }

  listSecurityAlerts(enterpriseId: string) {
    return this.list<Record<string, unknown>>("GovernanceActionNote", {
      organizationId: enterpriseId,
    }).then((rows) =>
      rows.length > 0
        ? rows
        : [
            {
              id: `alert-fallback-${enterpriseId}`,
              enterpriseId,
              alertType: "info",
              message: "Aucune alerte enregistrée",
              severity: "info",
              createdAt: new Date().toISOString(),
            },
          ],
    );
  }
}
