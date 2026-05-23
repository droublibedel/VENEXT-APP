import type { PoleSlug } from "./types";
import commercialNetwork from "./commercial-network/ai-context";
import dataIntelligence from "./data-intelligence/ai-context";
import economicMemory from "./economic-memory/ai-context";
import economicScenarios from "./economic-scenarios/ai-context";
import economicPropagation from "./economic-propagation/ai-context";
import economicCommand from "./economic-command/ai-context";
import industrialSituationRoom from "./industrial-situation-room/ai-context";
import industrialOperationalContinuity from "./industrial-operational-continuity/ai-context";
import industrialEvidence from "./industrial-evidence/ai-context";
import commercialRelationshipGraph from "./commercial-relationship-graph/ai-context";
import relationalCatalog from "./relational-catalog/ai-context";
import relationalCart from "./relational-cart/ai-context";
import relationalOrders from "./relational-orders/ai-context";
import relationalOrderExecution from "./relational-order-execution/ai-context";
import relationalFulfillment from "./relational-fulfillment/ai-context";
import relationalOperationalIntelligence from "./relational-operational-intelligence/ai-context";
import relationalPredictiveRisk from "./relational-predictive-risk/ai-context";
import relationalOperationalRecommendation from "./relational-operational-recommendation/ai-context";
import relationalOperationalOrchestration from "./relational-operational-orchestration/ai-context";
import relationalOperationalSimulation from "./relational-operational-simulation/ai-context";
import relationalScenarioReview from "./relational-scenario-review/ai-context";
import relationalStrategicMemory from "./relational-strategic-memory/ai-context";
import relationalEconomicSignalGraph from "./relational-economic-signal-graph/ai-context";
import relationalEconomicCommandCenter from "./relational-economic-command-center/ai-context";
import relationalEconomicPressure from "./relational-economic-pressure/ai-context";
import relationalGeoEconomic from "./relational-geo-economic/ai-context";
import relationalSectorIntelligence from "./relational-sector-intelligence/ai-context";
import relationalSupplyFlow from "./relational-supply-flow/ai-context";
import relationalMacroEconomic from "./relational-macro-economic/ai-context";
import relationalEconomicContinuity from "./relational-economic-continuity/ai-context";
import relationalEconomicSovereignty from "./relational-economic-sovereignty/ai-context";
import relationalEconomicRecovery from "./relational-economic-recovery/ai-context";
import relationalEconomicStabilization from "./relational-economic-stabilization/ai-context";
import relationalEconomicMonitoring from "./relational-economic-monitoring/ai-context";
import relationalExecutiveOrchestration from "./relational-executive-orchestration/ai-context";
import relationalInstitutionalReporting from "./relational-institutional-reporting/ai-context";
import relationalExecutiveOperations from "./relational-executive-operations/ai-context";
import relationalExecutiveControlRoom from "./relational-executive-control-room/ai-context";
import relationalExecutiveStrategicSynthesis from "./relational-executive-strategic-synthesis/ai-context";
import relationalGlobalExecutiveSupervision from "./relational-global-executive-supervision/ai-context";
import relationalMacroObservatoryGovernance from "./relational-macro-observatory-governance/ai-context";
import relationalStrategicObservatory from "./relational-strategic-observatory/ai-context";
import relationalStrategicCommand from "./relational-strategic-command/ai-context";
import relationalStrategicIntelligence from "./relational-strategic-intelligence/ai-context";
import relationalEconomicArbitration from "./relational-economic-arbitration/ai-context";
import relationalEconomicGovernance from "./relational-economic-governance/ai-context";
import commercialTrust from "./commercial-trust/ai-context";
import corridorIntelligence from "./corridor-intelligence/ai-context";
import economicCoordination from "./economic-coordination/ai-context";
import directionStrategy from "./direction-strategy/ai-context";
import financeCollections from "./finance-collections/ai-context";
import industrialSafety from "./industrial-safety/ai-context";
import marketingActivation from "./marketing-activation/ai-context";
import ordersAdv from "./orders-adv/ai-context";
import supplyLogistics from "./supply-logistics/ai-context";

export type PoleIntelSurface = {
  summaryLine: string;
  mapHintLine: string;
};

export const POLE_INTEL_MANIFEST: Record<PoleSlug, PoleIntelSurface> = {
  "direction-strategy": directionStrategy,
  "commercial-network": commercialNetwork,
  "marketing-activation": marketingActivation,
  "orders-adv": ordersAdv,
  "supply-logistics": supplyLogistics,
  "finance-collections": financeCollections,
  "data-intelligence": dataIntelligence,
  "economic-memory": economicMemory,
  "economic-scenarios": economicScenarios,
  "economic-propagation": economicPropagation,
  "economic-coordination": economicCoordination,
  "economic-command": economicCommand,
  "industrial-situation-room": industrialSituationRoom,
  "industrial-operational-continuity": industrialOperationalContinuity,
  "industrial-evidence": industrialEvidence,
  "commercial-relationship-graph": commercialRelationshipGraph,
  "relational-catalog": relationalCatalog,
  "relational-cart": relationalCart,
  "relational-orders": relationalOrders,
  "relational-order-execution": relationalOrderExecution,
  "relational-fulfillment": relationalFulfillment,
  "relational-operational-intelligence": relationalOperationalIntelligence,
  "relational-predictive-risk": relationalPredictiveRisk,
  "relational-operational-recommendation": relationalOperationalRecommendation,
  "relational-operational-orchestration": relationalOperationalOrchestration,
  "relational-operational-simulation": relationalOperationalSimulation,
  "relational-scenario-review": relationalScenarioReview,
  "relational-strategic-memory": relationalStrategicMemory,
  "relational-economic-signal-graph": relationalEconomicSignalGraph,
  "relational-economic-command-center": relationalEconomicCommandCenter,
  "relational-economic-pressure": relationalEconomicPressure,
  "relational-geo-economic": relationalGeoEconomic,
  "relational-sector-intelligence": relationalSectorIntelligence,
  "relational-supply-flow": relationalSupplyFlow,
  "relational-macro-economic": relationalMacroEconomic,
  "relational-economic-continuity": relationalEconomicContinuity,
  "relational-economic-sovereignty": relationalEconomicSovereignty,
  "relational-economic-recovery": relationalEconomicRecovery,
  "relational-economic-governance": relationalEconomicGovernance,
  "relational-economic-arbitration": relationalEconomicArbitration,
  "relational-economic-stabilization": relationalEconomicStabilization,
  "relational-economic-monitoring": relationalEconomicMonitoring,
  "relational-executive-orchestration": relationalExecutiveOrchestration,
  "relational-institutional-reporting": relationalInstitutionalReporting,
  "relational-strategic-intelligence": relationalStrategicIntelligence,
  "relational-strategic-command": relationalStrategicCommand,
  "relational-executive-operations": relationalExecutiveOperations,
  "relational-executive-control-room": relationalExecutiveControlRoom,
  "relational-executive-strategic-synthesis": relationalExecutiveStrategicSynthesis,
  "relational-global-executive-supervision": relationalGlobalExecutiveSupervision,
  "relational-macro-observatory-governance": relationalMacroObservatoryGovernance,
  "relational-strategic-observatory": relationalStrategicObservatory,
  "commercial-trust": commercialTrust,
  "corridor-intelligence": corridorIntelligence,
  "industrial-safety": industrialSafety,
};
