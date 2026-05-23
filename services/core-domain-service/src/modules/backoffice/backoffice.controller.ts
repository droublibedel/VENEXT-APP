import {
  Body,
  Controller,
  Get,
  Headers,
  Patch,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  FeatureFlagScopeType,
  OrganizationCategory,
  OrganizationVerificationStatus,
  RelationshipStatus,
} from "@prisma/client";
import { BackofficeGovernanceGuard } from "./guards/backoffice-governance.guard";
import { BackofficeCommandCenterService } from "./backoffice-command-center.service";
import { BackofficeFeatureControlService } from "../backoffice-feature-control/backoffice-feature-control.service";
import { BackofficeEcosystemService } from "../backoffice-ecosystem/backoffice-ecosystem.service";
import { BackofficeGraphSupervisionService } from "../backoffice-graph-supervision/backoffice-graph-supervision.service";
import { BackofficeSignalMonitoringService } from "../backoffice-signal-monitoring/backoffice-signal-monitoring.service";
import { BackofficeDataQualityService } from "../backoffice-data-quality/backoffice-data-quality.service";
import { BackofficeAuditLogService } from "../backoffice-audit-log/backoffice-audit-log.service";
import { BackofficeSponsoredGovernanceService } from "./backoffice-sponsored-governance.service";
import { BackofficeAiGatewayService } from "./backoffice-ai-gateway.service";
import { BackofficeOperationalReadoutsService } from "./backoffice-operational-readouts.service";

function actorFrom(headers: Record<string, string | string[] | undefined>): string {
  const raw = headers["x-venext-user-id"] ?? headers["x-venext-actor"];
  const v = typeof raw === "string" ? raw.trim() : Array.isArray(raw) ? raw[0]?.trim() : "";
  return v || "backoffice_operator";
}

@Controller("backoffice")
@UseGuards(BackofficeGovernanceGuard)
export class BackofficeController {
  constructor(
    private readonly commandCenter: BackofficeCommandCenterService,
    private readonly features: BackofficeFeatureControlService,
    private readonly ecosystem: BackofficeEcosystemService,
    private readonly graph: BackofficeGraphSupervisionService,
    private readonly signals: BackofficeSignalMonitoringService,
    private readonly dataQualitySvc: BackofficeDataQualityService,
    private readonly audit: BackofficeAuditLogService,
    private readonly sponsoredGov: BackofficeSponsoredGovernanceService,
    private readonly ai: BackofficeAiGatewayService,
    private readonly operational: BackofficeOperationalReadoutsService,
  ) {}

  @Get("overview")
  overview() {
    return this.commandCenter.overview();
  }

  @Get("features")
  featureList() {
    return this.features.listDefinitions();
  }

  @Patch("features/:key")
  patchFeature(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param("key") key: string,
    @Body()
    body: {
      enabled: boolean;
      description?: string;
      scopeType?: FeatureFlagScopeType;
      scopeValue?: string | null;
      evaluateAs?: { organizationId?: string; role?: string; country?: string; region?: string };
    },
  ) {
    return this.features.patchFlag({
      actor: actorFrom(headers),
      key,
      enabled: body.enabled,
      description: body.description,
      scopeType: body.scopeType,
      scopeValue: body.scopeValue,
      evaluateAs: body.evaluateAs,
    });
  }

  @Get("organizations")
  organizations(
    @Query("category") category?: string,
    @Query("take") take?: string,
    @Query("cursor") cursor?: string,
  ) {
    const cat = category && category in OrganizationCategory ? (category as OrganizationCategory) : undefined;
    const t = take ? Number(take) : undefined;
    return this.ecosystem.listOrganizations({ category: cat, take: Number.isFinite(t ?? NaN) ? t : undefined, cursor });
  }

  @Patch("organizations/:id")
  patchOrg(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param("id") id: string,
    @Body() body: { verificationStatus?: OrganizationVerificationStatus; governanceSuspended?: boolean },
  ) {
    return this.ecosystem.patchOrganization(actorFrom(headers), id, body);
  }

  @Get("relationships")
  relationships(
    @Query("status") status?: string,
    @Query("take") take?: string,
    @Query("cursor") cursor?: string,
  ) {
    const st = status && status in RelationshipStatus ? (status as RelationshipStatus) : undefined;
    const t = take ? Number(take) : undefined;
    return this.graph.listRelationships({
      status: st,
      take: Number.isFinite(t ?? NaN) ? t : undefined,
      cursor,
    });
  }

  @Patch("relationships/:id")
  patchRel(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param("id") id: string,
    @Body() body: { status: RelationshipStatus },
  ) {
    return this.graph.patchRelationship(actorFrom(headers), id, body);
  }

  @Get("sponsored-visibility")
  sponsored(@Query("sponsorOrganizationId") sponsorOrganizationId?: string, @Query("take") take?: string) {
    const t = take ? Number(take) : undefined;
    return this.sponsoredGov.listGovernance({
      sponsorOrganizationId,
      take: Number.isFinite(t ?? NaN) ? t : undefined,
    });
  }

  @Patch("sponsored-visibility/:injectionId")
  patchSponsored(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param("injectionId") injectionId: string,
    @Body() body: { action: "approve" | "pause" | "reject"; note?: string },
  ) {
    return this.sponsoredGov.patchInjection(actorFrom(headers), injectionId, body);
  }

  @Get("ai-gateway")
  aiGateway() {
    return this.ai.getSnapshot();
  }

  @Patch("ai-gateway")
  patchAi(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() body: { mockLatencyMs?: number; poleInsightGeneration?: "ENABLED" | "DEGRADED" | "DISABLED" },
  ) {
    return this.ai.patch(actorFrom(headers), body);
  }

  @Get("realtime")
  realtime() {
    return this.signals.snapshot();
  }

  @Get("industrial-poles")
  poles() {
    return this.operational.industrialPolesGovernance();
  }

  @Get("payments")
  payments(
    @Query("organizationId") organizationId?: string,
    @Query("regionCode") regionCode?: string,
  ) {
    return this.operational.paymentsSnapshot(organizationId, regionCode);
  }

  @Get("safety")
  safety() {
    return this.operational.safetySnapshot();
  }

  @Get("data-quality")
  dataQuality() {
    return this.dataQualitySvc.runScan();
  }

  @Get("audit-logs")
  auditLogs(@Query("limit") limit?: string, @Query("action") action?: string, @Query("cursor") cursor?: string) {
    const l = limit ? Number(limit) : undefined;
    return this.audit.list({
      limit: Number.isFinite(l ?? NaN) ? l : undefined,
      action,
      cursor: cursor?.trim() || undefined,
    });
  }
}
