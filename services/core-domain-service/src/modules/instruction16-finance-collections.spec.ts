import { describe, expect, it } from "vitest";
import { OrderStatus, PaymentStatus, RelationshipStatus } from "@prisma/client";
import { FinanceCollectionsBundleResponseSchema } from "@venext/shared-contracts";
import type { FinanceCollectionsSnapshot } from "./finance-collections-intelligence/finance-collections-data.service";
import { CashflowIntelligenceService } from "./cashflow-intelligence/cashflow-intelligence.service";
import { CollectionPrioritiesService } from "./collection-priorities/collection-priorities.service";
import { CreditRiskService } from "./credit-risk/credit-risk.service";
import { FinanceOverviewService } from "./finance-overview/finance-overview.service";
import { FinancialInterventionsService } from "./financial-interventions/financial-interventions.service";
import { PaymentAnomaliesService } from "./payment-anomalies/payment-anomalies.service";
import { PaymentBehaviorService } from "./payment-behavior/payment-behavior.service";
import { PaymentPressureService } from "./payment-pressure/payment-pressure.service";
import { ReceivablesHealthService } from "./receivables-health/receivables-health.service";
import { WalletLiquidityService } from "./wallet-liquidity/wallet-liquidity.service";

function baseSnapshot(overrides: Partial<FinanceCollectionsSnapshot> = {}): FinanceCollectionsSnapshot {
  const now = new Date();
  return {
    organizationId: "31111111-1111-1111-1111-111111111101",
    generatedAt: now.toISOString(),
    orders: [],
    negotiations: [],
    wallets: [],
    transactions: [],
    groupBuyingSessions: [],
    ...overrides,
  };
}

describe("Instruction 16 — finance / encaissements intelligence", () => {
  const overviewSvc = new FinanceOverviewService();
  const pressureSvc = new PaymentPressureService();
  const recvSvc = new ReceivablesHealthService();
  const walletSvc = new WalletLiquidityService();
  const prioSvc = new CollectionPrioritiesService();
  const behaviorSvc = new PaymentBehaviorService();
  const creditSvc = new CreditRiskService();
  const cashflowSvc = new CashflowIntelligenceService();
  const anomaliesSvc = new PaymentAnomaliesService();
  const interventionsSvc = new FinancialInterventionsService();

  it("finance_collections_enabled off yields DISABLED overview", () => {
    const o = overviewSvc.build(baseSnapshot(), false);
    expect(o.policy).toBe("DISABLED");
  });

  it("payment pressure correlates overdue mass with open receivables", () => {
    const old = new Date(Date.now() - 20 * 86400000);
    const snap = baseSnapshot({
      orders: [
        {
          id: "o1",
          buyerOrganizationId: "b1",
          relationshipId: "r1",
          totalAmount: 1_000_000,
          currency: "XOF",
          paymentStatus: PaymentStatus.UNPAID,
          status: OrderStatus.ACCEPTED,
          deliveryStatus: "NOT_STARTED",
          createdAt: old,
          updatedAt: old,
          buyer: {
            id: "b1",
            displayName: "Buyer A",
            city: "Dakar",
            country: "SN",
            credibilityScore: 0.4,
            category: "WHOLESALER_A",
          },
          relationship: { id: "r1", trustLevel: 0.35, status: RelationshipStatus.ACCEPTED },
        },
      ],
    });
    const p = pressureSvc.build(snap, true);
    expect(p.policy).toBe("ACTIVE");
    expect(p.overdueTerritories.length).toBeGreaterThan(0);
    expect(p.collectionCollapseRisk).toBeGreaterThan(0);
  });

  it("receivables health classifies credit-heavy row as UNSTABLE", () => {
    const snap = baseSnapshot({
      orders: [
        {
          id: "o2",
          buyerOrganizationId: "b2",
          relationshipId: "r2",
          totalAmount: 3_000_000,
          currency: "XOF",
          paymentStatus: PaymentStatus.CREDIT,
          status: OrderStatus.ACCEPTED,
          deliveryStatus: "NOT_STARTED",
          createdAt: new Date(),
          updatedAt: new Date(),
          buyer: {
            id: "b2",
            displayName: "Buyer B",
            city: "Thies",
            country: "SN",
            credibilityScore: 0.5,
            category: "RETAILER",
          },
          relationship: { id: "r2", trustLevel: 0.6, status: RelationshipStatus.ACCEPTED },
        },
      ],
    });
    const r = recvSvc.build(snap, true);
    expect(r.unstableCount).toBeGreaterThan(0);
  });

  it("wallet provider mode is labeled (default NOT_CONFIGURED)", () => {
    const prevReady = process.env.VENEXT_PAYMENT_PROVIDER_READY;
    const prevMock = process.env.VENEXT_USE_MOCK_PAYMENT_PROVIDER;
    delete process.env.VENEXT_PAYMENT_PROVIDER_READY;
    delete process.env.VENEXT_USE_MOCK_PAYMENT_PROVIDER;
    const snap = baseSnapshot({
      wallets: [
        {
          organizationId: "31111111-1111-1111-1111-111111111101",
          currency: "XOF",
          balance: 100_000,
          status: "ACTIVE",
          qrPayload: "qr",
          nfcEnabled: false,
        },
      ],
    });
    expect(walletSvc.build(snap, true).providerMode).toBe("NOT_CONFIGURED");
    process.env.VENEXT_USE_MOCK_PAYMENT_PROVIDER = "1";
    expect(walletSvc.build(snap, true).providerMode).toBe("MOCK_PROVIDER");
    process.env.VENEXT_PAYMENT_PROVIDER_READY = "1";
    expect(walletSvc.build(snap, true).providerMode).toBe("READY");
    if (prevReady !== undefined) process.env.VENEXT_PAYMENT_PROVIDER_READY = prevReady;
    else delete process.env.VENEXT_PAYMENT_PROVIDER_READY;
    if (prevMock !== undefined) process.env.VENEXT_USE_MOCK_PAYMENT_PROVIDER = prevMock;
    else delete process.env.VENEXT_USE_MOCK_PAYMENT_PROVIDER;
  });

  it("collection priorities are ranked with rank field", () => {
    const snap = baseSnapshot({
      orders: [
        {
          id: "o3",
          buyerOrganizationId: "b3",
          relationshipId: "r3",
          totalAmount: 2_000_000,
          currency: "XOF",
          paymentStatus: PaymentStatus.UNPAID,
          status: OrderStatus.ACCEPTED,
          deliveryStatus: "NOT_STARTED",
          createdAt: new Date(Date.now() - 30 * 86400000),
          updatedAt: new Date(),
          buyer: {
            id: "b3",
            displayName: "Buyer C",
            city: "Ziguinchor",
            country: "SN",
            credibilityScore: 0.5,
            category: "RETAILER",
          },
          relationship: { id: "r3", trustLevel: 0.4, status: RelationshipStatus.ACCEPTED },
        },
      ],
    });
    const c = prioSvc.build(snap, true);
    expect(c.items.length).toBeGreaterThan(0);
    expect(c.items[0]!.rank).toBe(1);
  });

  it("bundle schema validates packed finance pole response", () => {
    const snap = baseSnapshot({
      orders: [
        {
          id: "o4",
          buyerOrganizationId: "b4",
          relationshipId: "r4",
          totalAmount: 500_000,
          currency: "XOF",
          paymentStatus: PaymentStatus.PAID,
          status: OrderStatus.COMPLETED,
          deliveryStatus: "DELIVERED",
          createdAt: new Date(),
          updatedAt: new Date(),
          buyer: {
            id: "b4",
            displayName: "Buyer D",
            city: "Dakar",
            country: "SN",
            credibilityScore: 0.8,
            category: "RETAILER",
          },
          relationship: { id: "r4", trustLevel: 0.8, status: RelationshipStatus.ACCEPTED },
        },
      ],
    });
    const overview = overviewSvc.build(snap, true);
    const paymentPressure = pressureSvc.build(snap, true);
    const receivablesHealth = recvSvc.build(snap, true);
    const paymentBehavior = behaviorSvc.build(snap, true);
    const walletLiquidity = walletSvc.build(snap, true);
    const creditRisk = creditSvc.build(snap, true);
    const cashflow = cashflowSvc.build(snap, true);
    const paymentAnomalies = anomaliesSvc.build(snap, true);
    const collectionPriorities = prioSvc.build(snap, true);
    const briefing = {
      provider: "MockAIProvider" as const,
      policy: "ACTIVE" as const,
      title: "t",
      executiveSummary: "e",
      liquidityNote: "l",
      receivablesNote: "r",
      paymentInstabilityNote: "p",
      creditExposureNote: "c",
      recommendedCollectionMoves: ["a"],
      confidence: 0.7,
      dataSources: ["x"],
      tone: "finance_strategist" as const,
      note: "n",
    };
    const interventions = interventionsSvc.synthesize({
      organizationId: snap.organizationId,
      generatedAt: snap.generatedAt,
      overview,
      paymentPressure,
      creditRisk,
      wallet: walletLiquidity,
      priorities: collectionPriorities,
    });
    const packed = {
      version: "1" as const,
      generatedAt: snap.generatedAt,
      organizationId: snap.organizationId,
      overview,
      paymentPressure,
      receivablesHealth,
      paymentBehavior,
      walletLiquidity,
      creditRisk,
      cashflow,
      paymentAnomalies,
      collectionPriorities,
      briefing,
      interventions,
    };
    expect(FinanceCollectionsBundleResponseSchema.safeParse(packed).success).toBe(true);
  });
});
