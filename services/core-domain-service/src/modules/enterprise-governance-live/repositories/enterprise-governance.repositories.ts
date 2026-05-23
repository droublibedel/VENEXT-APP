import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../../prisma/prisma.service";

const activeWhere = { archivedAt: null };

@Injectable()
export class EnterpriseChannelRepository {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.enterpriseCommercialChannelRecord.findMany({
      where: activeWhere,
      orderBy: { updatedAt: "desc" },
    });
  }

  get(enterpriseId: string) {
    return this.prisma.enterpriseCommercialChannelRecord.findFirst({
      where: { enterpriseId, ...activeWhere },
    });
  }

  upsert(data: {
    enterpriseId: string;
    actorKind: string;
    contractReference: string;
    companyName: string;
    headquarters?: string;
    governanceStatus: string;
    activationStatus: string;
    onboardingProgress?: number;
    status?: string;
  }) {
    const { enterpriseId, ...rest } = data;
    return this.prisma.enterpriseCommercialChannelRecord.upsert({
      where: { enterpriseId },
      create: {
        enterpriseId,
        accountSegment: "LARGE_ACCOUNTS",
        headquarters: rest.headquarters ?? "",
        onboardingProgress: rest.onboardingProgress ?? 0,
        status: rest.status ?? "ACTIVE",
        ...rest,
      },
      update: { ...rest, archivedAt: null, archivedReason: null },
    });
  }

  archive(enterpriseId: string, reason: string) {
    return this.prisma.enterpriseCommercialChannelRecord.update({
      where: { enterpriseId },
      data: {
        status: "ARCHIVED",
        governanceStatus: "ARCHIVED",
        activationStatus: "ARCHIVED",
        archivedAt: new Date(),
        archivedReason: reason,
      },
    });
  }

  reactivate(enterpriseId: string) {
    return this.prisma.enterpriseCommercialChannelRecord.update({
      where: { enterpriseId },
      data: {
        status: "ACTIVE",
        governanceStatus: "ACTIVE",
        activationStatus: "ACTIVE",
        archivedAt: null,
        archivedReason: null,
      },
    });
  }
}

@Injectable()
export class EnterprisePoleActivationRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(enterpriseId: string) {
    return this.prisma.enterprisePoleActivationRecord.findMany({
      where: { enterpriseId, ...activeWhere },
      orderBy: { createdAt: "desc" },
    });
  }

  upsert(data: {
    id: string;
    enterpriseId: string;
    poleId: string;
    poleLabel: string;
    secureSlug?: string;
    privateUrl?: string;
    activationCode?: string;
    collaboratorEmail?: string;
  }) {
    const { id, enterpriseId, poleId, ...rest } = data;
    return this.prisma.enterprisePoleActivationRecord.upsert({
      where: { enterpriseId_poleId: { enterpriseId, poleId } },
      create: { id, enterpriseId, poleId, secureSlug: "", privateUrl: "", ...rest },
      update: { ...rest, archivedAt: null, archivedReason: null, status: "ACTIVE" },
    });
  }
}

@Injectable()
export class EnterpriseInvitationRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(enterpriseId: string) {
    return this.prisma.enterpriseInvitationRecord.findMany({
      where: { enterpriseId, ...activeWhere },
      orderBy: { createdAt: "desc" },
    });
  }

  create(data: {
    token: string;
    enterpriseId: string;
    poleId: string;
    poleLabel: string;
    activationCode: string;
    expiresAt?: Date;
  }) {
    return this.prisma.enterpriseInvitationRecord.create({ data: { status: "PENDING", ...data } });
  }

  revoke(token: string, reason: string) {
    return this.prisma.enterpriseInvitationRecord.update({
      where: { token },
      data: { status: "REVOKED", revokedAt: new Date(), archivedReason: reason },
    });
  }
}

@Injectable()
export class EnterpriseCollaboratorRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(enterpriseId: string) {
    return this.prisma.enterpriseCollaboratorRecord.findMany({
      where: { enterpriseId, ...activeWhere },
      orderBy: { createdAt: "desc" },
    });
  }

  upsert(data: {
    internalEnterpriseUserId: string;
    enterpriseId: string;
    poleId: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    status?: string;
  }) {
    const { internalEnterpriseUserId, ...rest } = data;
    return this.prisma.enterpriseCollaboratorRecord.upsert({
      where: { internalEnterpriseUserId },
      create: { internalEnterpriseUserId, status: "PENDING_VALIDATION", ...rest },
      update: { ...rest, archivedAt: null, archivedReason: null },
    });
  }

  setStatus(internalEnterpriseUserId: string, status: string, reason?: string) {
    return this.prisma.enterpriseCollaboratorRecord.update({
      where: { internalEnterpriseUserId },
      data: {
        status,
        ...(status === "ARCHIVED"
          ? { archivedAt: new Date(), archivedReason: reason ?? "archived" }
          : { archivedAt: null, archivedReason: null }),
      },
    });
  }
}

@Injectable()
export class EnterpriseTrustedDeviceRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(enterpriseId: string) {
    return this.prisma.enterpriseTrustedDeviceRecord.findMany({
      where: { enterpriseId, ...activeWhere },
      orderBy: { createdAt: "desc" },
    });
  }

  upsert(data: {
    id: string;
    enterpriseId: string;
    deviceLabel: string;
    machineFingerprint?: string;
    status?: string;
  }) {
    const { id, ...rest } = data;
    return this.prisma.enterpriseTrustedDeviceRecord.upsert({
      where: { id },
      create: { id, status: "APPROVED", ...rest },
      update: { ...rest, archivedAt: null, archivedReason: null },
    });
  }

  revoke(id: string, reason: string) {
    return this.prisma.enterpriseTrustedDeviceRecord.update({
      where: { id },
      data: { status: "REVOKED", archivedAt: new Date(), archivedReason: reason },
    });
  }
}

@Injectable()
export class EnterpriseSecurityAlertRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(enterpriseId: string) {
    return this.prisma.enterpriseSecurityAlertRecord.findMany({
      where: { enterpriseId, ...activeWhere },
      orderBy: { createdAt: "desc" },
    });
  }

  create(data: {
    enterpriseId: string;
    alertType: string;
    message: string;
    severity?: string;
  }) {
    return this.prisma.enterpriseSecurityAlertRecord.create({
      data: { status: "OPEN", acknowledged: false, severity: data.severity ?? "warning", ...data },
    });
  }
}

@Injectable()
export class EnterpriseGovernanceHistoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(enterpriseId: string) {
    return this.prisma.enterpriseGovernanceHistoryRecord.findMany({
      where: { enterpriseId, ...activeWhere },
      orderBy: { createdAt: "desc" },
    });
  }

  append(data: {
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
    return this.prisma.enterpriseGovernanceHistoryRecord.create({
      data: { status: "RECORDED", authorLevel: data.authorLevel ?? "VENEXT_GLOBAL", ...data },
    });
  }
}

@Injectable()
export class EnterpriseContractDocumentRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(enterpriseId: string) {
    return this.prisma.enterpriseContractDocumentRecord.findMany({
      where: { enterpriseId, ...activeWhere },
      orderBy: { createdAt: "desc" },
    });
  }

  create(data: { enterpriseId: string; title: string; kind: string; fileRef: string }) {
    return this.prisma.enterpriseContractDocumentRecord.create({
      data: { status: "ACTIVE", ...data },
    });
  }
}
