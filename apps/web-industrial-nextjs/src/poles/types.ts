import type { RelationalSectorRealtimeFanoutBodyDto, RelationalSupplyFlowRealtimeDto } from "@venext/shared-contracts";

export type PoleSlug =
  | "direction-strategy"
  | "commercial-network"
  | "marketing-activation"
  | "orders-adv"
  | "supply-logistics"
  | "finance-collections"
  | "data-intelligence"
  | "economic-propagation"
  | "economic-memory"
  | "economic-scenarios"
  | "economic-coordination"
  | "economic-command"
  | "industrial-situation-room"
  | "industrial-operational-continuity"
  | "industrial-evidence"
  | "commercial-relationship-graph"
  | "relational-catalog"
  | "relational-cart"
  | "relational-orders"
  | "relational-order-execution"
  | "relational-fulfillment"
  | "relational-operational-intelligence"
  | "relational-predictive-risk"
  | "relational-operational-recommendation"
  | "relational-operational-orchestration"
  | "relational-operational-simulation"
  | "relational-scenario-review"
  | "relational-strategic-memory"
  | "relational-economic-signal-graph"
  | "relational-economic-command-center"
  | "relational-economic-pressure"
  | "relational-geo-economic"
  | "relational-sector-intelligence"
  | "relational-supply-flow"
  | "relational-macro-economic"
  | "relational-economic-continuity"
  | "relational-economic-sovereignty"
  | "relational-economic-recovery"
  | "relational-economic-governance"
  | "relational-economic-arbitration"
  | "relational-economic-stabilization"
  | "relational-economic-monitoring"
  | "relational-executive-orchestration"
  | "relational-institutional-reporting"
  | "relational-strategic-intelligence"
  | "relational-strategic-command"
  | "relational-executive-operations"
  | "relational-executive-control-room"
  | "relational-executive-strategic-synthesis"
  | "relational-global-executive-supervision"
  | "relational-strategic-observatory"
  | "relational-macro-observatory-governance"
  | "commercial-trust"
  | "corridor-intelligence"
  | "industrial-safety";

export type SignalPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type OperationalSignalItem = {
  id: string;
  pole?: string;
  priority: SignalPriority;
  label: string;
  detail: string;
  ts: string;
  /** Instruction 12A — commercial realtime envelope (demo.commercial.* / live.commercial.*). */
  commercialEnvelope?: string;
  /** Instruction 13 — marketing / activation realtime envelope (demo.marketing.* / live.marketing.*). */
  marketingEnvelope?: string;
  /** Instruction 14 — orders / ADV realtime envelope (demo.order_adv.* / live.order_adv.*). */
  orderAdvEnvelope?: string;
  /** Instruction 15 — supply / logistics realtime (demo.supply_logistics.* / live.supply_logistics.*). */
  supplyLogisticsEnvelope?: string;
  /** Instruction 16 — finance / encaissements realtime (demo.finance_collections.* / live.finance_collections.*). */
  financeCollectionsEnvelope?: string;
  /** Instruction 17 — data / economic intelligence realtime. */
  dataIntelligenceEnvelope?: string;
  /** Instruction 18.2 — economic memory realtime envelope. */
  economicMemoryEnvelope?: string;
  /** Instruction 18.3 — economic scenarios realtime envelope. */
  economicScenariosEnvelope?: string;
  /** Instruction 18.4 — economic coordination realtime envelope. */
  economicCoordinationEnvelope?: string;
  /** Instruction 18.5 — economic command executive cockpit realtime envelope. */
  economicCommandEnvelope?: string;
  /** Instruction 18.5A — gateway / client classification for economic-command telemetry honesty. */
  economicCommandRealtimeClass?: "DOMAIN_LIVE" | "DEMO_MIRROR" | "SYNTHETIC_TICK";
  /** Instruction 18.6 — industrial situation room realtime envelope. */
  industrialSituationRoomEnvelope?: string;
  /** Instruction 18.6 — industrial situation room stream classification. */
  industrialSituationRoomRealtimeClass?: "DOMAIN_LIVE" | "DEMO_MIRROR" | "SYNTHETIC_TICK";
  /** Instruction 18.7 — industrial operational continuity realtime envelope. */
  industrialOperationalContinuityEnvelope?: string;
  /** Instruction 18.7 — industrial operational continuity stream classification. */
  industrialOperationalContinuityRealtimeClass?: "DOMAIN_LIVE" | "DEMO_MIRROR" | "SYNTHETIC_TICK";
  /** Instruction 18.8 — industrial evidence stream classification. */
  industrialEvidenceEnvelope?: string;
  industrialEvidenceRealtimeClass?: "DOMAIN_LIVE" | "DEMO_MIRROR" | "SYNTHETIC_TICK";
  /** Instruction 19.1 — commercial relationship graph realtime envelope. */
  commercialRelationshipGraphEnvelope?: string;
  commercialRelationshipGraphRealtimeClass?: "DOMAIN_LIVE" | "DEMO_MIRROR" | "SYNTHETIC_TICK";
  /** Instruction 19.2 — relational catalog realtime envelope. */
  relationalCatalogEnvelope?: string;
  relationalCatalogRealtimeClass?: "DOMAIN_LIVE" | "DEMO_MIRROR" | "SYNTHETIC_TICK";
  /** Instruction 20.0 — relational orders realtime envelope. */
  relationalOrdersEnvelope?: string;
  relationalOrdersRealtimeClass?: "DOMAIN_LIVE" | "DEMO_MIRROR" | "SYNTHETIC_TICK";
  /** Instruction 20.24 — supply flow streaming envelope (relational.supply.*). */
  relationalSupplyFlowEnvelope?: string;
  /** Instruction 20.25 — macro-economic streaming envelope (relational.macro.*). */
  relationalMacroEconomicEnvelope?: string;
  /** Instruction 20.26 — economic continuity streaming envelope (relational.continuity.*). */
  relationalEconomicContinuityEnvelope?: string;
  /** Instruction 20.27 — economic sovereignty streaming envelope (relational.sovereignty.*). */
  relationalEconomicSovereigntyEnvelope?: string;
  /** Instruction 20.29 — economic recovery planning streaming envelope (relational.recovery.*). */
  relationalEconomicRecoveryEnvelope?: string;
  /** Instruction 20.30 — economic governance streaming envelope (relational.governance.*). */
  relationalEconomicMonitoringEnvelope?: string;
  relationalExecutiveOrchestrationEnvelope?: string;
  relationalInstitutionalReportingEnvelope?: string;
  relationalExecutiveOperationsEnvelope?: string;
  relationalStrategicCommandEnvelope?: string;
  relationalStrategicIntelligenceEnvelope?: string;
  relationalEconomicStabilizationEnvelope?: string;
  relationalEconomicArbitrationEnvelope?: string;
  relationalEconomicGovernanceEnvelope?: string;
  relationalSupplyFlowRealtimePayload?: RelationalSupplyFlowRealtimeDto;
  /** Instruction 20.24 — sector intelligence streaming envelope (relational.sector.*). */
  relationalSectorEnvelope?: string;
  relationalSectorRealtimePayload?: RelationalSectorRealtimeFanoutBodyDto;
  /** Instruction 20.8 — minimal execution payload (gateway-validated). */
  relationalOrderExecutionRealtimePayload?: {
    orderId: string;
    relationshipId: string;
    executionStatus: string;
    eventType: string;
    computedAt: string;
    paymentExecutionDisabled: true;
    publicTrackingDisabled: true;
  };
  /** Instruction 20.3 — private commercial trust realtime envelope (minimal payloads). */
  commercialTrustEnvelope?: string;
  commercialTrustRealtimeClass?: "DOMAIN_LIVE" | "DEMO_MIRROR" | "SYNTHETIC_TICK";
  /** Instruction 20.4 — corridor intelligence realtime envelope. */
  corridorIntelligenceEnvelope?: string;
  corridorIntelligenceRealtimeClass?: "DOMAIN_LIVE" | "DEMO_MIRROR" | "SYNTHETIC_TICK";
  /** Instruction 18.1 — economic propagation realtime. */
  economicPropagationEnvelope?: string;
};
