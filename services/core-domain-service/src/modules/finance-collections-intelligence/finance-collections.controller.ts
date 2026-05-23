import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Query,
  UseGuards,
} from "@nestjs/common";
import { OrganizationActorType, OrganizationCategory } from "@prisma/client";
import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { devAuthBypassEnabled } from "../../platform-authz/venext-auth-context";
import { VenextAuthzGuard } from "../../platform-authz/venext-authz.guard";
import { VenextAuthz } from "../../platform-authz/venext-authz.decorators";
import { CashflowIntelligenceService } from "../cashflow-intelligence/cashflow-intelligence.service";
import { CollectionPrioritiesService } from "../collection-priorities/collection-priorities.service";
import { CreditRiskService } from "../credit-risk/credit-risk.service";
import { FinanceOverviewService } from "../finance-overview/finance-overview.service";
import { FinancialInterventionsService } from "../financial-interventions/financial-interventions.service";
import { PaymentAnomaliesService } from "../payment-anomalies/payment-anomalies.service";
import { PaymentBehaviorService } from "../payment-behavior/payment-behavior.service";
import { PaymentPressureService } from "../payment-pressure/payment-pressure.service";
import { ReceivablesHealthService } from "../receivables-health/receivables-health.service";
import { WalletLiquidityService } from "../wallet-liquidity/wallet-liquidity.service";
import { FinanceCollectionsBriefingService } from "./finance-collections-briefing.service";
import { FinanceCollectionsBundleService } from "./finance-collections-bundle.service";
import { FinanceCollectionsDataService } from "./finance-collections-data.service";

@Controller("finance-collections")
@UseGuards(VenextAuthzGuard)
export class FinanceCollectionsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly data: FinanceCollectionsDataService,
    private readonly overviewSvc: FinanceOverviewService,
    private readonly paymentPressureSvc: PaymentPressureService,
    private readonly receivablesSvc: ReceivablesHealthService,
    private readonly behaviorSvc: PaymentBehaviorService,
    private readonly walletSvc: WalletLiquidityService,
    private readonly creditSvc: CreditRiskService,
    private readonly cashflowSvc: CashflowIntelligenceService,
    private readonly anomaliesSvc: PaymentAnomaliesService,
    private readonly prioritiesSvc: CollectionPrioritiesService,
    private readonly briefingSvc: FinanceCollectionsBriefingService,
    private readonly interventionsSvc: FinancialInterventionsService,
    private readonly bundleSvc: FinanceCollectionsBundleService,
  ) {}

  private async gateOrg(organizationId: string | undefined) {
    if (!organizationId) throw new BadRequestException("organizationId_required");
    if (!(await this.flags.isEnabled("finance_collections_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "finance_collections_disabled" });
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
    if (!ok) throw new ForbiddenException({ code: "finance_collections_producer_scope_required" });
  }

  private async gates(organizationId: string) {
    const poleOn = await this.flags.isEnabled("finance_collections_enabled", { organizationId });
    const paymentPressureOn = poleOn && (await this.flags.isEnabled("payment_pressure_enabled", { organizationId }));
    const walletOn = poleOn && (await this.flags.isEnabled("wallet_liquidity_enabled", { organizationId }));
    const creditOn = poleOn && (await this.flags.isEnabled("credit_risk_enabled", { organizationId }));
    return { poleOn, paymentPressureOn, walletOn, creditOn };
  }

  @Get("bundle")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async bundle(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    return this.bundleSvc.bundle(org);
  }

  @Get("overview")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async overview(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const snapshot = await this.data.loadSnapshot(org);
    const { poleOn } = await this.gates(org);
    return this.overviewSvc.build(snapshot, poleOn);
  }

  @Get("payment-pressure")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async paymentPressure(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const snapshot = await this.data.loadSnapshot(org);
    const { paymentPressureOn } = await this.gates(org);
    return this.paymentPressureSvc.build(snapshot, paymentPressureOn);
  }

  @Get("receivables-health")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async receivablesHealth(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const snapshot = await this.data.loadSnapshot(org);
    const { poleOn } = await this.gates(org);
    return this.receivablesSvc.build(snapshot, poleOn);
  }

  @Get("payment-behavior")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async paymentBehavior(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const snapshot = await this.data.loadSnapshot(org);
    const { poleOn } = await this.gates(org);
    return this.behaviorSvc.build(snapshot, poleOn);
  }

  @Get("wallet-liquidity")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async walletLiquidity(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const snapshot = await this.data.loadSnapshot(org);
    const { walletOn } = await this.gates(org);
    return this.walletSvc.build(snapshot, walletOn);
  }

  @Get("credit-risk")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async creditRisk(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const snapshot = await this.data.loadSnapshot(org);
    const { creditOn } = await this.gates(org);
    return this.creditSvc.build(snapshot, creditOn);
  }

  @Get("cashflow")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async cashflow(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const snapshot = await this.data.loadSnapshot(org);
    const { poleOn } = await this.gates(org);
    return this.cashflowSvc.build(snapshot, poleOn);
  }

  @Get("payment-anomalies")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async paymentAnomalies(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const snapshot = await this.data.loadSnapshot(org);
    const { poleOn } = await this.gates(org);
    return this.anomaliesSvc.build(snapshot, poleOn);
  }

  @Get("collection-priorities")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async collectionPriorities(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const snapshot = await this.data.loadSnapshot(org);
    const { poleOn } = await this.gates(org);
    return this.prioritiesSvc.build(snapshot, poleOn);
  }

  @Get("briefing")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async briefing(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const snapshot = await this.data.loadSnapshot(org);
    const { poleOn, walletOn } = await this.gates(org);
    const overview = this.overviewSvc.build(snapshot, poleOn);
    const wallet = this.walletSvc.build(snapshot, walletOn);
    const priorities = this.prioritiesSvc.build(snapshot, poleOn);
    const top =
      priorities.items[0] != null
        ? `Top queue: ${priorities.items[0].buyerDisplayName} · ${priorities.items[0].territoryCode} · urgency ${priorities.items[0].urgency.toFixed(2)}.`
        : "No acute queue head — maintain observatory on receivable drift.";
    return this.briefingSvc.briefing(org, overview, wallet.liquidityStressIndex, top);
  }

  @Get("interventions")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async interventions(@Query("organizationId") organizationId?: string) {
    const org = await this.gateOrg(organizationId);
    const snapshot = await this.data.loadSnapshot(org);
    const g = await this.gates(org);
    const overview = this.overviewSvc.build(snapshot, g.poleOn);
    if (overview.policy === "DISABLED") {
      return { version: "1", generatedAt: snapshot.generatedAt, organizationId: org, interventions: [] };
    }
    const paymentPressure = this.paymentPressureSvc.build(snapshot, g.paymentPressureOn);
    const creditRisk = this.creditSvc.build(snapshot, g.creditOn);
    const wallet = this.walletSvc.build(snapshot, g.walletOn);
    const priorities = this.prioritiesSvc.build(snapshot, g.poleOn);
    return this.interventionsSvc.synthesize({
      organizationId: org,
      generatedAt: snapshot.generatedAt,
      overview,
      paymentPressure,
      creditRisk,
      wallet,
      priorities,
    });
  }
}
