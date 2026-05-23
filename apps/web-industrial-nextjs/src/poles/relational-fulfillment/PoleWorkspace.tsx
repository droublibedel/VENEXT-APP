"use client";

import { useIndustrialFeatureFlags } from "../hooks/useIndustrialFeatureFlags";
import { usePoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";
import { OperationalPoleCanvas } from "../shell/OperationalPoleCanvas";
import type { PoleSlug } from "../types";
import { getPoleEntry } from "../registry";
import { resolveRelationalOrdersOrganizationId } from "../relational-orders/resolveRelationalOrdersOrganizationId";
import { RelationalFulfillmentRealtimeStrip } from "./surfaces/RelationalFulfillmentRealtimeStrip";
import { RelationalFulfillmentWorkspace } from "./RelationalFulfillmentWorkspace";
import { useRelationalFulfillment, useRelationalFulfillmentRouteIds } from "./useRelationalFulfillment";

const SLUG = "relational-fulfillment" as const satisfies PoleSlug;

export default function PoleWorkspace() {
  const org = resolveRelationalOrdersOrganizationId();
  const route = useRelationalFulfillmentRouteIds();
  const organizationId = route.organizationId ?? org.organizationId;
  const { orderId } = route;
  const entry = getPoleEntry(SLUG);
  const { flags, hydrated } = useIndustrialFeatureFlags();
  const gatewayEnabled =
    hydrated &&
    flags.industrial_poles_enabled !== false &&
    flags.realtime_signals_enabled !== false &&
    flags.relational_fulfillment_enabled !== false &&
    Boolean(entry);

  const realtimeGateway = usePoleRealtimeGateway({
    poleChannel: entry?.poleChannel ?? "",
    enabled: gatewayEnabled,
    subscribeOrganizationId: organizationId,
    subscribeToken: process.env.NEXT_PUBLIC_VENEXT_WS_SUBSCRIBE_TOKEN,
  });

  const fulfillmentData = useRelationalFulfillment(organizationId, orderId);

  return (
    <div className="flex min-h-0 flex-col">
      {flags.relational_fulfillment_realtime_enabled !== false ? (
        <RelationalFulfillmentRealtimeStrip gateway={realtimeGateway} />
      ) : (
        <p className="px-4 pt-2 text-[10px] text-slate-500">
          Temps réel coupé par <span className="font-mono">relational_fulfillment_realtime_enabled</span>.
        </p>
      )}
      <RelationalFulfillmentWorkspace
        data={fulfillmentData.data}
        loading={fulfillmentData.loading}
        error={fulfillmentData.error}
        orderId={orderId}
        organizationId={organizationId}
        proofEnabled={flags.relational_fulfillment_proof_enabled !== false}
        resolutionEnabled={flags.relational_fulfillment_incident_resolution_enabled !== false}
        coordinationEnabled={flags.relational_fulfillment_coordination_enabled !== false}
        intelligenceEnabled={flags.relational_operational_intelligence_enabled !== false}
        predictiveEnabled={flags.relational_predictive_risk_enabled !== false}
        recommendationEnabled={flags.relational_operational_recommendation_enabled !== false}
        recommendationRealtimeEnabled={flags.relational_operational_recommendation_realtime_enabled !== false}
        orchestrationEnabled={flags.relational_operational_orchestration_enabled !== false}
        orchestrationRealtimeEnabled={flags.relational_operational_orchestration_realtime_enabled !== false}
        simulationEnabled={flags.relational_operational_simulation_enabled !== false}
        simulationRealtimeEnabled={flags.relational_operational_simulation_realtime_enabled !== false}
        reviewEnabled={flags.relational_scenario_review_enabled !== false}
        reviewRealtimeEnabled={flags.relational_scenario_review_realtime_enabled !== false}
        memoryEnabled={flags.relational_strategic_memory_enabled !== false}
        memoryRealtimeEnabled={flags.relational_strategic_memory_realtime_enabled !== false}
        economicGraphEnabled={flags.relational_economic_signal_graph_enabled !== false}
        economicGraphRealtimeEnabled={flags.relational_economic_signal_graph_realtime_enabled !== false}
        commandCenterEnabled={flags.relational_economic_command_center_enabled !== false}
        commandCenterRealtimeEnabled={flags.relational_economic_command_center_realtime_enabled !== false}
        pressureEnabled={flags.relational_economic_pressure_enabled !== false}
        pressureRealtimeEnabled={flags.relational_economic_pressure_realtime_enabled !== false}
        geoEconomicEnabled={flags.relational_geo_economic_enabled !== false}
        geoEconomicRealtimeEnabled={flags.relational_geo_economic_realtime_enabled !== false}
        sectorIntelligenceEnabled={flags.relational_sector_intelligence_enabled !== false}
        sectorIntelligenceRealtimeEnabled={flags.relational_sector_realtime_enabled !== false}
        sectorRealtimeGateway={gatewayEnabled ? realtimeGateway : null}
        supplyFlowEnabled={flags.relational_supply_flow_enabled !== false}
        supplyFlowRealtimeEnabled={flags.relational_supply_flow_realtime_enabled !== false}
        supplyFlowRealtimeGateway={gatewayEnabled ? realtimeGateway : null}
        macroEconomicEnabled={flags.relational_macro_economic_enabled !== false}
        macroEconomicRealtimeEnabled={flags.relational_macro_economic_realtime_enabled !== false}
        macroEconomicRealtimeGateway={gatewayEnabled ? realtimeGateway : null}
        economicContinuityEnabled={flags.relational_economic_continuity_enabled !== false}
        economicContinuityRealtimeEnabled={flags.relational_economic_continuity_realtime_enabled !== false}
        economicContinuityRealtimeGateway={gatewayEnabled ? realtimeGateway : null}
        economicSovereigntyEnabled={flags.relational_economic_sovereignty_enabled !== false}
        economicSovereigntyRealtimeEnabled={flags.relational_economic_sovereignty_realtime_enabled !== false}
        economicSovereigntyRealtimeGateway={gatewayEnabled ? realtimeGateway : null}
        economicRecoveryEnabled={flags.relational_economic_recovery_enabled !== false}
        economicRecoveryRealtimeEnabled={flags.relational_economic_recovery_realtime_enabled !== false}
        economicRecoveryRealtimeGateway={gatewayEnabled ? realtimeGateway : null}
        economicGovernanceEnabled={flags.relational_economic_governance_enabled !== false}
        economicGovernanceRealtimeEnabled={flags.relational_economic_governance_realtime_enabled !== false}
        economicGovernanceRealtimeGateway={gatewayEnabled ? realtimeGateway : null}
        economicArbitrationEnabled={flags.relational_economic_arbitration_enabled !== false}
        economicArbitrationRealtimeEnabled={flags.relational_economic_arbitration_realtime_enabled !== false}
        economicArbitrationRealtimeGateway={gatewayEnabled ? realtimeGateway : null}
        economicStabilizationEnabled={flags.relational_economic_stabilization_enabled !== false}
        economicStabilizationRealtimeEnabled={flags.relational_economic_stabilization_realtime_enabled !== false}
        economicStabilizationRealtimeGateway={gatewayEnabled ? realtimeGateway : null}
        economicMonitoringEnabled={flags.relational_economic_monitoring_enabled !== false}
        economicMonitoringRealtimeEnabled={flags.relational_economic_monitoring_realtime_enabled !== false}
        economicMonitoringRealtimeGateway={gatewayEnabled ? realtimeGateway : null}
        executiveOrchestrationEnabled={flags.relational_executive_orchestration_enabled !== false}
        executiveOrchestrationRealtimeEnabled={flags.relational_executive_orchestration_realtime_enabled !== false}
        executiveOrchestrationRealtimeGateway={gatewayEnabled ? realtimeGateway : null}
        institutionalReportingEnabled={flags.relational_institutional_reporting_enabled !== false}
        institutionalReportingRealtimeEnabled={flags.relational_institutional_reporting_realtime_enabled !== false}
        institutionalReportingRealtimeGateway={gatewayEnabled ? realtimeGateway : null}
        strategicIntelligenceEnabled={flags.relational_strategic_intelligence_enabled !== false}
        strategicIntelligenceRealtimeEnabled={flags.relational_strategic_intelligence_realtime_enabled !== false}
        strategicIntelligenceRealtimeGateway={gatewayEnabled ? realtimeGateway : null}
        strategicCommandEnabled={flags.relational_strategic_command_enabled !== false}
        strategicCommandRealtimeEnabled={flags.relational_strategic_command_realtime_enabled !== false}
        strategicCommandRealtimeGateway={gatewayEnabled ? realtimeGateway : null}
        executiveOperationsEnabled={flags.relational_executive_operations_enabled !== false}
        executiveOperationsRealtimeEnabled={flags.relational_executive_operations_realtime_enabled !== false}
        executiveOperationsRealtimeGateway={gatewayEnabled ? realtimeGateway : null}
        executiveControlRoomEnabled={flags.relational_executive_control_room_enabled !== false}
        executiveControlRoomRealtimeEnabled={flags.relational_executive_control_room_realtime_enabled !== false}
        executiveControlRoomRealtimeGateway={gatewayEnabled ? realtimeGateway : null}
        executiveStrategicSynthesisEnabled={flags.relational_executive_strategic_synthesis_enabled !== false}
        executiveStrategicSynthesisRealtimeEnabled={flags.relational_executive_strategic_synthesis_realtime_enabled !== false}
        executiveStrategicSynthesisRealtimeGateway={gatewayEnabled ? realtimeGateway : null}
        globalExecutiveSupervisionEnabled={flags.relational_global_executive_supervision_enabled !== false}
        globalExecutiveSupervisionRealtimeEnabled={flags.relational_global_executive_supervision_realtime_enabled !== false}
        globalExecutiveSupervisionRealtimeGateway={gatewayEnabled ? realtimeGateway : null}
        strategicObservatoryEnabled={flags.relational_strategic_observatory_enabled !== false}
        strategicObservatoryRealtimeEnabled={flags.relational_strategic_observatory_realtime_enabled !== false}
        strategicObservatoryRealtimeGateway={gatewayEnabled ? realtimeGateway : null}
        macroObservatoryGovernanceEnabled={flags.relational_macro_observatory_governance_enabled !== false}
        macroObservatoryGovernanceRealtimeEnabled={
          flags.relational_macro_observatory_governance_realtime_enabled !== false
        }
        macroObservatoryGovernanceRealtimeGateway={gatewayEnabled ? realtimeGateway : null}
        onActionSuccess={() => fulfillmentData.reload()}
      />
      <OperationalPoleCanvas poleSlug={SLUG} realtimeGateway={realtimeGateway} />
    </div>
  );
}
