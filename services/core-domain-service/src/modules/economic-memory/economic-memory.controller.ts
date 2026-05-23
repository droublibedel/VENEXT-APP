import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Query,
  UseGuards,
} from "@nestjs/common";
import { OrganizationActorType, OrganizationCategory } from "@prisma/client";
import { EconomicMemoryBundleSchema } from "@venext/shared-contracts";
import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { devAuthBypassEnabled } from "../../platform-authz/venext-auth-context";
import { VenextAuthzGuard } from "../../platform-authz/venext-authz.guard";
import { VenextAuthz } from "../../platform-authz/venext-authz.decorators";
import { EconomicMemoryService } from "./economic-memory.service";
import { HistoricalPatternService } from "./historical-pattern.service";

@Controller("economic-memory")
@UseGuards(VenextAuthzGuard)
export class EconomicMemoryController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly memory: EconomicMemoryService,
    private readonly patterns: HistoricalPatternService,
  ) {}

  private async gateOrg(organizationId: string | undefined) {
    if (!organizationId) throw new BadRequestException("organizationId_required");
    if (!(await this.flags.isEnabled("economic_memory_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "economic_memory_disabled" });
    }
    await this.assertProducerScope(organizationId);
    return organizationId;
  }

  private async assertProducerScope(organizationId: string) {
    if (devAuthBypassEnabled()) return;
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { category: true, actorType: true },
    });
    if (!org) throw new ForbiddenException({ code: "organization_not_found" });
    const ok =
      org.category === OrganizationCategory.PRODUCER || org.actorType === OrganizationActorType.INDUSTRIAL_PRODUCER;
    if (!ok) throw new ForbiddenException({ code: "economic_memory_producer_scope_required" });
  }

  @Get("history")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async history(
    @Query("organizationId") organizationId?: string,
    @Query("limit") limit?: string,
  ) {
    const org = await this.gateOrg(organizationId);
    const n = limit ? Number.parseInt(limit, 10) : 32;
    return this.memory.historyFeed(org, Number.isFinite(n) ? n : 32);
  }

  @Get("shock-patterns")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async shockPatterns(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    return this.patterns.shockPatterns(org);
  }

  @Get("territory-history")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async territoryHistory(
    @Query("organizationId") organizationId?: string,
    @Query("territory") territory?: string,
    @Query("limit") limit?: string,
  ) {
    const org = await this.gateOrg(organizationId);
    if (!territory?.trim()) throw new BadRequestException({ code: "economic_memory_territory_required" });
    const n = limit ? Number.parseInt(limit, 10) : 24;
    return this.memory.territoryFeed(org, territory.trim(), Number.isFinite(n) ? n : 24);
  }

  @Get("crisis-signatures")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async crisisSignatures(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    return this.prisma.economicCrisisSignature.findMany({
      where: { organizationId: org },
      orderBy: { createdAt: "desc" },
      take: 32,
    });
  }

  @Get("bundle")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async bundle(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const raw = await this.memory.composeBundle(org);
    const parsed = EconomicMemoryBundleSchema.safeParse(raw);
    if (!parsed.success) {
      throw new BadRequestException({ code: "economic_memory_bundle_contract_invalid", issues: parsed.error.flatten() });
    }
    return parsed.data;
  }
}
