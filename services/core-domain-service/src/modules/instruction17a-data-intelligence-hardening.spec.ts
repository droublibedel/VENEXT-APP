import { describe, expect, it } from "vitest";
import { PaymentStatus, RelationshipStatus, ShipmentStatus } from "@prisma/client";
import { CrossPoleCorrelationService } from "./data-intelligence/cross-pole-correlation/cross-pole-correlation.service";
import type { DataIntelligenceCrossCutSnapshot } from "./data-intelligence/data-intelligence-data.service";
import { MarketingActivationSummaryAdapter } from "./data-intelligence/adapters/marketing-activation-summary.adapter";
import { PredictiveSignalsService } from "./data-intelligence/predictive-signals/predictive-signals.service";
import { StrategicIntelligenceSummaryAdapter } from "./data-intelligence/adapters/strategic-intelligence-summary.adapter";
import { GraphIntelligenceService } from "./data-intelligence/graph-intelligence/graph-intelligence.service";
import { IntelligenceInterventionsService } from "./data-intelligence/intelligence-interventions/intelligence-interventions.service";

describe("Instruction 17A — adapters expose source + availability", () => {
  it("strategic adapter returns disabled envelope when flag off", async () => {
    const flags = { isEnabled: async () => false } as never;
    const adapter = new StrategicIntelligenceSummaryAdapter(flags, {} as never, {} as never, {} as never);
    const out = await adapter.build("00000000-0000-0000-0000-000000000001");
    expect(out.available).toBe(false);
    expect(out.source).toContain("disabled");
  });

  it("marketing adapter returns disabled envelope when flag off", async () => {
    const flags = { isEnabled: async () => false } as never;
    const adapter = new MarketingActivationSummaryAdapter(flags, {} as never, {} as never, {} as never);
    const out = await adapter.buildFromCommercialContext({ organizationId: "x" } as never);
    expect(out.available).toBe(false);
    expect(out.source).toContain("disabled");
  });
});

describe("Instruction 17A — campaign_logistics_correlation", () => {
  it("emits when marketing summary available and logistics pressure sufficient", () => {
    const svc = new CrossPoleCorrelationService();
    const snap = {
      organizationId: "o",
      generatedAt: "t",
      marketingSummary: {
        available: true,
        source: "test",
        keySignals: [],
        riskSignals: [],
        opportunitySignals: [],
        territorySignals: [],
        confidence: 0.7,
        metrics: { activationVelocity: 0.4, territoryStimulation: 0.5, commercialExcitation: 0.2, sponsorshipPressure: 0.3, campaignEffectiveness: 0.5 },
      },
      supply: {
        shipments: [
          { shipmentStatus: ShipmentStatus.DELAYED },
          { shipmentStatus: ShipmentStatus.DELAYED },
          { shipmentStatus: ShipmentStatus.IN_TRANSIT },
          { shipmentStatus: ShipmentStatus.IN_TRANSIT },
        ],
        orders: Array.from({ length: 15 }, () => ({ id: "x" })),
        orgGeo: new Map([["a", "SN / Dakar"]]),
        economicSignals: [],
      },
      orderAdv: { orders: [], negotiations: [], groupSessions: [] },
      finance: { orders: [] },
      commercial: { relationships: [] },
      strategicSummary: { available: false, source: "x", keySignals: [], riskSignals: [], opportunitySignals: [], territorySignals: [], confidence: 0 },
      negotiationMetrics: { openNegotiationsCount: 0, stalledNegotiationsCount: 0, totalNegotiationsCount: 0 },
      graphTraversal: { visitedCount: 0, exploredEdges: 0, truncated: false },
    } as unknown as DataIntelligenceCrossCutSnapshot;
    const out = svc.build(snap, true);
    expect(out.rows.some((r) => r.kind === "campaign_logistics_correlation")).toBe(true);
  });
});

describe("Instruction 17A — predictive negotiation metrics", () => {
  it("negotiation_collapse triggers from openNegotiationsCount not total alone", () => {
    const svc = new PredictiveSignalsService();
    const base = {
      organizationId: "o",
      generatedAt: "t",
      finance: { orders: [] },
      orderAdv: { orders: [], negotiations: [], groupSessions: [] },
      supply: { shipments: [], orders: [], economicSignals: [] },
      commercial: { relationships: [], partnersPack: { edges: [], counterparties: [] } },
      strategicSummary: { available: false, source: "x", keySignals: [], riskSignals: [], opportunitySignals: [], territorySignals: [], confidence: 0 },
      marketingSummary: { available: false, source: "x", keySignals: [], riskSignals: [], opportunitySignals: [], territorySignals: [], confidence: 0 },
      economicSignals7d: 0,
      graphTraversal: { visitedCount: 0, exploredEdges: 0, truncated: false },
    };
    const lowOpen = {
      ...base,
      negotiationMetrics: { openNegotiationsCount: 2, stalledNegotiationsCount: 0, totalNegotiationsCount: 40 },
    } as unknown as DataIntelligenceCrossCutSnapshot;
    const highOpen = {
      ...base,
      negotiationMetrics: { openNegotiationsCount: 8, stalledNegotiationsCount: 0, totalNegotiationsCount: 8 },
    } as unknown as DataIntelligenceCrossCutSnapshot;
    expect(svc.build(lowOpen, true, true).signals.some((s) => s.kind === "negotiation_collapse")).toBe(false);
    expect(svc.build(highOpen, true, true).signals.some((s) => s.kind === "negotiation_collapse")).toBe(true);
  });

  it("includes new predictive kinds when inputs satisfied", () => {
    const svc = new PredictiveSignalsService();
    const snap = {
      organizationId: "o",
      generatedAt: "t",
      finance: { orders: [{ paymentStatus: PaymentStatus.UNPAID }, { paymentStatus: PaymentStatus.UNPAID }] },
      orderAdv: { orders: [], negotiations: [], groupSessions: [] },
      supply: {
        shipments: [
          { shipmentStatus: ShipmentStatus.IN_TRANSIT },
          { shipmentStatus: ShipmentStatus.IN_TRANSIT },
          { shipmentStatus: ShipmentStatus.IN_TRANSIT },
        ],
        orders: Array.from({ length: 12 }, () => ({})),
        economicSignals: [],
      },
      commercial: { relationships: [], partnersPack: { edges: [], counterparties: [] } },
      strategicSummary: {
        available: true,
        source: "s",
        keySignals: [],
        riskSignals: [],
        opportunitySignals: [],
        territorySignals: [],
        confidence: 0.8,
        metrics: { distributionTension: 0.55, strategicHealth: 0.4, signalDensityRatio: 1, radarInternalCount: 1 },
      },
      marketingSummary: {
        available: true,
        source: "m",
        keySignals: [],
        riskSignals: [],
        opportunitySignals: [],
        territorySignals: [],
        confidence: 0.8,
        metrics: { campaignEffectiveness: 0.2, territoryStimulation: 0.6, activationVelocity: 0.1, sponsorshipPressure: 0.2, commercialExcitation: 0.2 },
      },
      negotiationMetrics: { openNegotiationsCount: 0, stalledNegotiationsCount: 0, totalNegotiationsCount: 0 },
      economicSignals7d: 30,
      graphTraversal: { visitedCount: 0, exploredEdges: 0, truncated: false },
    } as unknown as DataIntelligenceCrossCutSnapshot;
    const kinds = svc.build(snap, true, true).signals.map((x) => x.kind);
    expect(kinds).toContain("risk_escalation");
    expect(kinds).toContain("campaign_fatigue");
    expect(kinds).toContain("distribution_slowdown");
  });
});

describe("Instruction 17A — graph intelligence labels engine reuse", () => {
  it("includes graphEngineReuse when graph enabled", () => {
    const svc = new GraphIntelligenceService();
    const snap = {
      organizationId: "o",
      generatedAt: "t",
      commercial: {
        relationships: [{ id: "r1", status: RelationshipStatus.ACCEPTED, trustLevel: 0.8 }],
        partnersPack: {
          edges: [{ upstreamOrganizationId: "o", downstreamOrganizationId: "p1" }],
          counterparties: [{ id: "p1", credibilityScore: 0.9 }],
        },
      },
      finance: { orders: [] },
      orderAdv: { orders: [], negotiations: [], groupSessions: [] },
      supply: { shipments: [], orders: [], economicSignals: [] },
      strategicSummary: { available: false, source: "x", keySignals: [], riskSignals: [], opportunitySignals: [], territorySignals: [], confidence: 0 },
      marketingSummary: { available: false, source: "x", keySignals: [], riskSignals: [], opportunitySignals: [], territorySignals: [], confidence: 0 },
      negotiationMetrics: { openNegotiationsCount: 0, stalledNegotiationsCount: 0, totalNegotiationsCount: 0 },
      economicSignals7d: 0,
      graphTraversal: { visitedCount: 120, exploredEdges: 80, truncated: false },
    } as unknown as DataIntelligenceCrossCutSnapshot;
    const out = svc.build(snap, true, true);
    expect(out.graphEngineReuse).toMatch(/RelationalCommerceNetworkTraverserService|CommercialRelationshipGraphEngineService/);
    expect(out.weakClusters).toBeDefined();
  });
});

describe("Instruction 17A — intervention kinds", () => {
  it("emits reinforce_relationship_cluster, stabilize_distribution_flow, reduce_prediction_risk when thresholds met", () => {
    const svc = new IntelligenceInterventionsService();
    const snap = {
      organizationId: "o",
      generatedAt: "t",
      commercial: {
        relationships: Array.from({ length: 45 }, (_, i) => ({
          id: `r${i}`,
          status: RelationshipStatus.ACCEPTED,
          trustLevel: i % 5 === 0 ? 0.35 : 0.8,
        })),
        partnersPack: {
          edges: Array.from({ length: 10 }, (_, i) => ({ upstreamOrganizationId: "o", downstreamOrganizationId: `p${i}` })),
          counterparties: [
            { id: "p0", credibilityScore: 0.3 },
            { id: "p1", credibilityScore: 0.28 },
            { id: "p2", credibilityScore: 0.9 },
          ],
        },
      },
      finance: { orders: [] },
      orderAdv: { orders: [], negotiations: [], groupSessions: [] },
      supply: {
        shipments: [
          { shipmentStatus: ShipmentStatus.IN_TRANSIT },
          { shipmentStatus: ShipmentStatus.IN_TRANSIT },
          { shipmentStatus: ShipmentStatus.IN_TRANSIT },
          { shipmentStatus: ShipmentStatus.IN_TRANSIT },
        ],
        orders: [],
        economicSignals: [],
        orgGeo: new Map(),
        groupSessions: [],
        economicStates: [],
        deliveryThreadIds: [],
        deliveryMessageVolume: 0,
      },
      strategicSummary: { available: false, source: "x", keySignals: [], riskSignals: [], opportunitySignals: [], territorySignals: [], confidence: 0 },
      marketingSummary: {
        available: true,
        source: "m",
        keySignals: [],
        riskSignals: [],
        opportunitySignals: [],
        territorySignals: [],
        confidence: 0.7,
        metrics: {
          activationVelocity: 0.1,
          territoryStimulation: 0.5,
          commercialExcitation: 0.2,
          sponsorshipPressure: 0.2,
          campaignEffectiveness: 0.4,
        },
      },
      negotiationMetrics: { openNegotiationsCount: 8, stalledNegotiationsCount: 0, totalNegotiationsCount: 8 },
      economicSignals7d: 30,
      graphTraversal: { visitedCount: 0, exploredEdges: 0, truncated: false },
    } as unknown as DataIntelligenceCrossCutSnapshot;
    const kinds = svc.synthesize(snap, true).interventions.map((i) => i.kind);
    expect(kinds).toContain("reinforce_relationship_cluster");
    expect(kinds).toContain("stabilize_distribution_flow");
    expect(kinds).toContain("reduce_prediction_risk");
  });
});
