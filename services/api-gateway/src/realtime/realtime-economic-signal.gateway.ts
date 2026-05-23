import { OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import type { Server, WebSocket } from "ws";
import type {
  CommercialCorridorRealtimeDto,
  RelationalCartRealtimeDto,
  RelationalOrderExecutionRealtimeDto,
  RelationalSectorRealtimeFanoutBodyDto,
  RelationalEconomicContinuityRealtimeDto,
  RelationalMacroObservatoryGovernanceRealtimeDto,
  RelationalStrategicObservatoryRealtimeDto,
  RelationalGlobalExecutiveSupervisionRealtimeDto,
  RelationalExecutiveStrategicSynthesisRealtimeDto,
  RelationalExecutiveControlRoomRealtimeDto,
  RelationalExecutiveOperationsRealtimeDto,
  RelationalStrategicCommandRealtimeDto,
  RelationalStrategicIntelligenceRealtimeDto,
  RelationalInstitutionalReportingRealtimeDto,
  RelationalExecutiveOrchestrationRealtimeDto,
  RelationalEconomicMonitoringRealtimeDto,
  RelationalEconomicStabilizationRealtimeDto,
  RelationalEconomicArbitrationRealtimeDto,
  RelationalEconomicGovernanceRealtimeDto,
  RelationalEconomicRecoveryRealtimeDto,
  RelationalEconomicSovereigntyRealtimeDto,
  RelationalMacroEconomicRealtimeDto,
  RelationalSupplyFlowRealtimeDto,
} from "@venext/shared-contracts";
import {
  CommercialCorridorRealtimeSchema,
  RelationalCartRealtimeSchema,
  RelationalFulfillmentRealtimeSchema,
  type RelationalFulfillmentRealtimeDto,
  RelationalOrderExecutionRealtimeSchema,
  RelationalEconomicContinuityRealtimeSchema,
  RelationalMacroObservatoryGovernanceRealtimeSchema,
  RelationalStrategicObservatoryRealtimeSchema,
  RelationalGlobalExecutiveSupervisionRealtimeSchema,
  RelationalExecutiveStrategicSynthesisRealtimeSchema,
  RelationalExecutiveControlRoomRealtimeSchema,
  RelationalExecutiveOperationsRealtimeSchema,
  RelationalStrategicCommandRealtimeSchema,
  RelationalStrategicIntelligenceRealtimeSchema,
  RelationalInstitutionalReportingRealtimeSchema,
  RelationalExecutiveOrchestrationRealtimeSchema,
  RelationalEconomicMonitoringRealtimeSchema,
  RelationalEconomicStabilizationRealtimeSchema,
  RelationalEconomicArbitrationRealtimeSchema,
  RelationalEconomicGovernanceRealtimeSchema,
  RelationalEconomicRecoveryRealtimeSchema,
  RelationalEconomicSovereigntyRealtimeSchema,
  RelationalMacroEconomicRealtimeSchema,
  RelationalSupplyFlowRealtimeSchema,
  safeParseRelationalSectorRealtimeBody,
} from "@venext/shared-contracts";

import { isRealtimeSubscribeAuthStrict, validateRealtimeSubscribeAuth } from "./realtime-ws-subscribe-auth";

/** Instruction 18.7A — gateway demo ticks only; `live.*` reserved for core domain fan-in (DOMAIN_LIVE). */
export const INDUSTRIAL_OPERATIONAL_CONTINUITY_SYNTHETIC_TICK_DEMO_TYPES = [
  "demo.industrial_operational_continuity.synthetic_tick.stability",
  "demo.industrial_operational_continuity.synthetic_tick.cadence",
] as const;

/** Instruction 18.8 — gateway demo ticks only; `live.*` = core fan-in (DOMAIN_LIVE). */
export const INDUSTRIAL_EVIDENCE_SYNTHETIC_TICK_DEMO_TYPES = ["demo.industrial_evidence.synthetic_tick.registry"] as const;

/** Instruction 19.1 — commercial relationship graph demo tick (gateway-only synthetic). */
export const COMMERCIAL_RELATIONSHIP_GRAPH_SYNTHETIC_TICK_DEMO_TYPES = [
  "demo.commercial_relationship_graph.synthetic_tick.network",
] as const;

/** Instruction 19.2 — relational catalog demo tick (synthetic only; never mimics live inventory). */
export const RELATIONAL_CATALOG_SYNTHETIC_TICK_DEMO_TYPES = [
  "demo.relational_catalog.synthetic_tick.visibility_mirror",
] as const;

/** Instruction 20.0 — relational orders demo tick (synthetic mirror; no live logistics PSP). */
export const RELATIONAL_ORDERS_SYNTHETIC_TICK_DEMO_TYPES = [
  "demo.relational_orders.synthetic_tick.corridor_mirror",
] as const;

/** Instruction 20.3 — commercial trust demo tick (gateway-only synthetic). */
export const COMMERCIAL_TRUST_SYNTHETIC_TICK_DEMO_TYPES = [
  "demo.commercial_trust.synthetic_tick.corridor_mirror",
] as const;

/** Instruction 20.5 — relational cart demo tick (synthetic; not checkout / marketplace). */
export const RELATIONAL_CART_SYNTHETIC_TICK_DEMO_TYPES = [
  "demo.relational_cart.synthetic_tick.corridor_mirror",
] as const;

/** Instruction 20.4 — corridor intelligence demo tick (gateway-only synthetic). */
export const CORRIDOR_INTELLIGENCE_SYNTHETIC_TICK_DEMO_TYPES = [
  "demo.corridor_intelligence.synthetic_tick.corridor_mirror",
] as const;

export type SignalPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type OperationalSignalEvent = {
  id: string;
  pole?: string;
  priority: SignalPriority;
  label: string;
  detail: string;
  ts: string;
  /** Instruction 18.5A — economic-command row classification for client UX honesty. */
  economicCommandRealtimeClass?: "DOMAIN_LIVE" | "DEMO_MIRROR" | "SYNTHETIC_TICK";
  /** Instruction 18.6 — industrial situation room row classification. */
  industrialSituationRoomRealtimeClass?: "DOMAIN_LIVE" | "DEMO_MIRROR" | "SYNTHETIC_TICK";
  /** Instruction 18.7 — industrial operational continuity row classification. */
  industrialOperationalContinuityRealtimeClass?: "DOMAIN_LIVE" | "DEMO_MIRROR" | "SYNTHETIC_TICK";
  /** Instruction 18.8 — industrial evidence registry stream classification. */
  industrialEvidenceRealtimeClass?: "DOMAIN_LIVE" | "DEMO_MIRROR" | "SYNTHETIC_TICK";
  /** Instruction 19.1 — commercial relationship graph stream classification. */
  commercialRelationshipGraphRealtimeClass?: "DOMAIN_LIVE" | "DEMO_MIRROR" | "SYNTHETIC_TICK";
  /** Instruction 19.2 — relational catalog stream classification. */
  relationalCatalogRealtimeClass?: "DOMAIN_LIVE" | "DEMO_MIRROR" | "SYNTHETIC_TICK";
  /** Instruction 20.0 — relational orders stream classification. */
  relationalOrdersRealtimeClass?: "DOMAIN_LIVE" | "DEMO_MIRROR" | "SYNTHETIC_TICK";
  /** Instruction 20.3 — commercial trust (private heuristics) stream classification. */
  commercialTrustRealtimeClass?: "DOMAIN_LIVE" | "DEMO_MIRROR" | "SYNTHETIC_TICK";
  /** Instruction 20.4 — corridor intelligence stream classification. */
  corridorIntelligenceRealtimeClass?: "DOMAIN_LIVE" | "DEMO_MIRROR" | "SYNTHETIC_TICK";
  /** Instruction 20.5 — relational cart stream classification. */
  relationalCartRealtimeClass?: "DOMAIN_LIVE" | "DEMO_MIRROR" | "SYNTHETIC_TICK";
  /**
   * Instruction 20.3A — minimal client payload for commercial trust domain events (no metadata, no raw HTTP body).
   */
  commercialTrustRealtimePayload?: {
    organizationId: string;
    relationshipId: string | null;
    trustLevel: string;
    changedSignals: string[];
    heuristicOnly: true;
    computedAt: string;
  };
  /** Instruction 20.4 — corridor realtime payload (Zod-validated at gateway). */
  corridorIntelligenceRealtimePayload?: CommercialCorridorRealtimeDto;
  /** Instruction 20.5 — relational cart realtime payload (Zod-validated at gateway). */
  relationalCartRealtimePayload?: RelationalCartRealtimeDto;
  /** Instruction 20.8 — relational order execution realtime payload (Zod-validated at gateway). */
  relationalOrderExecutionRealtimePayload?: RelationalOrderExecutionRealtimeDto;
  /** Instruction 20.24 — sector intelligence realtime payload (legacy minimal or structured snapshot/delta). */
  relationalSectorRealtimePayload?: RelationalSectorRealtimeFanoutBodyDto;
  /** Instruction 20.33 — economic monitoring realtime payload (strict minimal, non-autopilot). */
  relationalEconomicMonitoringRealtimePayload?: RelationalEconomicMonitoringRealtimeDto;
  /** Instruction 20.32 — economic stabilization realtime payload (strict minimal, non-autopilot). */
  relationalEconomicStabilizationRealtimePayload?: RelationalEconomicStabilizationRealtimeDto;
  /** Instruction 20.31 — economic arbitration realtime payload (strict minimal, non-autopilot). */
  relationalEconomicArbitrationRealtimePayload?: RelationalEconomicArbitrationRealtimeDto;
  /** Instruction 20.30 — economic governance realtime payload (strict minimal, non-autopilot). */
  relationalEconomicGovernanceRealtimePayload?: RelationalEconomicGovernanceRealtimeDto;
  /** Instruction 20.29 — recovery planning realtime payload (strict minimal, non-autopilot). */
  relationalEconomicRecoveryRealtimePayload?: RelationalEconomicRecoveryRealtimeDto;
  /** Instruction 20.27 — economic sovereignty realtime payload (strict minimal). */
  relationalEconomicSovereigntyRealtimePayload?: RelationalEconomicSovereigntyRealtimeDto;
  relationalEconomicContinuityRealtimePayload?: RelationalEconomicContinuityRealtimeDto;
  relationalMacroEconomicRealtimePayload?: RelationalMacroEconomicRealtimeDto;
  /** Instruction 20.24 — supply flow intelligence realtime payload (strict minimal). */
  relationalSupplyFlowRealtimePayload?: RelationalSupplyFlowRealtimeDto;
};

/** Instruction 20.3A — strip domain fan-in body to a corridor-safe realtime payload (gateway boundary). */
export function extractCommercialTrustRealtimePayload(
  _eventType: string,
  body: Record<string, unknown> | undefined,
): OperationalSignalEvent["commercialTrustRealtimePayload"] {
  if (!body || typeof body !== "object") return undefined;
  if (body.heuristicOnly !== true) return undefined;
  const allowedKeys = new Set([
    "organizationId",
    "relationshipId",
    "trustLevel",
    "changedSignals",
    "heuristicOnly",
    "computedAt",
  ]);
  for (const k of Object.keys(body)) {
    if (!allowedKeys.has(k)) return undefined;
  }
  const organizationId = typeof body.organizationId === "string" ? body.organizationId.trim() : "";
  if (!organizationId) return undefined;
  const trustLevel = typeof body.trustLevel === "string" && body.trustLevel.trim() ? body.trustLevel.trim() : "UNKNOWN";
  const changedSignals = Array.isArray(body.changedSignals)
    ? body.changedSignals.filter((x): x is string => typeof x === "string").slice(0, 24)
    : [];
  const computedAtRaw = typeof body.computedAt === "string" ? body.computedAt.trim() : "";
  const computedAt = computedAtRaw || new Date().toISOString();
  const relationshipId =
    typeof body.relationshipId === "string" && body.relationshipId.trim() ? body.relationshipId.trim() : null;
  return {
    organizationId,
    relationshipId,
    trustLevel,
    changedSignals,
    heuristicOnly: true,
    computedAt,
  };
}

/** Instruction 20.4B — strict Zod for corridor domain fan-in (no trust scores, no orders). */
export function extractCorridorIntelligenceRealtimePayload(
  _eventType: string,
  body: Record<string, unknown> | undefined,
): CommercialCorridorRealtimeDto | undefined {
  if (!body || typeof body !== "object") return undefined;
  if (body.heuristicOnly !== true) return undefined;
  if (body.privateEconomicCorridor !== true) return undefined;
  if (body.publicRankingDisabled !== true) return undefined;
  if (body.marketplaceExposureDisabled !== true) return undefined;
  const parsed = CommercialCorridorRealtimeSchema.safeParse(body);
  return parsed.success ? parsed.data : undefined;
}

/** Instruction 20.5 — relational cart domain fan-in (minimal corridor-safe payload). */
export function extractRelationalCartRealtimePayload(
  _eventType: string,
  body: Record<string, unknown> | undefined,
): RelationalCartRealtimeDto | undefined {
  if (!body || typeof body !== "object") return undefined;
  const parsed = RelationalCartRealtimeSchema.safeParse(body);
  return parsed.success ? parsed.data : undefined;
}

type ClientState = {
  poles: Set<string>;
  organizationId?: string;
  /** Instruction 15A — org binding after successful subscribe auth (if enforced). */
  subscribeAuthOrgId?: string;
  /** Throttle outbound batches (Instruction 5 §9). */
  lastSentAt: number;
};

/**
 * Realtime economic / operational signal gateway (Instruction 5 §8).
 * Raw WebSocket — clients JSON.subscribe for pole-specific streams.
 *
 * **Instruction 9B — demo vs live**
 * - Demo: `session.open` uses `demo.realtime.economic_signals`; batches use `demo.operational.signal.batch`.
 * - Live (future bridge from core): `live.economic.signal`, `live.relationship.event`,
 *   `live.catalog.visibility.changed` — only persisted / domain-driven payloads.
 */
@WebSocketGateway({ path: "/realtime" })
export class RealtimeEconomicSignalGateway
  implements
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnModuleInit,
    OnModuleDestroy
{
  @WebSocketServer()
  server!: Server;

  private readonly clients = new Map<WebSocket, ClientState>();

  private tick?: ReturnType<typeof setInterval>;
  /** Instruction 12A — commercial pole contract (demo + occasional live-shaped frame). */
  private commercialRound = 0;
  private readonly commercialDemoTypes = [
    "demo.commercial.relationship.event",
    "demo.commercial.retailer.pressure",
    "demo.commercial.sponsorship.spike",
  ] as const;

  /** Instruction 13 — marketing / activation pole (same WS path, throttled batches). */
  private marketingRound = 0;
  private readonly marketingDemoTypes = [
    "demo.marketing.sponsorship.spike",
    "demo.marketing.activation.burst",
    "demo.marketing.momentum.shift",
    "demo.marketing.retailer.engagement.burst",
    "demo.marketing.campaign.pressure",
  ] as const;

  /** Instruction 14 — orders / ADV pole (throttled, same tick cadence). */
  private orderAdvRound = 0;
  private readonly orderAdvDemoTypes = [
    "demo.order_adv.negotiation.burst",
    "demo.order_adv.group_buying.spike",
    "demo.order_adv.reservation.pressure",
    "demo.order_adv.delivery.instability",
    "demo.order_adv.conversational.commerce",
  ] as const;

  /** Instruction 15 — supply / logistics pole. */
  private supplyLogisticsRound = 0;
  private readonly supplyLogisticsDemoTypes = [
    "demo.supply_logistics.shipment.instability",
    "demo.supply_logistics.territory.congestion",
    "demo.supply_logistics.route.overload",
    "demo.supply_logistics.warehouse.saturation",
    "demo.supply_logistics.loading.anomaly",
    "demo.supply_logistics.fulfillment.degradation",
  ] as const;

  /** Instruction 16 — finance / encaissements pole. */
  private financeCollectionsRound = 0;
  private readonly financeCollectionsDemoTypes = [
    "demo.finance_collections.payment.instability",
    "demo.finance_collections.overdue.escalation",
    "demo.finance_collections.liquidity.degraded",
    "demo.finance_collections.settlement.anomaly",
    "demo.finance_collections.collection.acceleration",
    "demo.finance_collections.credit.warning",
  ] as const;

  /** Instruction 17 — data / economic intelligence pole. */
  private dataIntelligenceRound = 0;
  private readonly dataIntelligenceDemoTypes = [
    "demo.data_intelligence.propagation.trace",
    "demo.data_intelligence.correlation.spike",
    "demo.data_intelligence.anomaly.pulse",
    "demo.data_intelligence.predictive.cone",
    "demo.data_intelligence.graph.stress",
  ] as const;

  /** Instruction 18.1 — economic propagation engine (same WS path / tick cadence). */
  private economicPropagationRound = 0;
  private readonly economicPropagationDemoTypes = [
    "demo.economic_propagation.shock.detected",
    "demo.economic_propagation.chain.updated",
    "demo.economic_propagation.territory.fragile",
  ] as const;

  /** Instruction 18.2 — industrial economic memory pole. */
  private economicMemoryRound = 0;
  private readonly economicMemoryDemoTypes = [
    "demo.economic_memory.snapshot.persisted",
    "demo.economic_memory.crisis.signature",
    "demo.economic_memory.pattern.recurrence",
    "demo.economic_memory.temporal.volatility",
  ] as const;

  /** Instruction 18.3 — economic scenario engine pole. */
  private economicScenariosRound = 0;
  private readonly economicScenariosDemoTypes = [
    "demo.economic_scenarios.bundle.refreshed",
    "demo.economic_scenarios.trajectory.shift",
    "demo.economic_scenarios.risk.lattice",
    "demo.economic_scenarios.comparison.delta",
  ] as const;

  /** Instruction 18.4 — economic coordination orchestration pole. */
  private economicCoordinationRound = 0;
  private readonly economicCoordinationDemoTypes = [
    "demo.economic_coordination.bundle.refreshed",
    "demo.economic_coordination.posture.shift",
    "demo.economic_coordination.conflict.matrix",
    "demo.economic_coordination.escalation.pulse",
  ] as const;

  /** Instruction 18.5 — economic command executive cockpit (advisory readout). */
  private economicCommandRound = 0;
  private readonly economicCommandDemoTypes = [
    "demo.economic_command.pressure.updated",
    "demo.economic_command.arbitration.detected",
    "demo.economic_command.system_stress.changed",
  ] as const;

  /** Instruction 18.6 — industrial situation room (symbolic crisis cockpit). */
  private industrialSituationRoomRound = 0;
  private readonly industrialSituationRoomDemoTypes = [
    "demo.industrial_situation_room.situation.updated",
    "demo.industrial_situation_room.missions.changed",
  ] as const;

  /** Instruction 18.7 — industrial operational continuity (stability / cadence readouts). */
  private industrialOperationalContinuityRound = 0;
  private readonly industrialOperationalContinuityDemoTypes = INDUSTRIAL_OPERATIONAL_CONTINUITY_SYNTHETIC_TICK_DEMO_TYPES;
  private industrialEvidenceRound = 0;
  private readonly industrialEvidenceDemoTypes = INDUSTRIAL_EVIDENCE_SYNTHETIC_TICK_DEMO_TYPES;
  private commercialRelationshipGraphRound = 0;
  private readonly commercialRelationshipGraphDemoTypes = COMMERCIAL_RELATIONSHIP_GRAPH_SYNTHETIC_TICK_DEMO_TYPES;
  private relationalCatalogRound = 0;
  private readonly relationalCatalogDemoTypes = RELATIONAL_CATALOG_SYNTHETIC_TICK_DEMO_TYPES;
  private relationalOrdersRound = 0;
  private readonly relationalOrdersDemoTypes = RELATIONAL_ORDERS_SYNTHETIC_TICK_DEMO_TYPES;
  private commercialTrustRound = 0;
  private readonly commercialTrustDemoTypes = COMMERCIAL_TRUST_SYNTHETIC_TICK_DEMO_TYPES;
  private corridorIntelligenceRound = 0;
  private readonly corridorIntelligenceDemoTypes = CORRIDOR_INTELLIGENCE_SYNTHETIC_TICK_DEMO_TYPES;
  private relationalCartRound = 0;
  private readonly relationalCartDemoTypes = RELATIONAL_CART_SYNTHETIC_TICK_DEMO_TYPES;

  onModuleInit() {
    this.tick = setInterval(() => this.broadcastBatches(), 4000);
  }

  onModuleDestroy() {
    if (this.tick) clearInterval(this.tick);
  }

  handleConnection(client: WebSocket) {
    this.clients.set(client, { poles: new Set(), lastSentAt: 0 });
    client.send(
      JSON.stringify({
        type: "session.open",
        channel: "demo.realtime.economic_signals",
        mode: "demo",
        networkQualityHint: "unknown",
      }),
    );

    client.on("message", (raw) => {
      try {
        const msg = JSON.parse(String(raw)) as {
          type?: string;
          poles?: string[];
          organizationId?: string;
          auth?: { organizationId?: string; token?: string };
          networkQuality?: string;
        };
        if (msg.type === "subscribe" && Array.isArray(msg.poles)) {
          const auth = validateRealtimeSubscribeAuth(msg);
          if (!auth.ok) {
            client.send(
              JSON.stringify({
                type: "subscribe.rejected",
                reason: auth.reason,
                channelLabel: "venext.realtime",
                demoEligible: process.env.NODE_ENV !== "production",
              }),
            );
            return;
          }
          const st = this.clients.get(client);
          if (st) {
            st.poles = new Set(msg.poles.map((p) => p.toUpperCase()));
            st.organizationId = auth.organizationId ?? msg.organizationId;
            st.subscribeAuthOrgId = auth.organizationId;
          }
          client.send(
            JSON.stringify({
              type: "subscribe.ack",
              poles: msg.poles,
              priorityRouting: "enabled",
              authMode: isRealtimeSubscribeAuthStrict() ? "strict" : "open",
            }),
          );
        }
        if (msg.type === "ping") {
          client.send(JSON.stringify({ type: "pong", ts: new Date().toISOString() }));
        }
      } catch {
        // ignore malformed
      }
    });
  }

  handleDisconnect(client: WebSocket) {
    this.clients.delete(client);
  }

  /**
   * Instruction 14A — domain analysis / mutation fan-in from core-domain (HTTP), forwarded to ORDERS_ADV subscribers.
   */
  ingestOrderAdvDomainSignal(payload: {
    organizationId: string;
    eventType: string;
    source: string;
    body?: Record<string, unknown>;
  }) {
    const items: OperationalSignalEvent[] = [
      {
        id: `oadv-domain-${payload.eventType}-${Date.now()}`,
        pole: "ORDERS_ADV",
        priority: "HIGH",
        label: `Domain — ${payload.eventType}`,
        detail:
          typeof payload.body === "object" && payload.body
            ? JSON.stringify({ source: payload.source, ...payload.body }).slice(0, 480)
            : payload.source,
        ts: new Date().toISOString(),
      },
    ];
    const envelope = JSON.stringify({
      type: payload.eventType,
      channel: "live.order_adv.v1",
      organizationId: payload.organizationId,
      source: payload.source,
      items,
    });
    for (const [ws, st] of this.clients) {
      if (!st.poles.has("ORDERS_ADV")) continue;
      if (payload.organizationId && st.organizationId && st.organizationId !== payload.organizationId) continue;
      try {
        ws.send(envelope);
      } catch {
        this.clients.delete(ws);
      }
    }
  }

  /**
   * Instruction 15A — domain-derived supply / logistics frames (core-domain HTTP fan-in).
   */
  /**
   * Instruction 16 — domain-derived finance / encaissements frames (core-domain HTTP fan-in).
   */
  /** Instruction 17 — domain-derived data intelligence frames (core-domain HTTP fan-in). */
  ingestDataIntelligenceDomainSignal(payload: {
    organizationId: string;
    eventType: string;
    source: string;
    body?: Record<string, unknown>;
  }) {
    const items: OperationalSignalEvent[] = [
      {
        id: `di-domain-${payload.eventType}-${Date.now()}`,
        pole: "DATA_INTELLIGENCE",
        priority: "HIGH",
        label: `Domain — ${payload.eventType}`,
        detail:
          typeof payload.body === "object" && payload.body
            ? JSON.stringify({ source: payload.source, ...payload.body }).slice(0, 480)
            : payload.source,
        ts: new Date().toISOString(),
      },
    ];
    const envelope = JSON.stringify({
      type: payload.eventType,
      channel: "live.data_intelligence.v1",
      organizationId: payload.organizationId,
      source: payload.source,
      items,
    });
    for (const [ws, st] of this.clients) {
      if (!st.poles.has("DATA_INTELLIGENCE")) continue;
      if (payload.organizationId && st.organizationId && st.organizationId !== payload.organizationId) continue;
      try {
        ws.send(envelope);
      } catch {
        this.clients.delete(ws);
      }
    }
  }

  /** Instruction 18.2 — economic memory persistence / analysis fan-in. */
  ingestEconomicMemoryDomainSignal(payload: {
    organizationId: string;
    eventType: string;
    source: string;
    body?: Record<string, unknown>;
  }) {
    const items: OperationalSignalEvent[] = [
      {
        id: `em-domain-${payload.eventType}-${Date.now()}`,
        pole: "ECONOMIC_MEMORY",
        priority: "HIGH",
        label: `Domain — ${payload.eventType}`,
        detail:
          typeof payload.body === "object" && payload.body
            ? JSON.stringify({ source: payload.source, ...payload.body }).slice(0, 480)
            : payload.source,
        ts: new Date().toISOString(),
      },
    ];
    const envelope = JSON.stringify({
      type: payload.eventType,
      channel: "live.economic_memory.v1",
      organizationId: payload.organizationId,
      source: payload.source,
      items,
    });
    for (const [ws, st] of this.clients) {
      if (!st.poles.has("ECONOMIC_MEMORY")) continue;
      if (payload.organizationId && st.organizationId && st.organizationId !== payload.organizationId) continue;
      try {
        ws.send(envelope);
      } catch {
        this.clients.delete(ws);
      }
    }
  }

  /** Instruction 18.3 — domain-derived economic scenario frames (core-domain HTTP fan-in). */
  ingestEconomicScenariosDomainSignal(payload: {
    organizationId: string;
    eventType: string;
    source: string;
    body?: Record<string, unknown>;
  }) {
    const items: OperationalSignalEvent[] = [
      {
        id: `es-domain-${payload.eventType}-${Date.now()}`,
        pole: "ECONOMIC_SCENARIOS",
        priority: "HIGH",
        label: `Domain — ${payload.eventType}`,
        detail:
          typeof payload.body === "object" && payload.body
            ? JSON.stringify({ source: payload.source, ...payload.body }).slice(0, 480)
            : payload.source,
        ts: new Date().toISOString(),
      },
    ];
    const envelope = JSON.stringify({
      type: payload.eventType,
      channel: "live.economic_scenarios.v1",
      organizationId: payload.organizationId,
      source: payload.source,
      items,
    });
    for (const [ws, st] of this.clients) {
      if (!st.poles.has("ECONOMIC_SCENARIOS")) continue;
      if (payload.organizationId && st.organizationId && st.organizationId !== payload.organizationId) continue;
      try {
        ws.send(envelope);
      } catch {
        this.clients.delete(ws);
      }
    }
  }

  /** Instruction 18.4 — domain-derived economic coordination frames (core-domain HTTP fan-in). */
  ingestEconomicCoordinationDomainSignal(payload: {
    organizationId: string;
    eventType: string;
    source: string;
    body?: Record<string, unknown>;
  }) {
    const items: OperationalSignalEvent[] = [
      {
        id: `ec-domain-${payload.eventType}-${Date.now()}`,
        pole: "ECONOMIC_COORDINATION",
        priority: "HIGH",
        label: `Domain — ${payload.eventType}`,
        detail:
          typeof payload.body === "object" && payload.body
            ? JSON.stringify({ source: payload.source, ...payload.body }).slice(0, 480)
            : payload.source,
        ts: new Date().toISOString(),
      },
    ];
    const envelope = JSON.stringify({
      type: payload.eventType,
      channel: "live.economic_coordination.v1",
      organizationId: payload.organizationId,
      source: payload.source,
      items,
    });
    for (const [ws, st] of this.clients) {
      if (!st.poles.has("ECONOMIC_COORDINATION")) continue;
      if (payload.organizationId && st.organizationId && st.organizationId !== payload.organizationId) continue;
      try {
        ws.send(envelope);
      } catch {
        this.clients.delete(ws);
      }
    }
  }

  /** Instruction 18.5 — domain-derived economic command frames (core-domain HTTP fan-in). */
  ingestEconomicCommandDomainSignal(payload: {
    organizationId: string;
    eventType: string;
    source: string;
    body?: Record<string, unknown>;
  }) {
    const items: OperationalSignalEvent[] = [
      {
        id: `ecmd-domain-${payload.eventType}-${Date.now()}`,
        pole: "ECONOMIC_COMMAND",
        priority: "HIGH",
        label: `Domain — ${payload.eventType}`,
        detail:
          typeof payload.body === "object" && payload.body
            ? JSON.stringify({ source: payload.source, ...payload.body }).slice(0, 480)
            : payload.source,
        ts: new Date().toISOString(),
        economicCommandRealtimeClass: payload.eventType.startsWith("live.") ? "DOMAIN_LIVE" : "DEMO_MIRROR",
      },
    ];
    const envelope = JSON.stringify({
      type: payload.eventType,
      channel: "live.economic_command.v1",
      organizationId: payload.organizationId,
      source: payload.source,
      items,
    });
    for (const [ws, st] of this.clients) {
      if (!st.poles.has("ECONOMIC_COMMAND")) continue;
      if (payload.organizationId && st.organizationId && st.organizationId !== payload.organizationId) continue;
      try {
        ws.send(envelope);
      } catch {
        this.clients.delete(ws);
      }
    }
  }

  /** Instruction 18.6 — domain-derived industrial situation room frames (core-domain HTTP fan-in). */
  ingestIndustrialSituationRoomDomainSignal(payload: {
    organizationId: string;
    eventType: string;
    source: string;
    body?: Record<string, unknown>;
  }) {
    const items: OperationalSignalEvent[] = [
      {
        id: `isr-domain-${payload.eventType}-${Date.now()}`,
        pole: "INDUSTRIAL_SITUATION_ROOM",
        priority: "HIGH",
        label: `Domain — ${payload.eventType}`,
        detail:
          typeof payload.body === "object" && payload.body
            ? JSON.stringify({ source: payload.source, ...payload.body }).slice(0, 480)
            : payload.source,
        ts: new Date().toISOString(),
        industrialSituationRoomRealtimeClass: payload.eventType.startsWith("live.") ? "DOMAIN_LIVE" : "DEMO_MIRROR",
      },
    ];
    const envelope = JSON.stringify({
      type: payload.eventType,
      channel: "live.industrial_situation_room.v1",
      organizationId: payload.organizationId,
      source: payload.source,
      items,
    });
    for (const [ws, st] of this.clients) {
      if (!st.poles.has("INDUSTRIAL_SITUATION_ROOM")) continue;
      if (payload.organizationId && st.organizationId && st.organizationId !== payload.organizationId) continue;
      try {
        ws.send(envelope);
      } catch {
        this.clients.delete(ws);
      }
    }
  }

  /** Instruction 18.7 — domain-derived industrial operational continuity frames (core-domain HTTP fan-in). */
  ingestIndustrialOperationalContinuityDomainSignal(payload: {
    organizationId: string;
    eventType: string;
    source: string;
    body?: Record<string, unknown>;
  }) {
    const items: OperationalSignalEvent[] = [
      {
        id: `ioc-domain-${payload.eventType}-${Date.now()}`,
        pole: "INDUSTRIAL_OPERATIONAL_CONTINUITY",
        priority: "HIGH",
        label: `Domain — ${payload.eventType}`,
        detail:
          typeof payload.body === "object" && payload.body
            ? JSON.stringify({ source: payload.source, ...payload.body }).slice(0, 480)
            : payload.source,
        ts: new Date().toISOString(),
        industrialOperationalContinuityRealtimeClass: payload.eventType.startsWith("live.") ? "DOMAIN_LIVE" : "DEMO_MIRROR",
      },
    ];
    const envelope = JSON.stringify({
      type: payload.eventType,
      channel: "live.industrial_operational_continuity.v1",
      organizationId: payload.organizationId,
      source: payload.source,
      items,
    });
    for (const [ws, st] of this.clients) {
      if (!st.poles.has("INDUSTRIAL_OPERATIONAL_CONTINUITY")) continue;
      if (payload.organizationId && st.organizationId && st.organizationId !== payload.organizationId) continue;
      try {
        ws.send(envelope);
      } catch {
        this.clients.delete(ws);
      }
    }
  }

  /** Instruction 18.8 — domain-derived industrial evidence frames (core-domain HTTP fan-in). */
  ingestIndustrialEvidenceDomainSignal(payload: {
    organizationId: string;
    eventType: string;
    source: string;
    body?: Record<string, unknown>;
  }) {
    const items: OperationalSignalEvent[] = [
      {
        id: `iev-domain-${payload.eventType}-${Date.now()}`,
        pole: "INDUSTRIAL_EVIDENCE",
        priority: "MEDIUM",
        label: `Domain — ${payload.eventType}`,
        detail:
          typeof payload.body === "object" && payload.body
            ? JSON.stringify({ source: payload.source, ...payload.body }).slice(0, 480)
            : payload.source,
        ts: new Date().toISOString(),
        industrialEvidenceRealtimeClass: payload.eventType.includes(".synthetic_tick.")
          ? "SYNTHETIC_TICK"
          : payload.eventType.startsWith("live.")
            ? "DOMAIN_LIVE"
            : "DEMO_MIRROR",
      },
    ];
    const envelope = JSON.stringify({
      type: payload.eventType,
      channel: "live.industrial_evidence.v1",
      organizationId: payload.organizationId,
      source: payload.source,
      items,
    });
    for (const [ws, st] of this.clients) {
      if (!st.poles.has("INDUSTRIAL_EVIDENCE")) continue;
      if (payload.organizationId && st.organizationId && st.organizationId !== payload.organizationId) continue;
      try {
        ws.send(envelope);
      } catch {
        this.clients.delete(ws);
      }
    }
  }

  /** Instruction 19.1 — domain-derived commercial relationship graph frames (core-domain HTTP fan-in). */
  ingestCommercialRelationshipGraphDomainSignal(payload: {
    organizationId: string;
    eventType: string;
    source: string;
    body?: Record<string, unknown>;
  }) {
    const items: OperationalSignalEvent[] = [
      {
        id: `crg-domain-${payload.eventType}-${Date.now()}`,
        pole: "COMMERCIAL_RELATIONSHIP_GRAPH",
        priority: "MEDIUM",
        label: `Domain — ${payload.eventType}`,
        detail:
          typeof payload.body === "object" && payload.body
            ? JSON.stringify({ source: payload.source, ...payload.body }).slice(0, 480)
            : payload.source,
        ts: new Date().toISOString(),
        commercialRelationshipGraphRealtimeClass: payload.eventType.includes(".synthetic_tick.")
          ? "SYNTHETIC_TICK"
          : payload.eventType.startsWith("live.")
            ? "DOMAIN_LIVE"
            : "DEMO_MIRROR",
      },
    ];
    const envelope = JSON.stringify({
      type: payload.eventType,
      channel: "live.commercial_relationship_graph.v1",
      organizationId: payload.organizationId,
      source: payload.source,
      items,
    });
    for (const [ws, st] of this.clients) {
      if (!st.poles.has("COMMERCIAL_RELATIONSHIP_GRAPH")) continue;
      if (payload.organizationId && st.organizationId && st.organizationId !== payload.organizationId) continue;
      try {
        ws.send(envelope);
      } catch {
        this.clients.delete(ws);
      }
    }
  }

  /** Instruction 20.3 — domain-derived commercial trust frames (core-domain HTTP fan-in). */
  ingestCommercialTrustDomainSignal(payload: {
    organizationId: string;
    eventType: string;
    source: string;
    body?: Record<string, unknown>;
  }) {
    const minimal = extractCommercialTrustRealtimePayload(payload.eventType, payload.body);
    const detail = payload.eventType.includes("relationship")
      ? "Commercial relationship signal changed"
      : "Commercial trust signal updated";
    const items: OperationalSignalEvent[] = [
      {
        id: `ctrust-domain-${payload.eventType}-${Date.now()}`,
        pole: "COMMERCIAL_TRUST",
        priority: "MEDIUM",
        label: `Domain — ${payload.eventType}`,
        detail,
        ts: new Date().toISOString(),
        commercialTrustRealtimeClass: payload.eventType.includes(".synthetic_tick.")
          ? "SYNTHETIC_TICK"
          : payload.eventType.startsWith("live.") || payload.eventType.startsWith("commercial.")
            ? "DOMAIN_LIVE"
            : "DEMO_MIRROR",
        ...(minimal ? { commercialTrustRealtimePayload: minimal } : {}),
      },
    ];
    const envelope = JSON.stringify({
      type: payload.eventType,
      channel: "live.commercial_trust.v1",
      organizationId: payload.organizationId,
      source: payload.source,
      items,
    });
    for (const [ws, st] of this.clients) {
      if (!st.poles.has("COMMERCIAL_TRUST")) continue;
      if (payload.organizationId && st.organizationId && st.organizationId !== payload.organizationId) continue;
      try {
        ws.send(envelope);
      } catch {
        this.clients.delete(ws);
      }
    }
  }

  /** Instruction 20.4 — domain-derived corridor intelligence frames (core-domain HTTP fan-in). */
  ingestCorridorIntelligenceDomainSignal(payload: {
    organizationId: string;
    eventType: string;
    source: string;
    body?: Record<string, unknown>;
  }) {
    const minimal = extractCorridorIntelligenceRealtimePayload(payload.eventType, payload.body);
    const detail = "Corridor intelligence signal updated";
    const items: OperationalSignalEvent[] = [
      {
        id: `corridor-domain-${payload.eventType}-${Date.now()}`,
        pole: "CORRIDOR_INTELLIGENCE",
        priority: "MEDIUM",
        label: `Domain — ${payload.eventType}`,
        detail,
        ts: new Date().toISOString(),
        corridorIntelligenceRealtimeClass: payload.eventType.includes(".synthetic_tick.")
          ? "SYNTHETIC_TICK"
          : payload.eventType.startsWith("live.") || payload.eventType.startsWith("commercial.")
            ? "DOMAIN_LIVE"
            : "DEMO_MIRROR",
        ...(minimal ? { corridorIntelligenceRealtimePayload: minimal } : {}),
      },
    ];
    const envelope = JSON.stringify({
      type: payload.eventType,
      channel: "live.corridor_intelligence.v1",
      organizationId: payload.organizationId,
      source: payload.source,
      items,
    });
    for (const [ws, st] of this.clients) {
      if (!st.poles.has("CORRIDOR_INTELLIGENCE")) continue;
      if (payload.organizationId && st.organizationId && st.organizationId !== payload.organizationId) continue;
      try {
        ws.send(envelope);
      } catch {
        this.clients.delete(ws);
      }
    }
  }

  /** Instruction 19.2 — domain-derived relational catalog frames (core-domain HTTP fan-in). */
  ingestRelationalCatalogDomainSignal(payload: {
    organizationId: string;
    eventType: string;
    source: string;
    body?: Record<string, unknown>;
  }) {
    const items: OperationalSignalEvent[] = [
      {
        id: `rcat-domain-${payload.eventType}-${Date.now()}`,
        pole: "RELATIONAL_CATALOG",
        priority: "MEDIUM",
        label: `Domain — ${payload.eventType}`,
        detail:
          typeof payload.body === "object" && payload.body
            ? JSON.stringify({ source: payload.source, ...payload.body }).slice(0, 480)
            : payload.source,
        ts: new Date().toISOString(),
        relationalCatalogRealtimeClass: payload.eventType.includes(".synthetic_tick.")
          ? "SYNTHETIC_TICK"
          : payload.eventType.startsWith("live.")
            ? "DOMAIN_LIVE"
            : "DEMO_MIRROR",
      },
    ];
    const envelope = JSON.stringify({
      type: payload.eventType,
      channel: "live.relational_catalog.v1",
      organizationId: payload.organizationId,
      source: payload.source,
      items,
    });
    for (const [ws, st] of this.clients) {
      if (!st.poles.has("RELATIONAL_CATALOG")) continue;
      if (payload.organizationId && st.organizationId && st.organizationId !== payload.organizationId) continue;
      try {
        ws.send(envelope);
      } catch {
        this.clients.delete(ws);
      }
    }
  }

  /** Instruction 20.0 — domain-derived relational orders frames (core-domain HTTP fan-in). */
  ingestRelationalOrdersDomainSignal(payload: {
    organizationId: string;
    eventType: string;
    source: string;
    body?: Record<string, unknown>;
  }) {
    const isExec = typeof payload.eventType === "string" && payload.eventType.startsWith("relational.order.");
    const isFulfillment = typeof payload.eventType === "string" && payload.eventType.startsWith("relational.fulfillment.");
    let execPayload: RelationalOrderExecutionRealtimeDto | undefined;
    let fulfillmentPayload: RelationalFulfillmentRealtimeDto | undefined;
    if (isExec) {
      const parsed = RelationalOrderExecutionRealtimeSchema.safeParse(payload.body ?? {});
      if (parsed.success) {
        execPayload = parsed.data;
      }
    }
    if (isFulfillment) {
      const parsed = RelationalFulfillmentRealtimeSchema.safeParse(payload.body ?? {});
      if (parsed.success) {
        fulfillmentPayload = parsed.data;
      }
    }
    let relationalMacroObservatoryGovernanceRealtimePayload:
      | RelationalMacroObservatoryGovernanceRealtimeDto
      | undefined;
    if (
      typeof payload.eventType === "string" &&
      payload.eventType.startsWith("relational.macro_observatory_governance.")
    ) {
      const p = RelationalMacroObservatoryGovernanceRealtimeSchema.safeParse(payload.body ?? {});
      if (p.success) relationalMacroObservatoryGovernanceRealtimePayload = p.data;
    }
    let relationalStrategicObservatoryRealtimePayload: RelationalStrategicObservatoryRealtimeDto | undefined;
    if (typeof payload.eventType === "string" && payload.eventType.startsWith("relational.strategic_observatory.")) {
      const p = RelationalStrategicObservatoryRealtimeSchema.safeParse(payload.body ?? {});
      if (p.success) relationalStrategicObservatoryRealtimePayload = p.data;
    }
    let relationalGlobalExecutiveSupervisionRealtimePayload: RelationalGlobalExecutiveSupervisionRealtimeDto | undefined;
    if (typeof payload.eventType === "string" && payload.eventType.startsWith("relational.global_executive_supervision.")) {
      const p = RelationalGlobalExecutiveSupervisionRealtimeSchema.safeParse(payload.body ?? {});
      if (p.success) relationalGlobalExecutiveSupervisionRealtimePayload = p.data;
    }
    let relationalExecutiveStrategicSynthesisRealtimePayload: RelationalExecutiveStrategicSynthesisRealtimeDto | undefined;
    if (typeof payload.eventType === "string" && payload.eventType.startsWith("relational.executive_strategic_synthesis.")) {
      const p = RelationalExecutiveStrategicSynthesisRealtimeSchema.safeParse(payload.body ?? {});
      if (p.success) relationalExecutiveStrategicSynthesisRealtimePayload = p.data;
    }
    let relationalExecutiveControlRoomRealtimePayload: RelationalExecutiveControlRoomRealtimeDto | undefined;
    if (typeof payload.eventType === "string" && payload.eventType.startsWith("relational.executive_control_room.")) {
      const p = RelationalExecutiveControlRoomRealtimeSchema.safeParse(payload.body ?? {});
      if (p.success) relationalExecutiveControlRoomRealtimePayload = p.data;
    }
    let relationalExecutiveOperationsRealtimePayload: RelationalExecutiveOperationsRealtimeDto | undefined;
    if (typeof payload.eventType === "string" && payload.eventType.startsWith("relational.executive_operations.")) {
      const p = RelationalExecutiveOperationsRealtimeSchema.safeParse(payload.body ?? {});
      if (p.success) relationalExecutiveOperationsRealtimePayload = p.data;
    }
    let relationalStrategicCommandRealtimePayload: RelationalStrategicCommandRealtimeDto | undefined;
    if (typeof payload.eventType === "string" && payload.eventType.startsWith("relational.strategic_command.")) {
      const p = RelationalStrategicCommandRealtimeSchema.safeParse(payload.body ?? {});
      if (p.success) relationalStrategicCommandRealtimePayload = p.data;
    }
    let relationalStrategicIntelligenceRealtimePayload: RelationalStrategicIntelligenceRealtimeDto | undefined;
    if (typeof payload.eventType === "string" && payload.eventType.startsWith("relational.strategic_intelligence.")) {
      const p = RelationalStrategicIntelligenceRealtimeSchema.safeParse(payload.body ?? {});
      if (p.success) relationalStrategicIntelligenceRealtimePayload = p.data;
    }
    let relationalInstitutionalReportingRealtimePayload: RelationalInstitutionalReportingRealtimeDto | undefined;
    if (typeof payload.eventType === "string" && payload.eventType.startsWith("relational.institutional_reporting.")) {
      const p = RelationalInstitutionalReportingRealtimeSchema.safeParse(payload.body ?? {});
      if (p.success) relationalInstitutionalReportingRealtimePayload = p.data;
    }
    let relationalExecutiveOrchestrationRealtimePayload: RelationalExecutiveOrchestrationRealtimeDto | undefined;
    if (typeof payload.eventType === "string" && payload.eventType.startsWith("relational.executive_orchestration.")) {
      const p = RelationalExecutiveOrchestrationRealtimeSchema.safeParse(payload.body ?? {});
      if (p.success) relationalExecutiveOrchestrationRealtimePayload = p.data;
    }
    let relationalEconomicMonitoringRealtimePayload: RelationalEconomicMonitoringRealtimeDto | undefined;
    if (typeof payload.eventType === "string" && payload.eventType.startsWith("relational.monitoring.")) {
      const p = RelationalEconomicMonitoringRealtimeSchema.safeParse(payload.body ?? {});
      if (p.success) relationalEconomicMonitoringRealtimePayload = p.data;
    }
    let relationalEconomicStabilizationRealtimePayload: RelationalEconomicStabilizationRealtimeDto | undefined;
    if (typeof payload.eventType === "string" && payload.eventType.startsWith("relational.stabilization.")) {
      const p = RelationalEconomicStabilizationRealtimeSchema.safeParse(payload.body ?? {});
      if (p.success) relationalEconomicStabilizationRealtimePayload = p.data;
    }
    let relationalEconomicArbitrationRealtimePayload: RelationalEconomicArbitrationRealtimeDto | undefined;
    if (typeof payload.eventType === "string" && payload.eventType.startsWith("relational.arbitration.")) {
      const p = RelationalEconomicArbitrationRealtimeSchema.safeParse(payload.body ?? {});
      if (p.success) relationalEconomicArbitrationRealtimePayload = p.data;
    }
    let relationalEconomicGovernanceRealtimePayload: RelationalEconomicGovernanceRealtimeDto | undefined;
    if (typeof payload.eventType === "string" && payload.eventType.startsWith("relational.governance.")) {
      const p = RelationalEconomicGovernanceRealtimeSchema.safeParse(payload.body ?? {});
      if (p.success) relationalEconomicGovernanceRealtimePayload = p.data;
    }
    let relationalEconomicRecoveryRealtimePayload: RelationalEconomicRecoveryRealtimeDto | undefined;
    if (typeof payload.eventType === "string" && payload.eventType.startsWith("relational.recovery.")) {
      const p = RelationalEconomicRecoveryRealtimeSchema.safeParse(payload.body ?? {});
      if (p.success) relationalEconomicRecoveryRealtimePayload = p.data;
    }
    let relationalEconomicSovereigntyRealtimePayload: RelationalEconomicSovereigntyRealtimeDto | undefined;
    if (typeof payload.eventType === "string" && payload.eventType.startsWith("relational.sovereignty.")) {
      const p = RelationalEconomicSovereigntyRealtimeSchema.safeParse(payload.body ?? {});
      if (p.success) relationalEconomicSovereigntyRealtimePayload = p.data;
    }
    let relationalEconomicContinuityRealtimePayload: RelationalEconomicContinuityRealtimeDto | undefined;
    if (typeof payload.eventType === "string" && payload.eventType.startsWith("relational.continuity.")) {
      const p = RelationalEconomicContinuityRealtimeSchema.safeParse(payload.body ?? {});
      if (p.success) relationalEconomicContinuityRealtimePayload = p.data;
    }
    let relationalMacroEconomicRealtimePayload: RelationalMacroEconomicRealtimeDto | undefined;
    if (typeof payload.eventType === "string" && payload.eventType.startsWith("relational.macro.")) {
      const p = RelationalMacroEconomicRealtimeSchema.safeParse(payload.body ?? {});
      if (p.success) relationalMacroEconomicRealtimePayload = p.data;
    }
    let relationalSupplyFlowRealtimePayload: RelationalSupplyFlowRealtimeDto | undefined;
    if (typeof payload.eventType === "string" && payload.eventType.startsWith("relational.supply.")) {
      const p = RelationalSupplyFlowRealtimeSchema.safeParse(payload.body ?? {});
      if (p.success) relationalSupplyFlowRealtimePayload = p.data;
    }
    let relationalSectorRealtimePayload: RelationalSectorRealtimeFanoutBodyDto | undefined;
    if (typeof payload.eventType === "string" && payload.eventType.startsWith("relational.sector.")) {
      const p = safeParseRelationalSectorRealtimeBody(payload.eventType, payload.body ?? {});
      if (p.ok) relationalSectorRealtimePayload = p.data;
    }
    const items: OperationalSignalEvent[] = [
      {
        id: `rord-domain-${payload.eventType}-${Date.now()}`,
        pole: "RELATIONAL_ORDERS",
        priority: "MEDIUM",
        label: `Domain — ${payload.eventType}`,
        detail:
          typeof payload.body === "object" && payload.body
            ? JSON.stringify({ source: payload.source, ...payload.body }).slice(0, 480)
            : payload.source,
        ts: new Date().toISOString(),
        relationalOrdersRealtimeClass: payload.eventType.includes(".synthetic_tick.")
          ? "SYNTHETIC_TICK"
          : payload.eventType.startsWith("live.") ||
              payload.eventType.startsWith("relational.order.") ||
              payload.eventType.startsWith("relational.fulfillment.") ||
              payload.eventType.startsWith("relational.strategic_observatory.") ||
              payload.eventType.startsWith("relational.global_executive_supervision.") ||
              payload.eventType.startsWith("relational.executive_strategic_synthesis.") ||
              payload.eventType.startsWith("relational.executive_control_room.") ||
              payload.eventType.startsWith("relational.executive_operations.") ||
              payload.eventType.startsWith("relational.strategic_command.") ||
              payload.eventType.startsWith("relational.strategic_intelligence.") ||
              payload.eventType.startsWith("relational.institutional_reporting.") ||
              payload.eventType.startsWith("relational.executive_orchestration.") ||
              payload.eventType.startsWith("relational.monitoring.") ||
              payload.eventType.startsWith("relational.stabilization.") ||
              payload.eventType.startsWith("relational.arbitration.") ||
              payload.eventType.startsWith("relational.governance.") ||
              payload.eventType.startsWith("relational.recovery.") ||
              payload.eventType.startsWith("relational.sovereignty.") ||
              payload.eventType.startsWith("relational.continuity.") ||
              payload.eventType.startsWith("relational.macro.") ||
              payload.eventType.startsWith("relational.supply.") ||
              payload.eventType.startsWith("relational.sector.")
            ? "DOMAIN_LIVE"
            : "DEMO_MIRROR",
        ...(execPayload ? { relationalOrderExecutionRealtimePayload: execPayload } : {}),
        ...(fulfillmentPayload ? { relationalFulfillmentRealtimePayload: fulfillmentPayload } : {}),
        ...(relationalMacroObservatoryGovernanceRealtimePayload
          ? { relationalMacroObservatoryGovernanceRealtimePayload }
          : {}),
        ...(relationalStrategicObservatoryRealtimePayload
          ? { relationalStrategicObservatoryRealtimePayload }
          : {}),
        ...(relationalGlobalExecutiveSupervisionRealtimePayload
          ? { relationalGlobalExecutiveSupervisionRealtimePayload }
          : {}),
        ...(relationalExecutiveStrategicSynthesisRealtimePayload
          ? { relationalExecutiveStrategicSynthesisRealtimePayload }
          : {}),
        ...(relationalExecutiveControlRoomRealtimePayload
          ? { relationalExecutiveControlRoomRealtimePayload }
          : {}),
        ...(relationalExecutiveOperationsRealtimePayload
          ? { relationalExecutiveOperationsRealtimePayload }
          : {}),
        ...(relationalStrategicCommandRealtimePayload
          ? { relationalStrategicCommandRealtimePayload }
          : {}),
        ...(relationalStrategicIntelligenceRealtimePayload
          ? { relationalStrategicIntelligenceRealtimePayload }
          : {}),
        ...(relationalInstitutionalReportingRealtimePayload
          ? { relationalInstitutionalReportingRealtimePayload }
          : {}),
        ...(relationalExecutiveOrchestrationRealtimePayload
          ? { relationalExecutiveOrchestrationRealtimePayload }
          : {}),
        ...(relationalEconomicMonitoringRealtimePayload
          ? { relationalEconomicMonitoringRealtimePayload }
          : {}),
        ...(relationalEconomicStabilizationRealtimePayload
          ? { relationalEconomicStabilizationRealtimePayload }
          : {}),
        ...(relationalEconomicArbitrationRealtimePayload
          ? { relationalEconomicArbitrationRealtimePayload }
          : {}),
        ...(relationalEconomicGovernanceRealtimePayload
          ? { relationalEconomicGovernanceRealtimePayload }
          : {}),
        ...(relationalEconomicRecoveryRealtimePayload
          ? { relationalEconomicRecoveryRealtimePayload }
          : {}),
        ...(relationalEconomicSovereigntyRealtimePayload
          ? { relationalEconomicSovereigntyRealtimePayload }
          : {}),
        ...(relationalEconomicContinuityRealtimePayload
          ? { relationalEconomicContinuityRealtimePayload }
          : {}),
        ...(relationalMacroEconomicRealtimePayload ? { relationalMacroEconomicRealtimePayload } : {}),
        ...(relationalSupplyFlowRealtimePayload ? { relationalSupplyFlowRealtimePayload } : {}),
        ...(relationalSectorRealtimePayload ? { relationalSectorRealtimePayload } : {}),
      },
    ];
    const envelope = JSON.stringify({
      type: payload.eventType,
      channel: "live.relational_orders.v1",
      organizationId: payload.organizationId,
      source: payload.source,
      items,
    });
    for (const [ws, st] of this.clients) {
      if (!st.poles.has("RELATIONAL_ORDERS")) continue;
      if (payload.organizationId && st.organizationId && st.organizationId !== payload.organizationId) continue;
      try {
        ws.send(envelope);
      } catch {
        this.clients.delete(ws);
      }
    }
  }

  /** Instruction 20.5 — domain-derived relational cart frames (core-domain HTTP fan-in). */
  ingestRelationalCartDomainSignal(payload: {
    organizationId: string;
    eventType: string;
    source: string;
    body?: Record<string, unknown>;
  }) {
    const minimal = extractRelationalCartRealtimePayload(payload.eventType, payload.body);
    const items: OperationalSignalEvent[] = [
      {
        id: `rcart-domain-${payload.eventType}-${Date.now()}`,
        pole: "RELATIONAL_CART",
        priority: "MEDIUM",
        label: `Domain — ${payload.eventType}`,
        detail: "Préparation relationnelle — événement corridor (20.5)",
        ts: new Date().toISOString(),
        relationalCartRealtimeClass: payload.eventType.includes(".synthetic_tick.")
          ? "SYNTHETIC_TICK"
          : payload.eventType.startsWith("live.") || payload.eventType.startsWith("relational.cart.")
            ? "DOMAIN_LIVE"
            : "DEMO_MIRROR",
        ...(minimal ? { relationalCartRealtimePayload: minimal } : {}),
      },
    ];
    const envelope = JSON.stringify({
      type: payload.eventType,
      channel: "live.relational_cart.v1",
      organizationId: payload.organizationId,
      source: payload.source,
      items,
    });
    for (const [ws, st] of this.clients) {
      if (!st.poles.has("RELATIONAL_CART")) continue;
      if (payload.organizationId && st.organizationId && st.organizationId !== payload.organizationId) continue;
      try {
        ws.send(envelope);
      } catch {
        this.clients.delete(ws);
      }
    }
  }

  /** Instruction 18.1 — domain-derived economic propagation frames (core-domain HTTP fan-in). */
  ingestEconomicPropagationDomainSignal(payload: {
    organizationId: string;
    eventType: string;
    source: string;
    body?: Record<string, unknown>;
  }) {
    const items: OperationalSignalEvent[] = [
      {
        id: `ep-domain-${payload.eventType}-${Date.now()}`,
        pole: "ECONOMIC_PROPAGATION",
        priority: "HIGH",
        label: `Domain — ${payload.eventType}`,
        detail:
          typeof payload.body === "object" && payload.body
            ? JSON.stringify({ source: payload.source, ...payload.body }).slice(0, 480)
            : payload.source,
        ts: new Date().toISOString(),
      },
    ];
    const envelope = JSON.stringify({
      type: payload.eventType,
      channel: "live.economic_propagation.v1",
      organizationId: payload.organizationId,
      source: payload.source,
      items,
    });
    for (const [ws, st] of this.clients) {
      if (!st.poles.has("ECONOMIC_PROPAGATION")) continue;
      if (payload.organizationId && st.organizationId && st.organizationId !== payload.organizationId) continue;
      try {
        ws.send(envelope);
      } catch {
        this.clients.delete(ws);
      }
    }
  }

  ingestFinanceCollectionsDomainSignal(payload: {
    organizationId: string;
    eventType: string;
    source: string;
    body?: Record<string, unknown>;
  }) {
    const items: OperationalSignalEvent[] = [
      {
        id: `fc-domain-${payload.eventType}-${Date.now()}`,
        pole: "FINANCE_COLLECTIONS",
        priority: "HIGH",
        label: `Domain — ${payload.eventType}`,
        detail:
          typeof payload.body === "object" && payload.body
            ? JSON.stringify({ source: payload.source, ...payload.body }).slice(0, 480)
            : payload.source,
        ts: new Date().toISOString(),
      },
    ];
    const envelope = JSON.stringify({
      type: payload.eventType,
      channel: "live.finance_collections.v1",
      organizationId: payload.organizationId,
      source: payload.source,
      items,
    });
    for (const [ws, st] of this.clients) {
      if (!st.poles.has("FINANCE_COLLECTIONS")) continue;
      if (payload.organizationId && st.organizationId && st.organizationId !== payload.organizationId) continue;
      try {
        ws.send(envelope);
      } catch {
        this.clients.delete(ws);
      }
    }
  }

  ingestSupplyLogisticsDomainSignal(payload: {
    organizationId: string;
    eventType: string;
    source: string;
    body?: Record<string, unknown>;
  }) {
    const items: OperationalSignalEvent[] = [
      {
        id: `sl-domain-${payload.eventType}-${Date.now()}`,
        pole: "SUPPLY_LOGISTICS",
        priority: "HIGH",
        label: `Domain — ${payload.eventType}`,
        detail:
          typeof payload.body === "object" && payload.body
            ? JSON.stringify({ source: payload.source, ...payload.body }).slice(0, 480)
            : payload.source,
        ts: new Date().toISOString(),
      },
    ];
    const envelope = JSON.stringify({
      type: payload.eventType,
      channel: "live.supply_logistics.v1",
      organizationId: payload.organizationId,
      source: payload.source,
      items,
    });
    for (const [ws, st] of this.clients) {
      if (!st.poles.has("SUPPLY_LOGISTICS")) continue;
      if (payload.organizationId && st.organizationId && st.organizationId !== payload.organizationId) continue;
      try {
        ws.send(envelope);
      } catch {
        this.clients.delete(ws);
      }
    }
  }

  private broadcastBatches() {
    const now = Date.now();
    for (const [ws, st] of this.clients) {
      if (st.poles.size === 0) continue;
      if (now - st.lastSentAt < 2000) continue;

      const items: OperationalSignalEvent[] = [];
      for (const pole of st.poles) {
        items.push(
          ...this.makeDemoBatch(pole).map((e) => ({
            ...e,
            ts: new Date().toISOString(),
          })),
        );
      }
      /** Batch + cap burst for low-RAM devices (Instruction 5 §9). */
      const capped = items.slice(0, 12);
      if (capped.length === 0) continue;

      try {
        ws.send(
          JSON.stringify({
            type: "demo.operational.signal.batch",
            channel: "demo.realtime.economic_signals",
            organizationId: st.organizationId,
            items: capped,
          }),
        );
        st.lastSentAt = now;
        if (st.poles.has("COMMERCIAL_NETWORK")) {
          this.sendCommercialFrame(ws, st.organizationId);
        }
        if (st.poles.has("MARKETING_ACTIVATION")) {
          this.sendMarketingFrame(ws, st.organizationId);
        }
        if (st.poles.has("ORDERS_ADV")) {
          this.sendOrderAdvFrame(ws, st.organizationId);
        }
        if (st.poles.has("SUPPLY_LOGISTICS")) {
          this.sendSupplyLogisticsFrame(ws, st.organizationId);
        }
        if (st.poles.has("FINANCE_COLLECTIONS")) {
          this.sendFinanceCollectionsFrame(ws, st.organizationId);
        }
        if (st.poles.has("DATA_INTELLIGENCE")) {
          this.sendDataIntelligenceFrame(ws, st.organizationId);
        }
        if (st.poles.has("ECONOMIC_PROPAGATION")) {
          this.sendEconomicPropagationFrame(ws, st.organizationId);
        }
        if (st.poles.has("ECONOMIC_MEMORY")) {
          this.sendEconomicMemoryFrame(ws, st.organizationId);
        }
        if (st.poles.has("ECONOMIC_SCENARIOS")) {
          this.sendEconomicScenariosFrame(ws, st.organizationId);
        }
        if (st.poles.has("ECONOMIC_COORDINATION")) {
          this.sendEconomicCoordinationFrame(ws, st.organizationId);
        }
        if (st.poles.has("ECONOMIC_COMMAND")) {
          this.sendEconomicCommandFrame(ws, st.organizationId);
        }
        if (st.poles.has("INDUSTRIAL_SITUATION_ROOM")) {
          this.sendIndustrialSituationRoomFrame(ws, st.organizationId);
        }
        if (st.poles.has("INDUSTRIAL_OPERATIONAL_CONTINUITY")) {
          this.sendIndustrialOperationalContinuityFrame(ws, st.organizationId);
        }
        if (st.poles.has("INDUSTRIAL_EVIDENCE")) {
          this.sendIndustrialEvidenceFrame(ws, st.organizationId);
        }
        if (st.poles.has("COMMERCIAL_RELATIONSHIP_GRAPH")) {
          this.sendCommercialRelationshipGraphFrame(ws, st.organizationId);
        }
        if (st.poles.has("RELATIONAL_CATALOG")) {
          this.sendRelationalCatalogFrame(ws, st.organizationId);
        }
        if (st.poles.has("RELATIONAL_ORDERS")) {
          this.sendRelationalOrdersFrame(ws, st.organizationId);
        }
        if (st.poles.has("RELATIONAL_CART")) {
          this.sendRelationalCartFrame(ws, st.organizationId);
        }
        if (st.poles.has("COMMERCIAL_TRUST")) {
          this.sendCommercialTrustFrame(ws, st.organizationId);
        }
        if (st.poles.has("CORRIDOR_INTELLIGENCE")) {
          this.sendCorridorIntelligenceFrame(ws, st.organizationId);
        }
      } catch {
        this.clients.delete(ws);
      }
    }
  }

  /** Instruction 18.1 — demo / live-shaped frames for ECONOMIC_PROPAGATION subscribers. */
  sendEconomicPropagationFrame(ws: WebSocket, organizationId?: string) {
    const useLiveShape = Boolean(organizationId) && this.economicPropagationRound % 10 === 0;
    const demoIdx = this.economicPropagationRound % this.economicPropagationDemoTypes.length;
    this.economicPropagationRound += 1;
    const demoType = this.economicPropagationDemoTypes[demoIdx]!;
    const liveTypes = [
      "live.economic_propagation.shock.detected",
      "live.economic_propagation.chain.updated",
      "live.economic_propagation.territory.fragile",
    ] as const;
    const type = useLiveShape ? liveTypes[demoIdx % liveTypes.length]! : demoType;
    const label = type.includes("shock")
      ? "Propagation shock ridge"
      : type.includes("chain")
        ? "Cross-pole chain stress"
        : "Territory fragility pulse";
    const items: OperationalSignalEvent[] = [
      {
        id: `ep-${type}-${Date.now()}`,
        pole: "ECONOMIC_PROPAGATION",
        priority: "MEDIUM",
        label,
        detail: `Economic propagation realtime contract: ${type} (Instruction 18.1).`,
        ts: new Date().toISOString(),
      },
    ];
    try {
      ws.send(
        JSON.stringify({
          type,
          channel: type.startsWith("live.") ? "live.economic_propagation.v1" : "demo.economic_propagation.v1",
          organizationId,
          items,
        }),
      );
    } catch {
      this.clients.delete(ws);
    }
  }

  /** Instruction 18.2 — demo / live-shaped frames for ECONOMIC_MEMORY subscribers. */
  sendEconomicMemoryFrame(ws: WebSocket, organizationId?: string) {
    const useLiveShape = Boolean(organizationId) && this.economicMemoryRound % 11 === 0;
    const demoIdx = this.economicMemoryRound % this.economicMemoryDemoTypes.length;
    this.economicMemoryRound += 1;
    const demoType = this.economicMemoryDemoTypes[demoIdx]!;
    const liveTypes = [
      "live.economic_memory.snapshot.persisted",
      "live.economic_memory.crisis.signature",
      "live.economic_memory.pattern.recurrence",
      "live.economic_memory.temporal.volatility",
    ] as const;
    const type = useLiveShape ? liveTypes[demoIdx % liveTypes.length]! : demoType;
    const label = type.includes("signature")
      ? "Crisis signature ridge"
      : type.includes("pattern")
        ? "Recurrence pattern trace"
        : type.includes("volatility")
          ? "Temporal volatility pulse"
          : "Economic memory snapshot";
    const items: OperationalSignalEvent[] = [
      {
        id: `em-${type}-${Date.now()}`,
        pole: "ECONOMIC_MEMORY",
        priority: "MEDIUM",
        label,
        detail: `Economic memory realtime contract: ${type} (Instruction 18.2).`,
        ts: new Date().toISOString(),
      },
    ];
    try {
      ws.send(
        JSON.stringify({
          type,
          channel: type.startsWith("live.") ? "live.economic_memory.v1" : "demo.economic_memory.v1",
          organizationId,
          items,
        }),
      );
    } catch {
      this.clients.delete(ws);
    }
  }

  /** Instruction 18.3 — demo / live-shaped frames for ECONOMIC_SCENARIOS subscribers. */
  sendEconomicScenariosFrame(ws: WebSocket, organizationId?: string) {
    const useLiveShape = Boolean(organizationId) && this.economicScenariosRound % 11 === 0;
    const demoIdx = this.economicScenariosRound % this.economicScenariosDemoTypes.length;
    this.economicScenariosRound += 1;
    const demoType = this.economicScenariosDemoTypes[demoIdx]!;
    const liveTypes = [
      "live.economic_scenarios.bundle.refreshed",
      "live.economic_scenarios.trajectory.shift",
      "live.economic_scenarios.risk.lattice",
      "live.economic_scenarios.comparison.delta",
    ] as const;
    const type = useLiveShape ? liveTypes[demoIdx % liveTypes.length]! : demoType;
    const label = type.includes("trajectory")
      ? "Scenario trajectory ridge"
      : type.includes("risk")
        ? "Risk lattice pulse"
        : type.includes("comparison")
          ? "Scenario comparison delta"
          : "Scenario bundle refresh";
    const items: OperationalSignalEvent[] = [
      {
        id: `es-${type}-${Date.now()}`,
        pole: "ECONOMIC_SCENARIOS",
        priority: "MEDIUM",
        label,
        detail: `Economic scenarios realtime contract: ${type} (Instruction 18.3).`,
        ts: new Date().toISOString(),
      },
    ];
    try {
      ws.send(
        JSON.stringify({
          type,
          channel: type.startsWith("live.") ? "live.economic_scenarios.v1" : "demo.economic_scenarios.v1",
          organizationId,
          items,
        }),
      );
    } catch {
      this.clients.delete(ws);
    }
  }

  /** Instruction 18.4 — demo / live-shaped frames for ECONOMIC_COORDINATION subscribers. */
  sendEconomicCoordinationFrame(ws: WebSocket, organizationId?: string) {
    const useLiveShape = Boolean(organizationId) && this.economicCoordinationRound % 11 === 0;
    const demoIdx = this.economicCoordinationRound % this.economicCoordinationDemoTypes.length;
    this.economicCoordinationRound += 1;
    const demoType = this.economicCoordinationDemoTypes[demoIdx]!;
    const liveTypes = [
      "live.economic_coordination.bundle.refreshed",
      "live.economic_coordination.posture.shift",
      "live.economic_coordination.conflict.matrix",
      "live.economic_coordination.escalation.pulse",
    ] as const;
    const type = useLiveShape ? liveTypes[demoIdx % liveTypes.length]! : demoType;
    const label = type.includes("posture")
      ? "Posture système — trace transverse"
      : type.includes("conflict")
        ? "Matrice d’arbitrage multi-pôles"
        : type.includes("escalation")
          ? "Impulsion d’escalade coordonnée"
          : "Rafraîchissement bundle coordination";
    const items: OperationalSignalEvent[] = [
      {
        id: `ec-${type}-${Date.now()}`,
        pole: "ECONOMIC_COORDINATION",
        priority: "MEDIUM",
        label,
        detail: `Economic coordination realtime contract: ${type} (Instruction 18.4).`,
        ts: new Date().toISOString(),
      },
    ];
    try {
      ws.send(
        JSON.stringify({
          type,
          channel: type.startsWith("live.") ? "live.economic_coordination.v1" : "demo.economic_coordination.v1",
          organizationId,
          items,
        }),
      );
    } catch {
      this.clients.delete(ws);
    }
  }

  /** Instruction 18.5 — demo / live-shaped frames for ECONOMIC_COMMAND subscribers. */
  sendEconomicCommandFrame(ws: WebSocket, organizationId?: string) {
    const useLiveShape = Boolean(organizationId) && this.economicCommandRound % 11 === 0;
    const demoIdx = this.economicCommandRound % this.economicCommandDemoTypes.length;
    this.economicCommandRound += 1;
    const demoType = this.economicCommandDemoTypes[demoIdx]!;
    const liveTypes = [
      "live.economic_command.pressure.updated",
      "live.economic_command.arbitration.detected",
      "live.economic_command.system_stress.changed",
    ] as const;
    const type = useLiveShape ? liveTypes[demoIdx % liveTypes.length]! : demoType;
    const label = type.includes("pressure")
      ? "Pression exécutive — zones proxy"
      : type.includes("arbitration")
        ? "Arbitrage multi-pôle (symbolique)"
        : "Stress systémique — lecture consultative";
    const items: OperationalSignalEvent[] = [
      {
        id: `ecmd-${type}-${Date.now()}`,
        pole: "ECONOMIC_COMMAND",
        priority: "MEDIUM",
        label,
        detail: `Economic command realtime contract: ${type} (Instruction 18.5).`,
        ts: new Date().toISOString(),
        economicCommandRealtimeClass: "SYNTHETIC_TICK",
      },
    ];
    try {
      ws.send(
        JSON.stringify({
          type,
          channel: type.startsWith("live.") ? "live.economic_command.v1" : "demo.economic_command.v1",
          organizationId,
          items,
        }),
      );
    } catch {
      this.clients.delete(ws);
    }
  }

  /** Instruction 18.7A — demo ticks only (`demo.*` + `synthetic_tick`); never `live.*` (DOMAIN_LIVE = core fan-in only). */
  sendIndustrialOperationalContinuityFrame(ws: WebSocket, organizationId?: string) {
    const demoIdx = this.industrialOperationalContinuityRound % this.industrialOperationalContinuityDemoTypes.length;
    this.industrialOperationalContinuityRound += 1;
    const type = this.industrialOperationalContinuityDemoTypes[demoIdx]!;
    const label = type.includes("cadence")
      ? "Cadence opérationnelle — lecture symbolique"
      : "Continuité industrielle — états de stabilité proxy";
    const items: OperationalSignalEvent[] = [
      {
        id: `ioc-${type}-${Date.now()}`,
        pole: "INDUSTRIAL_OPERATIONAL_CONTINUITY",
        priority: "MEDIUM",
        label,
        detail: `Industrial operational continuity realtime contract: ${type} (Instruction 18.7).`,
        ts: new Date().toISOString(),
        industrialOperationalContinuityRealtimeClass: "SYNTHETIC_TICK",
      },
    ];
    try {
      ws.send(
        JSON.stringify({
          type,
          channel: "demo.industrial_operational_continuity.v1",
          organizationId,
          items,
        }),
      );
    } catch {
      this.clients.delete(ws);
    }
  }

  /** Instruction 18.8 — demo frames for INDUSTRIAL_EVIDENCE subscribers (SYNTHETIC_TICK only in demo channel). */
  sendIndustrialEvidenceFrame(ws: WebSocket, organizationId?: string) {
    const demoIdx = this.industrialEvidenceRound % this.industrialEvidenceDemoTypes.length;
    this.industrialEvidenceRound += 1;
    const type = this.industrialEvidenceDemoTypes[demoIdx]!;
    const items: OperationalSignalEvent[] = [
      {
        id: `iev-${type}-${Date.now()}`,
        pole: "INDUSTRIAL_EVIDENCE",
        priority: "MEDIUM",
        label: "Registre preuve / traçabilité — rafraîchissement symbolique",
        detail: `Industrial evidence realtime contract: ${type} (Instruction 18.8) — derived traces are not causal proof.`,
        ts: new Date().toISOString(),
        industrialEvidenceRealtimeClass: "SYNTHETIC_TICK",
      },
    ];
    try {
      ws.send(
        JSON.stringify({
          type,
          channel: "demo.industrial_evidence.v1",
          organizationId,
          items,
        }),
      );
    } catch {
      this.clients.delete(ws);
    }
  }

  /** Instruction 19.1 — demo frames for COMMERCIAL_RELATIONSHIP_GRAPH subscribers. */
  sendCommercialRelationshipGraphFrame(ws: WebSocket, organizationId?: string) {
    const demoIdx = this.commercialRelationshipGraphRound % this.commercialRelationshipGraphDemoTypes.length;
    this.commercialRelationshipGraphRound += 1;
    const type = this.commercialRelationshipGraphDemoTypes[demoIdx]!;
    const items: OperationalSignalEvent[] = [
      {
        id: `crg-${type}-${Date.now()}`,
        pole: "COMMERCIAL_RELATIONSHIP_GRAPH",
        priority: "MEDIUM",
        label: "Graphe relationnel validé — projection symbolique",
        detail: `Commercial relationship graph contract: ${type} (19.1) — not social network, not open marketplace.`,
        ts: new Date().toISOString(),
        commercialRelationshipGraphRealtimeClass: "SYNTHETIC_TICK",
      },
    ];
    try {
      ws.send(
        JSON.stringify({
          type,
          channel: "demo.commercial_relationship_graph.v1",
          organizationId,
          items,
        }),
      );
    } catch {
      this.clients.delete(ws);
    }
  }

  /** Instruction 19.2 — demo frames for RELATIONAL_CATALOG subscribers. */
  sendRelationalCatalogFrame(ws: WebSocket, organizationId?: string) {
    const demoIdx = this.relationalCatalogRound % this.relationalCatalogDemoTypes.length;
    this.relationalCatalogRound += 1;
    const type = this.relationalCatalogDemoTypes[demoIdx]!;
    const items: OperationalSignalEvent[] = [
      {
        id: `rcat-${type}-${Date.now()}`,
        pole: "RELATIONAL_CATALOG",
        priority: "MEDIUM",
        label: "Catalogues relationnels — visibilité cloisonnée (démo)",
        detail: `Relational catalog contract: ${type} (19.2) — pas marketplace ouverte, pas recherche globale, tick synthétique distinct du live.`,
        ts: new Date().toISOString(),
        relationalCatalogRealtimeClass: "SYNTHETIC_TICK",
      },
    ];
    try {
      ws.send(
        JSON.stringify({
          type,
          channel: "demo.relational_catalog.v1",
          organizationId,
          items,
        }),
      );
    } catch {
      this.clients.delete(ws);
    }
  }

  /** Instruction 20.0 — demo frames for RELATIONAL_ORDERS subscribers. */
  sendRelationalOrdersFrame(ws: WebSocket, organizationId?: string) {
    const demoIdx = this.relationalOrdersRound % this.relationalOrdersDemoTypes.length;
    this.relationalOrdersRound += 1;
    const type = this.relationalOrdersDemoTypes[demoIdx]!;
    const items: OperationalSignalEvent[] = [
      {
        id: `rord-${type}-${Date.now()}`,
        pole: "RELATIONAL_ORDERS",
        priority: "MEDIUM",
        label: "Commandes relationnelles — orchestration corridor (démo)",
        detail: `Relational orders contract: ${type} (20.0) — pas checkout public, pas paiement intégré, tick synthétique distinct du live logistique.`,
        ts: new Date().toISOString(),
        relationalOrdersRealtimeClass: "SYNTHETIC_TICK",
      },
    ];
    try {
      ws.send(
        JSON.stringify({
          type,
          channel: "demo.relational_orders.v1",
          organizationId,
          items,
        }),
      );
    } catch {
      this.clients.delete(ws);
    }
  }

  /** Instruction 20.5 — demo frames for RELATIONAL_CART subscribers. */
  sendRelationalCartFrame(ws: WebSocket, organizationId?: string) {
    const demoIdx = this.relationalCartRound % this.relationalCartDemoTypes.length;
    this.relationalCartRound += 1;
    const type = this.relationalCartDemoTypes[demoIdx]!;
    const items: OperationalSignalEvent[] = [
      {
        id: `rcart-${type}-${Date.now()}`,
        pole: "RELATIONAL_CART",
        priority: "MEDIUM",
        label: "Préparation de commande relationnelle — démo corridor",
        detail: `Relational cart contract: ${type} (20.5) — pas checkout public, pas marketplace, tick synthétique.`,
        ts: new Date().toISOString(),
        relationalCartRealtimeClass: "SYNTHETIC_TICK",
      },
    ];
    try {
      ws.send(
        JSON.stringify({
          type,
          channel: "demo.relational_cart.v1",
          organizationId,
          items,
        }),
      );
    } catch {
      this.clients.delete(ws);
    }
  }

  /** Instruction 20.3 — demo frames for COMMERCIAL_TRUST subscribers (synthetic only). */
  sendCommercialTrustFrame(ws: WebSocket, organizationId?: string) {
    const demoIdx = this.commercialTrustRound % this.commercialTrustDemoTypes.length;
    this.commercialTrustRound += 1;
    const type = this.commercialTrustDemoTypes[demoIdx]!;
    const items: OperationalSignalEvent[] = [
      {
        id: `ctrust-${type}-${Date.now()}`,
        pole: "COMMERCIAL_TRUST",
        priority: "MEDIUM",
        label: "Confiance commerciale relationnelle — lecture interne (démo)",
        detail: `Couche 20.3 — heuristique corridor, pas score public, pas marketplace, pas réseau social (${type}).`,
        ts: new Date().toISOString(),
        commercialTrustRealtimeClass: "SYNTHETIC_TICK",
      },
    ];
    try {
      ws.send(
        JSON.stringify({
          type,
          channel: "demo.commercial_trust.v1",
          organizationId,
          items,
        }),
      );
    } catch {
      this.clients.delete(ws);
    }
  }

  /** Instruction 20.4 — demo frames for CORRIDOR_INTELLIGENCE subscribers (synthetic only). */
  sendCorridorIntelligenceFrame(ws: WebSocket, organizationId?: string) {
    const demoIdx = this.corridorIntelligenceRound % this.corridorIntelligenceDemoTypes.length;
    this.corridorIntelligenceRound += 1;
    const type = this.corridorIntelligenceDemoTypes[demoIdx]!;
    const items: OperationalSignalEvent[] = [
      {
        id: `corridor-${type}-${Date.now()}`,
        pole: "CORRIDOR_INTELLIGENCE",
        priority: "MEDIUM",
        label: "Intelligence corridor — gouvernance relationnelle (démo)",
        detail: `Couche 20.4 — état corridor privé, pas classement public, pas marketplace (${type}).`,
        ts: new Date().toISOString(),
        corridorIntelligenceRealtimeClass: "SYNTHETIC_TICK",
      },
    ];
    try {
      ws.send(
        JSON.stringify({
          type,
          channel: "demo.corridor_intelligence.v1",
          organizationId,
          items,
        }),
      );
    } catch {
      this.clients.delete(ws);
    }
  }

  /** Instruction 18.6 — demo / live-shaped frames for INDUSTRIAL_SITUATION_ROOM subscribers. */
  sendIndustrialSituationRoomFrame(ws: WebSocket, organizationId?: string) {
    const useLiveShape = Boolean(organizationId) && this.industrialSituationRoomRound % 11 === 0;
    const demoIdx = this.industrialSituationRoomRound % this.industrialSituationRoomDemoTypes.length;
    this.industrialSituationRoomRound += 1;
    const demoType = this.industrialSituationRoomDemoTypes[demoIdx]!;
    const liveTypes = [
      "live.industrial_situation_room.situation.updated",
      "live.industrial_situation_room.missions.changed",
    ] as const;
    const type = useLiveShape ? liveTypes[demoIdx % liveTypes.length]! : demoType;
    const label = type.includes("missions")
      ? "Missions symboliques — stabilisation consultative"
      : "Situation industrielle — cellules de lecture";
    const items: OperationalSignalEvent[] = [
      {
        id: `isr-${type}-${Date.now()}`,
        pole: "INDUSTRIAL_SITUATION_ROOM",
        priority: "MEDIUM",
        label,
        detail: `Industrial situation room realtime contract: ${type} (Instruction 18.6).`,
        ts: new Date().toISOString(),
        industrialSituationRoomRealtimeClass: "SYNTHETIC_TICK",
      },
    ];
    try {
      ws.send(
        JSON.stringify({
          type,
          channel: type.startsWith("live.") ? "live.industrial_situation_room.v1" : "demo.industrial_situation_room.v1",
          organizationId,
          items,
        }),
      );
    } catch {
      this.clients.delete(ws);
    }
  }

  /** Instruction 17 — demo / live-shaped frames for DATA_INTELLIGENCE subscribers. */
  sendDataIntelligenceFrame(ws: WebSocket, organizationId?: string) {
    const useLiveShape = Boolean(organizationId) && this.dataIntelligenceRound % 11 === 0;
    const demoIdx = this.dataIntelligenceRound % this.dataIntelligenceDemoTypes.length;
    this.dataIntelligenceRound += 1;
    const demoType = this.dataIntelligenceDemoTypes[demoIdx]!;
    const liveTypes = [
      "live.data_intelligence.propagation.elevated",
      "live.data_intelligence.correlation.burst",
      "live.data_intelligence.anomaly.cluster",
      "live.data_intelligence.predictive.high_risk",
      "live.data_intelligence.data_quality.degraded",
    ] as const;
    const type = useLiveShape ? liveTypes[demoIdx % liveTypes.length]! : demoType;
    const label = type.includes("propagation")
      ? "Economic propagation ridge"
      : type.includes("correlation")
        ? "Cross-pole correlation burst"
        : type.includes("anomaly")
          ? "Systemic anomaly pulse"
          : type.includes("predictive")
            ? "Predictive risk cone"
            : type.includes("data_quality")
              ? "Data guardian drift"
              : "Graph stress trace";
    const items: OperationalSignalEvent[] = [
      {
        id: `di-${type}-${Date.now()}`,
        pole: "DATA_INTELLIGENCE",
        priority: "MEDIUM",
        label,
        detail: `Data intelligence realtime contract: ${type} (Instruction 17).`,
        ts: new Date().toISOString(),
      },
    ];
    try {
      ws.send(
        JSON.stringify({
          type,
          channel: type.startsWith("live.") ? "live.data_intelligence.v1" : "demo.data_intelligence.v1",
          organizationId,
          items,
        }),
      );
    } catch {
      this.clients.delete(ws);
    }
  }

  private sendFinanceCollectionsFrame(ws: WebSocket, organizationId?: string) {
    const useLiveShape = Boolean(organizationId) && this.financeCollectionsRound % 12 === 0;
    const demoIdx = this.financeCollectionsRound % this.financeCollectionsDemoTypes.length;
    this.financeCollectionsRound += 1;
    const demoType = this.financeCollectionsDemoTypes[demoIdx]!;
    const liveTypes = [
      "live.finance_collections.payment.instability",
      "live.finance_collections.overdue.escalation",
      "live.finance_collections.liquidity.degraded",
      "live.finance_collections.settlement.anomaly",
      "live.finance_collections.collection.acceleration",
      "live.finance_collections.credit.warning",
    ] as const;
    const type = useLiveShape ? liveTypes[demoIdx % liveTypes.length]! : demoType;
    const label = type.includes("payment.instability")
      ? "Payment instability trace"
      : type.includes("overdue")
        ? "Overdue escalation ridge"
        : type.includes("liquidity")
          ? "Liquidity degradation field"
          : type.includes("settlement")
            ? "Settlement anomaly pulse"
            : type.includes("collection")
              ? "Collection acceleration envelope"
              : "Credit exposure warning";
    const items: OperationalSignalEvent[] = [
      {
        id: `fc-${type}-${Date.now()}`,
        pole: "FINANCE_COLLECTIONS",
        priority: "MEDIUM",
        label,
        detail: `Finance / encaissements realtime contract: ${type} (Instruction 16).`,
        ts: new Date().toISOString(),
      },
    ];
    try {
      ws.send(
        JSON.stringify({
          type,
          channel: type.startsWith("live.") ? "live.finance_collections.v1" : "demo.finance_collections.v1",
          organizationId,
          items,
        }),
      );
    } catch {
      this.clients.delete(ws);
    }
  }

  private sendCommercialFrame(ws: WebSocket, organizationId?: string) {
    const useLiveShape = Boolean(organizationId) && this.commercialRound % 9 === 0;
    const demoIdx = this.commercialRound % this.commercialDemoTypes.length;
    this.commercialRound += 1;
    const type = useLiveShape ? "live.commercial.sponsorship.spike" : this.commercialDemoTypes[demoIdx]!;
    const label =
      type.includes("relationship")
        ? "Relationship supervision pulse"
        : type.includes("retailer")
          ? "Retailer pressure ridge"
          : "Sponsorship lane anomaly";
    const items: OperationalSignalEvent[] = [
      {
        id: `cm-${type}-${Date.now()}`,
        pole: "COMMERCIAL_NETWORK",
        priority: "MEDIUM",
        label,
        detail: `Commercial realtime contract: ${type} (Instruction 12A).`,
        ts: new Date().toISOString(),
      },
    ];
    try {
      ws.send(
        JSON.stringify({
          type,
          channel: type.startsWith("live.") ? "live.commercial.v1" : "demo.commercial.v1",
          organizationId,
          items,
        }),
      );
    } catch {
      this.clients.delete(ws);
    }
  }

  private sendMarketingFrame(ws: WebSocket, organizationId?: string) {
    const useLiveShape = Boolean(organizationId) && this.marketingRound % 11 === 0;
    const demoIdx = this.marketingRound % this.marketingDemoTypes.length;
    this.marketingRound += 1;
    const demoType = this.marketingDemoTypes[demoIdx]!;
    const liveTypes = [
      "live.marketing.sponsorship.spike",
      "live.marketing.activation.burst",
      "live.marketing.momentum.shift",
      "live.marketing.retailer.engagement.burst",
      "live.marketing.campaign.pressure",
    ] as const;
    const type = useLiveShape ? liveTypes[demoIdx % liveTypes.length]! : demoType;
    const label = type.includes("sponsorship")
      ? "Sponsorship pressure ridge"
      : type.includes("activation")
        ? "Activation burst envelope"
        : type.includes("momentum")
          ? "Momentum shift trace"
          : type.includes("retailer")
            ? "Retailer engagement burst"
            : "Campaign pressure wave";
    const items: OperationalSignalEvent[] = [
      {
        id: `mk-${type}-${Date.now()}`,
        pole: "MARKETING_ACTIVATION",
        priority: "MEDIUM",
        label,
        detail: `Marketing realtime contract: ${type} (Instruction 13).`,
        ts: new Date().toISOString(),
      },
    ];
    try {
      ws.send(
        JSON.stringify({
          type,
          channel: type.startsWith("live.") ? "live.marketing.v1" : "demo.marketing.v1",
          organizationId,
          items,
        }),
      );
    } catch {
      this.clients.delete(ws);
    }
  }

  private sendSupplyLogisticsFrame(ws: WebSocket, organizationId?: string) {
    const useLiveShape = Boolean(organizationId) && this.supplyLogisticsRound % 11 === 0;
    const demoIdx = this.supplyLogisticsRound % this.supplyLogisticsDemoTypes.length;
    this.supplyLogisticsRound += 1;
    const demoType = this.supplyLogisticsDemoTypes[demoIdx]!;
    const liveTypes = [
      "live.supply_logistics.shipment.instability",
      "live.supply_logistics.territory.congestion",
      "live.supply_logistics.route.overload",
      "live.supply_logistics.warehouse.saturation",
      "live.supply_logistics.loading.anomaly",
      "live.supply_logistics.fulfillment.degradation",
    ] as const;
    const type = useLiveShape ? liveTypes[demoIdx % liveTypes.length]! : demoType;
    const label = type.includes("shipment")
      ? "Shipment instability trace"
      : type.includes("territory")
        ? "Territory congestion ridge"
        : type.includes("route")
          ? "Route overload envelope"
          : type.includes("warehouse")
            ? "Warehouse saturation pulse"
            : type.includes("loading")
              ? "Loading / dock anomaly"
              : "Fulfillment degradation field";
    const items: OperationalSignalEvent[] = [
      {
        id: `sl-${type}-${Date.now()}`,
        pole: "SUPPLY_LOGISTICS",
        priority: "MEDIUM",
        label,
        detail: `Supply / logistics realtime contract: ${type} (Instruction 15).`,
        ts: new Date().toISOString(),
      },
    ];
    try {
      ws.send(
        JSON.stringify({
          type,
          channel: type.startsWith("live.") ? "live.supply_logistics.v1" : "demo.supply_logistics.v1",
          organizationId,
          items,
        }),
      );
    } catch {
      this.clients.delete(ws);
    }
  }

  private sendOrderAdvFrame(ws: WebSocket, organizationId?: string) {
    const useLiveShape = Boolean(organizationId) && this.orderAdvRound % 13 === 0;
    const demoIdx = this.orderAdvRound % this.orderAdvDemoTypes.length;
    this.orderAdvRound += 1;
    const demoType = this.orderAdvDemoTypes[demoIdx]!;
    const liveTypes = [
      "live.order_adv.negotiation.burst",
      "live.order_adv.group_buying.spike",
      "live.order_adv.reservation.pressure",
      "live.order_adv.delivery.instability",
      "live.order_adv.conversational.commerce",
    ] as const;
    const type = useLiveShape ? liveTypes[demoIdx % liveTypes.length]! : demoType;
    const label = type.includes("negotiation")
      ? "Negotiation burst envelope"
      : type.includes("group_buying")
        ? "Grouped-buying surge trace"
        : type.includes("reservation")
          ? "Reservation / allocation pressure"
          : type.includes("delivery")
            ? "Delivery instability ridge"
            : "Conversational commerce pulse";
    const items: OperationalSignalEvent[] = [
      {
        id: `oa-${type}-${Date.now()}`,
        pole: "ORDERS_ADV",
        priority: "MEDIUM",
        label,
        detail: `Orders/ADV realtime contract: ${type} (Instruction 14).`,
        ts: new Date().toISOString(),
      },
    ];
    try {
      ws.send(
        JSON.stringify({
          type,
          channel: type.startsWith("live.") ? "live.order_adv.v1" : "demo.order_adv.v1",
          organizationId,
          items,
        }),
      );
    } catch {
      this.clients.delete(ws);
    }
  }

  private makeDemoBatch(pole: string): OperationalSignalEvent[] {
    if (pole === "ECONOMIC_SCENARIOS") {
      const i = Math.floor(performance.now() / 1000) % 4;
      const priorities: SignalPriority[] = ["MEDIUM", "HIGH", "HIGH", "CRITICAL"];
      const p = priorities[i] ?? "MEDIUM";
      return [
        {
          id: `sig-ES-${i}-a`,
          pole,
          priority: p,
          label: "Scenario stress envelope",
          detail: "Multi-pole projection lattice updated from propagation snapshot (deterministic demo, not RNG).",
          ts: "",
        },
        {
          id: `sig-ES-${i}-b`,
          pole,
          priority: "MEDIUM",
          label: "Symbolic corridor acceleration",
          detail: "Prospective propagation corridor — non-GIS symbolic field (Instruction 18.3).",
          ts: "",
        },
      ];
    }
    if (pole === "ECONOMIC_COORDINATION") {
      const i = Math.floor(performance.now() / 1000) % 4;
      const priorities: SignalPriority[] = ["MEDIUM", "HIGH", "HIGH", "CRITICAL"];
      const p = priorities[i] ?? "MEDIUM";
      return [
        {
          id: `sig-EC-${i}-a`,
          pole,
          priority: p,
          label: "Coordination stress lattice",
          detail: "Cross-pole arbitration hints refreshed from deterministic coordination compose (Instruction 18.4).",
          ts: "",
        },
        {
          id: `sig-EC-${i}-b`,
          pole,
          priority: "MEDIUM",
          label: "Posture / priorités — lecture symbolique",
          detail: "Salle de cohérence transverse — aucune exécution automatique (Instruction 18.4).",
          ts: "",
        },
      ];
    }
    if (pole === "INDUSTRIAL_SITUATION_ROOM") {
      const i = Math.floor(performance.now() / 1000) % 2;
      const priorities: SignalPriority[] = ["MEDIUM", "HIGH"];
      const p = priorities[i] ?? "MEDIUM";
      return [
        {
          id: `sig-ISR-${i}-a`,
          pole,
          priority: p,
          label: "Salle de situation — densité cellulaire symbolique",
          detail: "Lecture cockpit industrielle (18.6) — projection déterministe, aucune exécution, aucun agent.",
          ts: "",
          industrialSituationRoomRealtimeClass: "SYNTHETIC_TICK",
        },
        {
          id: `sig-ISR-${i}-b`,
          pole,
          priority: "MEDIUM",
          label: "Missions stabilisation — cadre consultatif",
          detail: "Missions analytiques sans assignation réelle — heuristique transverse uniquement.",
          ts: "",
          industrialSituationRoomRealtimeClass: "SYNTHETIC_TICK",
        },
      ];
    }
    if (pole === "INDUSTRIAL_OPERATIONAL_CONTINUITY") {
      const i = Math.floor(performance.now() / 1000) % 2;
      const priorities: SignalPriority[] = ["MEDIUM", "HIGH"];
      const p = priorities[i] ?? "MEDIUM";
      return [
        {
          id: `sig-IOC-${i}-a`,
          pole,
          priority: p,
          label: "Continuité opérationnelle — états proxy",
          detail: "Couche 18.7 — stabilité symbolique, aucun ordonnanceur, aucun APS, aucune exécution métier.",
          ts: "",
          industrialOperationalContinuityRealtimeClass: "SYNTHETIC_TICK",
        },
        {
          id: `sig-IOC-${i}-b`,
          pole,
          priority: "MEDIUM",
          label: "Cadence / corridors — projection consultative",
          detail: "Lecture transverse déterministe — DOMAIN_LIVE vs DEMO_MIRROR vs SYNTHETIC_TICK distingués côté client.",
          ts: "",
          industrialOperationalContinuityRealtimeClass: "SYNTHETIC_TICK",
        },
      ];
    }
    if (pole === "INDUSTRIAL_EVIDENCE") {
      const i = Math.floor(performance.now() / 1000) % 2;
      const priorities: SignalPriority[] = ["MEDIUM", "HIGH"];
      const p = priorities[i] ?? "MEDIUM";
      return [
        {
          id: `sig-IEV-${i}-a`,
          pole,
          priority: p,
          label: "Registre provenance — agrégat consultatif",
          detail: "Couche 18.8 — preuve industrielle, pas causalité juridique, pas moteur de décision.",
          ts: "",
          industrialEvidenceRealtimeClass: "SYNTHETIC_TICK",
        },
        {
          id: `sig-IEV-${i}-b`,
          pole,
          priority: "MEDIUM",
          label: "Matrice confiance / limitations",
          detail: "Traces dérivées explicitement non causales — DOMAIN_LIVE vs DEMO_MIRROR vs SYNTHETIC_TICK distingués.",
          ts: "",
          industrialEvidenceRealtimeClass: "SYNTHETIC_TICK",
        },
      ];
    }
    if (pole === "COMMERCIAL_RELATIONSHIP_GRAPH") {
      const i = Math.floor(performance.now() / 1000) % 2;
      const priorities: SignalPriority[] = ["MEDIUM", "HIGH"];
      const p = priorities[i] ?? "MEDIUM";
      return [
        {
          id: `sig-CRG-${i}-a`,
          pole,
          priority: p,
          label: "Réseau commercial validé — projection relationnelle",
          detail:
            "Couche 19.1 — graphe fermé sur relations acceptées; pas de marketplace ouvert, pas de réseau social, pas de followers.",
          ts: "",
          commercialRelationshipGraphRealtimeClass: "SYNTHETIC_TICK",
        },
        {
          id: `sig-CRG-${i}-b`,
          pole,
          priority: "MEDIUM",
          label: "Couverture / corridors symboliques",
          detail: "Territoires = libellés organisationnels — projection symbolique, non carte géographique réelle.",
          ts: "",
          commercialRelationshipGraphRealtimeClass: "SYNTHETIC_TICK",
        },
      ];
    }
    if (pole === "RELATIONAL_CATALOG") {
      const i = Math.floor(performance.now() / 1000) % 2;
      const priorities: SignalPriority[] = ["MEDIUM", "HIGH"];
      const p = priorities[i] ?? "MEDIUM";
      return [
        {
          id: `sig-RCAT-${i}-a`,
          pole,
          priority: p,
          label: "Catalogues relationnels — cloisonnement",
          detail:
            "Couche 19.2 — visibilité par relation validée; pas de catalogue public, pas de discovery globale, pas de marketplace ouverte.",
          ts: "",
          relationalCatalogRealtimeClass: "SYNTHETIC_TICK",
        },
        {
          id: `sig-RCAT-${i}-b`,
          pole,
          priority: "MEDIUM",
          label: "Injections sponsor — extensions contrôlées",
          detail: "Visibilité additionnelle bornée au corridor relationnel — non réseau social, non ecommerce grand public.",
          ts: "",
          relationalCatalogRealtimeClass: "SYNTHETIC_TICK",
        },
      ];
    }
    if (pole === "RELATIONAL_ORDERS") {
      const i = Math.floor(performance.now() / 1000) % 2;
      const priorities: SignalPriority[] = ["MEDIUM", "HIGH"];
      const p = priorities[i] ?? "MEDIUM";
      return [
        {
          id: `sig-RORD-${i}-a`,
          pole,
          priority: p,
          label: "Commandes corridor — lecture relationnelle",
          detail:
            "Couche 20.0 — commandes privées sur relations validées; pas marketplace ouverte, pas panier multi-vendeurs, pas paiement intégré.",
          ts: "",
          relationalOrdersRealtimeClass: "SYNTHETIC_TICK",
        },
        {
          id: `sig-RORD-${i}-b`,
          pole,
          priority: "MEDIUM",
          label: "Fulfillment symbolique — non suivi temps réel",
          detail: "États logistiques = projection Prisma symbolique — pas de promesse logistique live, pas de wallet PSP.",
          ts: "",
          relationalOrdersRealtimeClass: "SYNTHETIC_TICK",
        },
      ];
    }
    if (pole === "COMMERCIAL_TRUST") {
      const i = Math.floor(performance.now() / 1000) % 2;
      const priorities: SignalPriority[] = ["MEDIUM", "HIGH"];
      const p = priorities[i] ?? "MEDIUM";
      return [
        {
          id: `sig-CT-${i}-a`,
          pole,
          priority: p,
          label: "Centre d’intelligence économique — stabilité corridor",
          detail:
            "Couche 20.3 — signaux heuristiques privés (relations, négociations, sponsoring) — pas de notation publique, pas de classement viral.",
          ts: "",
          commercialTrustRealtimeClass: "SYNTHETIC_TICK",
        },
        {
          id: `sig-CT-${i}-b`,
          pole,
          priority: "MEDIUM",
          label: "Réactivité & cohérence — non popularité",
          detail: "Lecture industrielle bornée — DOMAIN_LIVE vs DEMO_MIRROR vs SYNTHETIC_TICK distingués côté client.",
          ts: "",
          commercialTrustRealtimeClass: "SYNTHETIC_TICK",
        },
      ];
    }
    if (pole === "CORRIDOR_INTELLIGENCE") {
      const i = Math.floor(performance.now() / 1000) % 2;
      const priorities: SignalPriority[] = ["MEDIUM", "HIGH"];
      const p = priorities[i] ?? "MEDIUM";
      return [
        {
          id: `sig-COR-${i}-a`,
          pole,
          priority: p,
          label: "Gouvernance corridor — cohérence économique privée",
          detail:
            "Couche 20.4 — machine d’état corridor, santé heuristique, signaux non publics — pas CRM marketplace, pas étoiles.",
          ts: "",
          corridorIntelligenceRealtimeClass: "SYNTHETIC_TICK",
        },
        {
          id: `sig-COR-${i}-b`,
          pole,
          priority: "MEDIUM",
          label: "Stabilité & friction — lecture prudente",
          detail: "Corridor = infrastructure relationnelle — pas ranking corridor, pas index global.",
          ts: "",
          corridorIntelligenceRealtimeClass: "SYNTHETIC_TICK",
        },
      ];
    }
    if (pole === "ECONOMIC_COMMAND") {
      const i = Math.floor(performance.now() / 1000) % 3;
      const priorities: SignalPriority[] = ["MEDIUM", "HIGH", "CRITICAL"];
      const p = priorities[i] ?? "MEDIUM";
      return [
        {
          id: `sig-ECMD-${i}-a`,
          pole,
          priority: p,
          label: "Salle de commandement — tension transverse",
          detail: "Lecture exécutive déterministe (18.5) — heuristique consultative, aucun moteur d’exécution.",
          ts: "",
          economicCommandRealtimeClass: "SYNTHETIC_TICK",
        },
        {
          id: `sig-ECMD-${i}-b`,
          pole,
          priority: "MEDIUM",
          label: "Arbitrage analytique — non opérationnel",
          detail: "Projection systémique symbolique — proxies 0–1, pas de prévision calibrée.",
          ts: "",
          economicCommandRealtimeClass: "SYNTHETIC_TICK",
        },
      ];
    }
    if (pole === "RELATIONAL_CART") {
      const i = Math.floor(performance.now() / 1000) % 2;
      const priorities: SignalPriority[] = ["MEDIUM", "HIGH"];
      const p = priorities[i] ?? "MEDIUM";
      return [
        {
          id: `sig-RCAR-${i}-a`,
          pole,
          priority: p,
          label: "Préparation relationnelle — revue corridor",
          detail:
            "Couche 20.5 — panier corridor privé; pas marketplace ouvert, pas checkout public, pas exécution paiement ici.",
          ts: "",
          relationalCartRealtimeClass: "SYNTHETIC_TICK",
        },
        {
          id: `sig-RCAR-${i}-b`,
          pole,
          priority: "MEDIUM",
          label: "Validation partenaire",
          detail: "États de préparation symboliques — pas stock WMS réservé, pas PSP, pas wallet.",
          ts: "",
          relationalCartRealtimeClass: "SYNTHETIC_TICK",
        },
      ];
    }
    if (pole === "ECONOMIC_PROPAGATION") {
      const i = Math.floor(performance.now() / 1000) % 3;
      const priorities: SignalPriority[] = ["MEDIUM", "HIGH", "CRITICAL"];
      const p = priorities[i] ?? "MEDIUM";
      return [
        {
          id: `sig-EP-${i}-a`,
          pole,
          priority: p,
          label: "Propagation tension envelope",
          detail: "Cross-pole coupling gradient shifted on snapshot lattice (deterministic demo, not RNG).",
          ts: "",
        },
        {
          id: `sig-EP-${i}-b`,
          pole,
          priority: "MEDIUM",
          label: "Territory fragility trace",
          detail: "Corridor-native fragility signal co-moving with receivable + motion fields (deterministic demo).",
          ts: "",
        },
      ];
    }
    const seed = Math.floor(Math.random() * 4);
    const priorities: SignalPriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
    const p = priorities[seed] ?? "MEDIUM";
    return [
      {
        id: `sig-${pole}-${seed}-a`,
        pole,
        priority: p,
        label: "Field tension shift",
        detail: "Operational density gradient moved +6% vs trailing 2h baseline (mock).",
        ts: "",
      },
      {
        id: `sig-${pole}-${seed}-b`,
        pole,
        priority: "MEDIUM",
        label: "Negotiation pulse",
        detail: "ADV threads accelerating in SN-DKR-01 cluster (mock).",
        ts: "",
      },
    ];
  }
}
