"use client";

import type { RelationalFulfillmentViewResponseDto } from "@venext/shared-contracts";

import type { PoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";

import { RelationalFulfillmentActionsSurface } from "./surfaces/RelationalFulfillmentActionsSurface";
import { RelationalFulfillmentGovernanceSurface } from "./surfaces/RelationalFulfillmentGovernanceSurface";
import { RelationalFulfillmentIncidentsSurface } from "./surfaces/RelationalFulfillmentIncidentsSurface";
import { RelationalFulfillmentProofsSurface } from "./surfaces/RelationalFulfillmentProofsSurface";
import { RelationalFulfillmentCoordinationPanel } from "../relational-fulfillment-coordination/RelationalFulfillmentCoordinationPanel";
import { RelationalOperationalIntelligencePanel } from "../relational-operational-intelligence/RelationalOperationalIntelligencePanel";
import { RelationalPredictiveRiskPanel } from "../relational-predictive-risk/RelationalPredictiveRiskPanel";
import { RelationalOperationalRecommendationPanel } from "../relational-operational-recommendation/RelationalOperationalRecommendationPanel";
import { RelationalOperationalOrchestrationPanel } from "../relational-operational-orchestration/RelationalOperationalOrchestrationPanel";
import { RelationalOperationalSimulationPanel } from "../relational-operational-simulation/RelationalOperationalSimulationPanel";
import { RelationalScenarioReviewPanel } from "../relational-scenario-review/RelationalScenarioReviewPanel";
import { RelationalStrategicMemoryPanel } from "../relational-strategic-memory/RelationalStrategicMemoryPanel";
import { RelationalEconomicSignalGraphPanel } from "../relational-economic-signal-graph/RelationalEconomicSignalGraphPanel";
import { RelationalEconomicCommandCenterPanel } from "../relational-economic-command-center/RelationalEconomicCommandCenterPanel";
import { RelationalEconomicPressurePanel } from "../relational-economic-pressure/RelationalEconomicPressurePanel";
import { RelationalGeoEconomicPanel } from "../relational-geo-economic/RelationalGeoEconomicPanel";
import { RelationalSectorIntelligencePanel } from "../relational-sector-intelligence/RelationalSectorIntelligencePanel";
import { RelationalMacroEconomicPanel } from "../relational-macro-economic/RelationalMacroEconomicPanel";
import { RelationalEconomicContinuityPanel } from "../relational-economic-continuity/RelationalEconomicContinuityPanel";
import { RelationalEconomicSovereigntyPanel } from "../relational-economic-sovereignty/RelationalEconomicSovereigntyPanel";
import { RelationalEconomicRecoveryPanel } from "../relational-economic-recovery/RelationalEconomicRecoveryPanel";
import { RelationalEconomicStabilizationPanel } from "../relational-economic-stabilization/RelationalEconomicStabilizationPanel";
import { RelationalEconomicMonitoringPanel } from "../relational-economic-monitoring/RelationalEconomicMonitoringPanel";
import { RelationalExecutiveOrchestrationPanel } from "../relational-executive-orchestration/RelationalExecutiveOrchestrationPanel";
import { RelationalInstitutionalReportingPanel } from "../relational-institutional-reporting/RelationalInstitutionalReportingPanel";
import { RelationalExecutiveOperationsPanel } from "../relational-executive-operations/RelationalExecutiveOperationsPanel";
import { RelationalExecutiveControlRoomPanel } from "../relational-executive-control-room/RelationalExecutiveControlRoomPanel";
import { RelationalExecutiveStrategicSynthesisPanel } from "../relational-executive-strategic-synthesis/RelationalExecutiveStrategicSynthesisPanel";
import { RelationalGlobalExecutiveSupervisionPanel } from "../relational-global-executive-supervision/RelationalGlobalExecutiveSupervisionPanel";
import { RelationalStrategicObservatoryPanel } from "../relational-strategic-observatory/RelationalStrategicObservatoryPanel";
import { RelationalMacroObservatoryGovernancePanel } from "../relational-macro-observatory-governance/RelationalMacroObservatoryGovernancePanel";
import { RelationalStrategicCommandPanel } from "../relational-strategic-command/RelationalStrategicCommandPanel";
import { RelationalStrategicIntelligencePanel } from "../relational-strategic-intelligence/RelationalStrategicIntelligencePanel";
import { RelationalEconomicArbitrationPanel } from "../relational-economic-arbitration/RelationalEconomicArbitrationPanel";
import { RelationalEconomicGovernancePanel } from "../relational-economic-governance/RelationalEconomicGovernancePanel";
import { RelationalSupplyFlowPanel } from "../relational-supply-flow/RelationalSupplyFlowPanel";
import { RelationalFulfillmentTimelineSurface } from "./surfaces/RelationalFulfillmentTimelineSurface";
import { StrategicLayerCollapsibleSection } from "./StrategicLayerCollapsibleSection";
import { VenextInlineSkeleton } from "@/ux/VenextInlineSkeleton";

export function RelationalFulfillmentWorkspace(props: {
  data: RelationalFulfillmentViewResponseDto | null;
  loading: boolean;
  error: string | null;
  orderId: string | null;
  organizationId: string | null;
  proofEnabled: boolean;
  resolutionEnabled: boolean;
  coordinationEnabled: boolean;
  intelligenceEnabled: boolean;
  predictiveEnabled: boolean;
  recommendationEnabled: boolean;
  recommendationRealtimeEnabled: boolean;
  orchestrationEnabled: boolean;
  orchestrationRealtimeEnabled: boolean;
  simulationEnabled: boolean;
  simulationRealtimeEnabled: boolean;
  reviewEnabled: boolean;
  reviewRealtimeEnabled: boolean;
  memoryEnabled: boolean;
  memoryRealtimeEnabled: boolean;
  economicGraphEnabled: boolean;
  economicGraphRealtimeEnabled: boolean;
  commandCenterEnabled: boolean;
  commandCenterRealtimeEnabled: boolean;
  pressureEnabled: boolean;
  pressureRealtimeEnabled: boolean;
  geoEconomicEnabled: boolean;
  geoEconomicRealtimeEnabled: boolean;
  sectorIntelligenceEnabled: boolean;
  sectorIntelligenceRealtimeEnabled: boolean;
  sectorRealtimeGateway?: PoleRealtimeGateway | null;
  supplyFlowEnabled: boolean;
  supplyFlowRealtimeEnabled: boolean;
  supplyFlowRealtimeGateway?: PoleRealtimeGateway | null;
  macroEconomicEnabled: boolean;
  macroEconomicRealtimeEnabled: boolean;
  macroEconomicRealtimeGateway?: PoleRealtimeGateway | null;
  economicContinuityEnabled: boolean;
  economicContinuityRealtimeEnabled: boolean;
  economicContinuityRealtimeGateway?: PoleRealtimeGateway | null;
  economicSovereigntyEnabled: boolean;
  economicSovereigntyRealtimeEnabled: boolean;
  economicSovereigntyRealtimeGateway?: PoleRealtimeGateway | null;
  economicRecoveryEnabled: boolean;
  economicRecoveryRealtimeEnabled: boolean;
  economicRecoveryRealtimeGateway?: PoleRealtimeGateway | null;
  economicGovernanceEnabled: boolean;
  economicGovernanceRealtimeEnabled: boolean;
  economicGovernanceRealtimeGateway?: PoleRealtimeGateway | null;
  economicArbitrationEnabled: boolean;
  economicArbitrationRealtimeEnabled: boolean;
  economicArbitrationRealtimeGateway?: PoleRealtimeGateway | null;
  economicStabilizationEnabled: boolean;
  economicStabilizationRealtimeEnabled: boolean;
  economicStabilizationRealtimeGateway?: PoleRealtimeGateway | null;
  economicMonitoringEnabled: boolean;
  economicMonitoringRealtimeEnabled: boolean;
  economicMonitoringRealtimeGateway?: PoleRealtimeGateway | null;
  executiveOrchestrationEnabled: boolean;
  executiveOrchestrationRealtimeEnabled: boolean;
  executiveOrchestrationRealtimeGateway?: PoleRealtimeGateway | null;
  institutionalReportingEnabled: boolean;
  institutionalReportingRealtimeEnabled: boolean;
  institutionalReportingRealtimeGateway?: PoleRealtimeGateway | null;
  strategicIntelligenceEnabled: boolean;
  strategicIntelligenceRealtimeEnabled: boolean;
  strategicIntelligenceRealtimeGateway?: PoleRealtimeGateway | null;
  strategicCommandEnabled: boolean;
  strategicCommandRealtimeEnabled: boolean;
  strategicCommandRealtimeGateway?: PoleRealtimeGateway | null;
  executiveOperationsEnabled: boolean;
  executiveOperationsRealtimeEnabled: boolean;
  executiveOperationsRealtimeGateway?: PoleRealtimeGateway | null;
  executiveControlRoomEnabled: boolean;
  executiveControlRoomRealtimeEnabled: boolean;
  executiveControlRoomRealtimeGateway?: PoleRealtimeGateway | null;
  executiveStrategicSynthesisEnabled: boolean;
  executiveStrategicSynthesisRealtimeEnabled: boolean;
  executiveStrategicSynthesisRealtimeGateway?: PoleRealtimeGateway | null;
  globalExecutiveSupervisionEnabled: boolean;
  globalExecutiveSupervisionRealtimeEnabled: boolean;
  globalExecutiveSupervisionRealtimeGateway?: PoleRealtimeGateway | null;
  strategicObservatoryEnabled: boolean;
  strategicObservatoryRealtimeEnabled: boolean;
  strategicObservatoryRealtimeGateway?: PoleRealtimeGateway | null;
  macroObservatoryGovernanceEnabled: boolean;
  macroObservatoryGovernanceRealtimeEnabled: boolean;
  macroObservatoryGovernanceRealtimeGateway?: PoleRealtimeGateway | null;
  onActionSuccess: () => void;
}) {
  const {
    data,
    loading,
    error,
    orderId,
    organizationId,
    proofEnabled,
    resolutionEnabled,
    coordinationEnabled,
    intelligenceEnabled,
    predictiveEnabled,
    recommendationEnabled,
    recommendationRealtimeEnabled,
    orchestrationEnabled,
    orchestrationRealtimeEnabled,
    simulationEnabled,
    simulationRealtimeEnabled,
    reviewEnabled,
    reviewRealtimeEnabled,
    memoryEnabled,
    memoryRealtimeEnabled,
    economicGraphEnabled,
    economicGraphRealtimeEnabled,
    commandCenterEnabled,
    commandCenterRealtimeEnabled,
    pressureEnabled,
    pressureRealtimeEnabled,
    geoEconomicEnabled,
    geoEconomicRealtimeEnabled,
    sectorIntelligenceEnabled,
    sectorIntelligenceRealtimeEnabled,
    sectorRealtimeGateway,
    supplyFlowEnabled,
    supplyFlowRealtimeEnabled,
    supplyFlowRealtimeGateway,
    macroEconomicEnabled,
    macroEconomicRealtimeEnabled,
    macroEconomicRealtimeGateway,
    economicContinuityEnabled,
    economicContinuityRealtimeEnabled,
    economicContinuityRealtimeGateway,
    economicSovereigntyEnabled,
    economicSovereigntyRealtimeEnabled,
    economicSovereigntyRealtimeGateway,
    economicRecoveryEnabled,
    economicRecoveryRealtimeEnabled,
    economicRecoveryRealtimeGateway,
    economicGovernanceEnabled,
    economicGovernanceRealtimeGateway,
    economicArbitrationEnabled,
    economicArbitrationRealtimeGateway,
    economicStabilizationEnabled,
    economicStabilizationRealtimeGateway,
    economicMonitoringEnabled,
    economicMonitoringRealtimeGateway,
    executiveOrchestrationEnabled,
    executiveOrchestrationRealtimeGateway,
    institutionalReportingEnabled,
    institutionalReportingRealtimeGateway,
    strategicIntelligenceEnabled,
    strategicIntelligenceRealtimeGateway,
    strategicCommandEnabled,
    strategicCommandRealtimeGateway,
    executiveOperationsEnabled,
    executiveOperationsRealtimeGateway,
    executiveControlRoomEnabled,
    executiveControlRoomRealtimeGateway,
    executiveStrategicSynthesisEnabled,
    executiveStrategicSynthesisRealtimeGateway,
    globalExecutiveSupervisionEnabled,
    globalExecutiveSupervisionRealtimeGateway,
    strategicObservatoryEnabled,
    strategicObservatoryRealtimeGateway,
    macroObservatoryGovernanceEnabled,
    macroObservatoryGovernanceRealtimeEnabled,
    macroObservatoryGovernanceRealtimeGateway,
    onActionSuccess,
  } = props;
  if (!orderId) {
    return (
      <p className="px-4 py-6 text-xs text-slate-500" data-testid="relational-fulfillment-missing-order">
        Ajoutez <span className="font-mono">?orderId=…&amp;organizationId=…</span> pour le fulfillment relationnel corridor.
      </p>
    );
  }
  if (loading) return <VenextInlineSkeleton />;
  if (error) {
    return (
      <p className="px-4 py-6 text-xs text-amber-200/90" data-testid="relational-fulfillment-workspace-error">
        {error}
      </p>
    );
  }
  return (
    <div className="flex min-h-0 flex-col gap-3 overflow-auto px-3 py-3 pb-24">
      <header className="rounded border border-cyan-900/40 bg-slate-950/90 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-200/90">Fulfillment relationnel</p>
        <p className="mt-1 text-[10px] text-slate-500">
          Suivi opérationnel inter-entreprises — réception commerciale, preuves, conformité corridor — pas livraison grand public.
        </p>
        <p className="mt-1 font-mono text-[9px] text-slate-400">orderId={orderId}</p>
      </header>
      <RelationalFulfillmentGovernanceSurface data={data} />
      <RelationalFulfillmentActionsSurface
        data={data}
        organizationId={organizationId}
        proofEnabled={proofEnabled}
        resolutionEnabled={resolutionEnabled}
        onActionSuccess={onActionSuccess}
      />
      <RelationalFulfillmentTimelineSurface data={data} />
      <RelationalFulfillmentProofsSurface data={data} />
      <RelationalFulfillmentIncidentsSurface data={data} />
      <RelationalFulfillmentCoordinationPanel
        organizationId={organizationId}
        recordId={data?.fulfillment.id ?? null}
        coordinationEnabled={coordinationEnabled}
        onRefresh={onActionSuccess}
      />
      <StrategicLayerCollapsibleSection
        sectionId="operational-analytics"
        title="Analytique opérationnelle"
        subtitle="Intelligence, prédiction, recommandations, orchestration — replié par défaut (instruction 20.44)."
        layerCount={9}
        defaultOpen={false}
      >
      <RelationalOperationalIntelligencePanel
        organizationId={organizationId}
        relationshipId={data?.fulfillment.relationshipId ?? null}
        intelligenceEnabled={intelligenceEnabled}
      />
      <RelationalPredictiveRiskPanel
        organizationId={organizationId}
        relationshipId={data?.fulfillment.relationshipId ?? null}
        predictiveEnabled={predictiveEnabled}
      />
      <RelationalOperationalRecommendationPanel
        organizationId={organizationId}
        relationshipId={data?.fulfillment.relationshipId ?? null}
        recommendationEnabled={recommendationEnabled}
        realtimeEnabled={recommendationRealtimeEnabled}
      />
      <RelationalOperationalOrchestrationPanel
        organizationId={organizationId}
        relationshipId={data?.fulfillment.relationshipId ?? null}
        orchestrationEnabled={orchestrationEnabled}
        realtimeEnabled={orchestrationRealtimeEnabled}
      />
      <RelationalOperationalSimulationPanel
        organizationId={organizationId}
        relationshipId={data?.fulfillment.relationshipId ?? null}
        simulationEnabled={simulationEnabled}
        realtimeEnabled={simulationRealtimeEnabled}
      />
      <RelationalScenarioReviewPanel
        organizationId={organizationId}
        relationshipId={data?.fulfillment.relationshipId ?? null}
        reviewEnabled={reviewEnabled}
        realtimeEnabled={reviewRealtimeEnabled}
      />
      <RelationalStrategicMemoryPanel
        organizationId={organizationId}
        relationshipId={data?.fulfillment.relationshipId ?? null}
        memoryEnabled={memoryEnabled}
        realtimeEnabled={memoryRealtimeEnabled}
      />
      <RelationalEconomicSignalGraphPanel
        organizationId={organizationId}
        relationshipId={data?.fulfillment.relationshipId ?? null}
        graphEnabled={economicGraphEnabled}
        realtimeEnabled={economicGraphRealtimeEnabled}
      />
      <RelationalEconomicCommandCenterPanel
        embedded
        organizationId={organizationId}
        relationshipId={data?.fulfillment.relationshipId ?? null}
        commandEnabled={commandCenterEnabled}
        realtimeEnabled={commandCenterRealtimeEnabled}
      />
      </StrategicLayerCollapsibleSection>
      <StrategicLayerCollapsibleSection
        sectionId="strategic-economic-corridor"
        title="Corridor économique stratégique"
        subtitle="Pression, géo, secteur, flux, macro — couches terrain repliées."
        layerCount={7}
        defaultOpen={false}
      >
      <RelationalEconomicPressurePanel
        embedded
        organizationId={organizationId}
        relationshipId={data?.fulfillment.relationshipId ?? null}
        pressureEnabled={pressureEnabled}
        realtimeEnabled={pressureRealtimeEnabled}
      />
      <RelationalGeoEconomicPanel
        embedded
        organizationId={organizationId}
        relationshipId={data?.fulfillment.relationshipId ?? null}
        geoEnabled={geoEconomicEnabled}
        realtimeEnabled={geoEconomicRealtimeEnabled}
      />
      <RelationalSectorIntelligencePanel
        embedded
        organizationId={organizationId}
        relationshipId={data?.fulfillment.relationshipId ?? null}
        sectorEnabled={sectorIntelligenceEnabled}
        realtimeEnabled={sectorIntelligenceRealtimeEnabled}
        realtimeGateway={sectorRealtimeGateway ?? null}
      />
      <RelationalSupplyFlowPanel
        embedded
        organizationId={organizationId}
        relationshipId={data?.fulfillment.relationshipId ?? null}
        supplyFlowEnabled={supplyFlowEnabled}
        realtimeEnabled={supplyFlowRealtimeEnabled}
        realtimeGateway={supplyFlowRealtimeGateway ?? null}
      />
      <RelationalMacroEconomicPanel
        embedded
        organizationId={organizationId}
        relationshipId={data?.fulfillment.relationshipId ?? null}
        macroEnabled={macroEconomicEnabled}
        realtimeEnabled={macroEconomicRealtimeEnabled}
        realtimeGateway={macroEconomicRealtimeGateway ?? null}
      />
      <RelationalEconomicContinuityPanel
        embedded
        organizationId={organizationId}
        relationshipId={data?.fulfillment.relationshipId ?? null}
        continuityEnabled={economicContinuityEnabled}
        realtimeEnabled={economicContinuityRealtimeEnabled}
        realtimeGateway={economicContinuityRealtimeGateway ?? null}
      />
      </StrategicLayerCollapsibleSection>
      <StrategicLayerCollapsibleSection
        sectionId="level5-executive"
        title="Niveau 5 — coordination exécutive"
        subtitle="20.28 → 20.40 — gouvernance macro-corridors, replié par défaut."
        layerCount={8}
        defaultOpen={false}
      >
      <RelationalEconomicSovereigntyPanel
        embedded
        organizationId={organizationId}
        relationshipId={data?.fulfillment.relationshipId ?? null}
        sovereigntyEnabled={economicSovereigntyEnabled}
        realtimeEnabled={economicSovereigntyRealtimeEnabled}
        realtimeGateway={economicSovereigntyRealtimeGateway ?? null}
      />
      <RelationalEconomicRecoveryPanel
        embedded
        organizationId={organizationId}
        relationshipId={data?.fulfillment.relationshipId ?? null}
        recoveryEnabled={economicRecoveryEnabled}
        realtimeEnabled={economicRecoveryRealtimeEnabled}
        realtimeGateway={economicRecoveryRealtimeGateway ?? null}
      />
      <RelationalEconomicGovernancePanel
        embedded
        organizationId={organizationId}
        relationshipId={data?.fulfillment.relationshipId ?? null}
        governanceEnabled={economicGovernanceEnabled}
        realtimeGateway={economicGovernanceRealtimeGateway ?? null}
      />
      <RelationalEconomicArbitrationPanel
        embedded
        organizationId={organizationId}
        relationshipId={data?.fulfillment.relationshipId ?? null}
        arbitrationEnabled={economicArbitrationEnabled}
        realtimeGateway={economicArbitrationRealtimeGateway ?? null}
      />
      <RelationalEconomicStabilizationPanel
        embedded
        organizationId={organizationId}
        relationshipId={data?.fulfillment.relationshipId ?? null}
        stabilizationEnabled={economicStabilizationEnabled}
        realtimeGateway={economicStabilizationRealtimeGateway ?? null}
      />
      <RelationalEconomicMonitoringPanel
        embedded
        organizationId={organizationId}
        relationshipId={data?.fulfillment.relationshipId ?? null}
        monitoringEnabled={economicMonitoringEnabled}
        realtimeGateway={economicMonitoringRealtimeGateway ?? null}
      />
      <RelationalExecutiveOrchestrationPanel
        embedded
        organizationId={organizationId}
        relationshipId={data?.fulfillment.relationshipId ?? null}
        orchestrationEnabled={executiveOrchestrationEnabled}
        realtimeGateway={executiveOrchestrationRealtimeGateway ?? null}
      />
      <RelationalInstitutionalReportingPanel
        embedded
        organizationId={organizationId}
        relationshipId={data?.fulfillment.relationshipId ?? null}
        reportingEnabled={institutionalReportingEnabled}
        realtimeGateway={institutionalReportingRealtimeGateway ?? null}
      />
      <RelationalStrategicIntelligencePanel
        embedded
        organizationId={organizationId}
        relationshipId={data?.fulfillment.relationshipId ?? null}
        intelligenceEnabled={strategicIntelligenceEnabled}
        realtimeGateway={strategicIntelligenceRealtimeGateway ?? null}
      />
      <RelationalStrategicCommandPanel
        embedded
        organizationId={organizationId}
        relationshipId={data?.fulfillment.relationshipId ?? null}
        commandEnabled={strategicCommandEnabled}
        realtimeGateway={strategicCommandRealtimeGateway ?? null}
      />
      <RelationalExecutiveOperationsPanel
        embedded
        organizationId={organizationId}
        relationshipId={data?.fulfillment.relationshipId ?? null}
        operationsEnabled={executiveOperationsEnabled}
        realtimeGateway={executiveOperationsRealtimeGateway ?? null}
      />
      <RelationalExecutiveControlRoomPanel
        embedded
        organizationId={organizationId}
        relationshipId={data?.fulfillment.relationshipId ?? null}
        controlRoomEnabled={executiveControlRoomEnabled}
        realtimeGateway={executiveControlRoomRealtimeGateway ?? null}
      />
      <RelationalExecutiveStrategicSynthesisPanel
        embedded
        organizationId={organizationId}
        relationshipId={data?.fulfillment.relationshipId ?? null}
        synthesisEnabled={executiveStrategicSynthesisEnabled}
        realtimeGateway={executiveStrategicSynthesisRealtimeGateway ?? null}
      />
      </StrategicLayerCollapsibleSection>
      <StrategicLayerCollapsibleSection
        sectionId="level5-observatory"
        title="Niveau 5 — observatoire & gouvernance macro"
        subtitle="20.41 → 20.43 — supervision globale et gouvernance réseau, replié par défaut."
        layerCount={3}
        defaultOpen={false}
      >
      <RelationalGlobalExecutiveSupervisionPanel
        embedded
        organizationId={organizationId}
        relationshipId={data?.fulfillment.relationshipId ?? null}
        supervisionEnabled={globalExecutiveSupervisionEnabled}
        realtimeGateway={globalExecutiveSupervisionRealtimeGateway ?? null}
      />
      <RelationalStrategicObservatoryPanel
        embedded
        organizationId={organizationId}
        relationshipId={data?.fulfillment.relationshipId ?? null}
        observatoryEnabled={strategicObservatoryEnabled}
        realtimeGateway={strategicObservatoryRealtimeGateway ?? null}
      />
      <RelationalMacroObservatoryGovernancePanel
        embedded
        organizationId={organizationId}
        relationshipId={data?.fulfillment.relationshipId ?? null}
        governanceEnabled={macroObservatoryGovernanceEnabled}
        realtimeGateway={macroObservatoryGovernanceRealtimeGateway ?? null}
      />
      </StrategicLayerCollapsibleSection>
    </div>
  );
}
