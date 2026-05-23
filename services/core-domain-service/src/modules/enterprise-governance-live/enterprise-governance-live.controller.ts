import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
} from "@nestjs/common";

import { EnterpriseGovernanceLiveService } from "./enterprise-governance-live.service";
import { auditEnterpriseLiveGovernanceIntegrity } from "./enterprise-governance-integrity";
import { resolveEnterpriseGovernancePersistenceMode } from "./enterprise-governance.persistence-mode";

function withMeta<T>(svc: EnterpriseGovernanceLiveService, payload: T, fallbackUsed = false) {
  return { ...svc.meta(fallbackUsed), payload };
}

@Controller("commerce-foundation/enterprise")
export class EnterpriseGovernanceLiveController {
  constructor(private readonly live: EnterpriseGovernanceLiveService) {}

  @Get("channels")
  async listChannels() {
    const rows = await this.live.listEnterpriseChannels();
    return withMeta(this.live, rows);
  }

  @Get("channels/:enterpriseId")
  async getChannel(@Param("enterpriseId") enterpriseId: string) {
    const row = await this.live.getEnterpriseChannel(enterpriseId);
    if (!row) throw new NotFoundException("channel_not_found");
    return withMeta(this.live, row);
  }

  @Post("channels")
  async createChannel(@Body() body: Record<string, unknown>) {
    const enterpriseId = String(body.enterpriseId ?? "");
    if (!enterpriseId) throw new BadRequestException("enterpriseId required");
    const saved = await this.live.createEnterpriseChannel({
      enterpriseId,
      actorKind: String(body.actorKind ?? "producteur"),
      contractReference: String(body.contractReference ?? ""),
      companyName: String(body.companyName ?? ""),
      headquarters: String(body.headquarters ?? ""),
      governanceStatus: String(body.governanceStatus ?? "DRAFT"),
      activationStatus: String(body.activationStatus ?? "PENDING_VALIDATION"),
    });
    return withMeta(this.live, saved);
  }

  @Patch("channels/:enterpriseId/status")
  async patchChannelStatus(
    @Param("enterpriseId") enterpriseId: string,
    @Body() body: { action: string; note?: string },
  ) {
    const note = String(body.note ?? "");
    if (body.action === "archive") {
      const row = await this.live.archiveEnterpriseChannel(enterpriseId, note || "archived");
      return withMeta(this.live, row);
    }
    if (body.action === "reactivate") {
      const row = await this.live.reactivateEnterpriseChannel(enterpriseId, note || "reactivated");
      return withMeta(this.live, row);
    }
    throw new BadRequestException("unknown_action");
  }

  @Get("channels/:enterpriseId/timeline")
  async timeline(@Param("enterpriseId") enterpriseId: string) {
    const rows = await this.live.listGovernanceHistory(enterpriseId);
    return withMeta(this.live, rows);
  }

  @Get("channels/:enterpriseId/poles")
  async poles(@Param("enterpriseId") enterpriseId: string) {
    return withMeta(this.live, await this.live.listPoleActivations(enterpriseId));
  }

  @Post("channels/:enterpriseId/poles")
  async activatePole(
    @Param("enterpriseId") enterpriseId: string,
    @Body() body: { poleId: string; poleLabel: string; privateUrl?: string },
  ) {
    const saved = await this.live.activateEnterprisePole({
      enterpriseId,
      poleId: body.poleId,
      poleLabel: body.poleLabel,
      privateUrl: body.privateUrl,
    });
    return withMeta(this.live, saved);
  }

  @Get("channels/:enterpriseId/invitations")
  async invitations(@Param("enterpriseId") enterpriseId: string) {
    return withMeta(this.live, await this.live.listEnterpriseInvitations(enterpriseId));
  }

  @Get("channels/:enterpriseId/collaborators")
  async collaborators(@Param("enterpriseId") enterpriseId: string) {
    return withMeta(this.live, await this.live.listCollaborators(enterpriseId));
  }

  @Get("channels/:enterpriseId/security-alerts")
  async securityAlerts(@Param("enterpriseId") enterpriseId: string) {
    return withMeta(this.live, await this.live.listEnterpriseSecurityAlerts(enterpriseId));
  }

  @Get("integrity/audit")
  async integrityAudit() {
    const report = await auditEnterpriseLiveGovernanceIntegrity(this.live);
    return {
      ...this.live.meta(),
      persistenceMode: resolveEnterpriseGovernancePersistenceMode(),
      payload: report,
    };
  }
}
