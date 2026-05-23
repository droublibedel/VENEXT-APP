import { BadRequestException, Body, Controller, Headers, Post, UnauthorizedException } from "@nestjs/common";
import {
  isRelationalFulfillmentRealtimeEventType,
  isRelationalFulfillmentTaskRealtimeEventType,
  isRelationalOperationalRealtimeEventType,
  isRelationalEconomicSignalRealtimeType,
  isRelationalEconomicCommandCenterRealtimeType,
  isRelationalMacroObservatoryGovernanceRealtimeEventType,
  isRelationalStrategicObservatoryRealtimeEventType,
  isRelationalGlobalExecutiveSupervisionRealtimeEventType,
  isRelationalExecutiveStrategicSynthesisRealtimeEventType,
  isRelationalExecutiveControlRoomRealtimeEventType,
  isRelationalExecutiveOperationsRealtimeEventType,
  isRelationalStrategicCommandRealtimeEventType,
  isRelationalStrategicIntelligenceRealtimeEventType,
  isRelationalInstitutionalReportingRealtimeEventType,
  isRelationalExecutiveOrchestrationRealtimeEventType,
  isRelationalEconomicMonitoringRealtimeEventType,
  isRelationalEconomicStabilizationRealtimeEventType,
  isRelationalEconomicArbitrationRealtimeEventType,
  isRelationalEconomicGovernanceRealtimeEventType,
  isRelationalEconomicRecoveryRealtimeEventType,
  isRelationalEconomicSovereigntyRealtimeEventType,
  isRelationalEconomicContinuityRealtimeEventType,
  isRelationalMacroEconomicRealtimeEventType,
  isRelationalSupplyFlowRealtimeEventType,
  isRelationalSectorRealtimeEventType,
  isRelationalGeoEconomicRealtimeEventType,
  isRelationalEconomicPressureRealtimeEventType,
  isRelationalStrategicMemoryRealtimeEventType,
  isRelationalScenarioReviewRealtimeEventType,
  isRelationalOperationalSimulationRealtimeEventType,
  isRelationalOperationalOrchestrationRealtimeEventType,
  isRelationalOperationalRecommendationRealtimeEventType,
  isRelationalPredictiveRealtimeEventType,
  isRelationalOrderExecutionRealtimeEventType,
  RelationalFulfillmentRealtimeSchema,
  RelationalFulfillmentTaskRealtimeSchema,
  RelationalOperationalRealtimeSchema,
  RelationalEconomicRealtimeSchema,
  RelationalEconomicCommandCenterRealtimeSchema,
  SectorRealtimeSchema,
  GeoEconomicRealtimeSchema,
  PressureRealtimeSchema,
  RelationalStrategicMemoryRealtimeSchema,
  RelationalScenarioReviewRealtimeSchema,
  RelationalOperationalSimulationRealtimeSchema,
  RelationalOperationalOrchestrationRealtimeSchema,
  RelationalOperationalRecommendationRealtimeSchema,
  RelationalPredictiveRealtimeSchema,
  RelationalOrderExecutionRealtimeSchema,
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
  RelationalEconomicContinuityRealtimeSchema,
  RelationalMacroEconomicRealtimeSchema,
  RelationalSupplyFlowRealtimeSchema,
  safeParseRelationalSectorRealtimeBody,
} from "@venext/shared-contracts";

import { RealtimeEconomicSignalGateway } from "./realtime/realtime-economic-signal.gateway";
import { SectorRealtimeIngressCoordinator } from "./realtime/sector-realtime-ingress.service";

@Controller()
export class InternalRelationalOrdersDomainController {
  constructor(
    private readonly gateway: RealtimeEconomicSignalGateway,
    private readonly sectorIngress: SectorRealtimeIngressCoordinator,
  ) {}

  @Post("internal/v1/realtime/relational-orders/domain-signal")
  ingest(
    @Headers("x-venext-internal-key") key: string | undefined,
    @Body()
    body: {
      organizationId: string;
      eventType: string;
      source: string;
      body?: Record<string, unknown>;
    },
  ) {
    const expect = process.env.VENEXT_INTERNAL_REALTIME_KEY?.trim();
    if (!expect || key !== expect) {
      throw new UnauthorizedException();
    }
    const et = body.eventType;
    if (typeof et === "string" && et.startsWith("relational.macro_observatory_governance.")) {
      if (!isRelationalMacroObservatoryGovernanceRealtimeEventType(et)) {
        throw new BadRequestException({ code: "relational_macro_observatory_governance_realtime_unknown_event" });
      }
      const parsed = RelationalMacroObservatoryGovernanceRealtimeSchema.safeParse(body.body ?? {});
      if (!parsed.success) {
        throw new BadRequestException({ code: "relational_macro_observatory_governance_realtime_invalid" });
      }
    }
    if (typeof et === "string" && et.startsWith("relational.strategic_observatory.")) {
      if (!isRelationalStrategicObservatoryRealtimeEventType(et)) {
        throw new BadRequestException({ code: "relational_strategic_observatory_realtime_unknown_event" });
      }
      const parsed = RelationalStrategicObservatoryRealtimeSchema.safeParse(body.body ?? {});
      if (!parsed.success) {
        throw new BadRequestException({ code: "relational_strategic_observatory_realtime_invalid" });
      }
    }
    if (typeof et === "string" && et.startsWith("relational.global_executive_supervision.")) {
      if (!isRelationalGlobalExecutiveSupervisionRealtimeEventType(et)) {
        throw new BadRequestException({ code: "relational_global_executive_supervision_realtime_unknown_event" });
      }
      const parsed = RelationalGlobalExecutiveSupervisionRealtimeSchema.safeParse(body.body ?? {});
      if (!parsed.success) {
        throw new BadRequestException({ code: "relational_global_executive_supervision_realtime_invalid" });
      }
    }
    if (typeof et === "string" && et.startsWith("relational.executive_strategic_synthesis.")) {
      if (!isRelationalExecutiveStrategicSynthesisRealtimeEventType(et)) {
        throw new BadRequestException({ code: "relational_executive_strategic_synthesis_realtime_unknown_event" });
      }
      const parsed = RelationalExecutiveStrategicSynthesisRealtimeSchema.safeParse(body.body ?? {});
      if (!parsed.success) {
        throw new BadRequestException({ code: "relational_executive_strategic_synthesis_realtime_invalid" });
      }
    }
    if (typeof et === "string" && et.startsWith("relational.executive_control_room.")) {
      if (!isRelationalExecutiveControlRoomRealtimeEventType(et)) {
        throw new BadRequestException({ code: "relational_executive_control_room_realtime_unknown_event" });
      }
      const parsed = RelationalExecutiveControlRoomRealtimeSchema.safeParse(body.body ?? {});
      if (!parsed.success) {
        throw new BadRequestException({ code: "relational_executive_control_room_realtime_invalid" });
      }
    }
    if (typeof et === "string" && et.startsWith("relational.executive_operations.")) {
      if (!isRelationalExecutiveOperationsRealtimeEventType(et)) {
        throw new BadRequestException({ code: "relational_executive_operations_realtime_unknown_event" });
      }
      const parsed = RelationalExecutiveOperationsRealtimeSchema.safeParse(body.body ?? {});
      if (!parsed.success) {
        throw new BadRequestException({ code: "relational_executive_operations_realtime_invalid" });
      }
    }
    if (typeof et === "string" && et.startsWith("relational.strategic_command.")) {
      if (!isRelationalStrategicCommandRealtimeEventType(et)) {
        throw new BadRequestException({ code: "relational_strategic_command_realtime_unknown_event" });
      }
      const parsed = RelationalStrategicCommandRealtimeSchema.safeParse(body.body ?? {});
      if (!parsed.success) {
        throw new BadRequestException({ code: "relational_strategic_command_realtime_invalid" });
      }
    }
    if (typeof et === "string" && et.startsWith("relational.strategic_intelligence.")) {
      if (!isRelationalStrategicIntelligenceRealtimeEventType(et)) {
        throw new BadRequestException({ code: "relational_strategic_intelligence_realtime_unknown_event" });
      }
      const parsed = RelationalStrategicIntelligenceRealtimeSchema.safeParse(body.body ?? {});
      if (!parsed.success) {
        throw new BadRequestException({ code: "relational_strategic_intelligence_realtime_invalid" });
      }
    }
    if (typeof et === "string" && et.startsWith("relational.institutional_reporting.")) {
      if (!isRelationalInstitutionalReportingRealtimeEventType(et)) {
        throw new BadRequestException({ code: "relational_institutional_reporting_realtime_unknown_event" });
      }
      const parsed = RelationalInstitutionalReportingRealtimeSchema.safeParse(body.body ?? {});
      if (!parsed.success) {
        throw new BadRequestException({ code: "relational_institutional_reporting_realtime_invalid" });
      }
    }
    if (typeof et === "string" && et.startsWith("relational.executive_orchestration.")) {
      if (!isRelationalExecutiveOrchestrationRealtimeEventType(et)) {
        throw new BadRequestException({ code: "relational_executive_orchestration_realtime_unknown_event" });
      }
      const parsed = RelationalExecutiveOrchestrationRealtimeSchema.safeParse(body.body ?? {});
      if (!parsed.success) {
        throw new BadRequestException({ code: "relational_executive_orchestration_realtime_invalid" });
      }
    }
    if (typeof et === "string" && et.startsWith("relational.monitoring.")) {
      if (!isRelationalEconomicMonitoringRealtimeEventType(et)) {
        throw new BadRequestException({ code: "relational_economic_monitoring_realtime_unknown_event" });
      }
      const parsed = RelationalEconomicMonitoringRealtimeSchema.safeParse(body.body ?? {});
      if (!parsed.success) {
        throw new BadRequestException({ code: "relational_economic_monitoring_realtime_invalid" });
      }
    }
    if (typeof et === "string" && et.startsWith("relational.stabilization.")) {
      if (!isRelationalEconomicStabilizationRealtimeEventType(et)) {
        throw new BadRequestException({ code: "relational_economic_stabilization_realtime_unknown_event" });
      }
      const parsed = RelationalEconomicStabilizationRealtimeSchema.safeParse(body.body ?? {});
      if (!parsed.success) {
        throw new BadRequestException({ code: "relational_economic_stabilization_realtime_invalid" });
      }
    }
    if (typeof et === "string" && et.startsWith("relational.arbitration.")) {
      if (!isRelationalEconomicArbitrationRealtimeEventType(et)) {
        throw new BadRequestException({ code: "relational_economic_arbitration_realtime_unknown_event" });
      }
      const parsed = RelationalEconomicArbitrationRealtimeSchema.safeParse(body.body ?? {});
      if (!parsed.success) {
        throw new BadRequestException({ code: "relational_economic_arbitration_realtime_invalid" });
      }
    }
    if (typeof et === "string" && et.startsWith("relational.governance.")) {
      if (!isRelationalEconomicGovernanceRealtimeEventType(et)) {
        throw new BadRequestException({ code: "relational_economic_governance_realtime_unknown_event" });
      }
      const parsed = RelationalEconomicGovernanceRealtimeSchema.safeParse(body.body ?? {});
      if (!parsed.success) {
        throw new BadRequestException({ code: "relational_economic_governance_realtime_invalid" });
      }
    }
    if (typeof et === "string" && et.startsWith("relational.recovery.")) {
      if (!isRelationalEconomicRecoveryRealtimeEventType(et)) {
        throw new BadRequestException({ code: "relational_economic_recovery_realtime_unknown_event" });
      }
      const parsed = RelationalEconomicRecoveryRealtimeSchema.safeParse(body.body ?? {});
      if (!parsed.success) {
        throw new BadRequestException({ code: "relational_economic_recovery_realtime_invalid" });
      }
    }
    if (typeof et === "string" && et.startsWith("relational.sovereignty.")) {
      if (!isRelationalEconomicSovereigntyRealtimeEventType(et)) {
        throw new BadRequestException({ code: "relational_economic_sovereignty_realtime_unknown_event" });
      }
      const parsed = RelationalEconomicSovereigntyRealtimeSchema.safeParse(body.body ?? {});
      if (!parsed.success) {
        throw new BadRequestException({ code: "relational_economic_sovereignty_realtime_invalid" });
      }
    }
    if (typeof et === "string" && et.startsWith("relational.continuity.")) {
      if (!isRelationalEconomicContinuityRealtimeEventType(et)) {
        throw new BadRequestException({ code: "relational_economic_continuity_realtime_unknown_event" });
      }
      const parsed = RelationalEconomicContinuityRealtimeSchema.safeParse(body.body ?? {});
      if (!parsed.success) {
        throw new BadRequestException({ code: "relational_economic_continuity_realtime_invalid" });
      }
    }
    if (typeof et === "string" && et.startsWith("relational.macro.")) {
      if (!isRelationalMacroEconomicRealtimeEventType(et)) {
        throw new BadRequestException({ code: "relational_macro_economic_realtime_unknown_event" });
      }
      const parsed = RelationalMacroEconomicRealtimeSchema.safeParse(body.body ?? {});
      if (!parsed.success) {
        throw new BadRequestException({ code: "relational_macro_economic_realtime_invalid" });
      }
    }
    if (typeof et === "string" && et.startsWith("relational.supply.")) {
      if (!isRelationalSupplyFlowRealtimeEventType(et)) {
        throw new BadRequestException({ code: "relational_supply_flow_realtime_unknown_event" });
      }
      const parsed = RelationalSupplyFlowRealtimeSchema.safeParse(body.body ?? {});
      if (!parsed.success) {
        throw new BadRequestException({ code: "relational_supply_flow_realtime_invalid" });
      }
    }
    if (typeof et === "string" && et.startsWith("relational.sector.")) {
      if (!isRelationalSectorRealtimeEventType(et)) {
        throw new BadRequestException({ code: "relational_sector_realtime_unknown_event" });
      }
      const parsed = safeParseRelationalSectorRealtimeBody(et, body.body ?? {});
      if (!parsed.ok) {
        throw new BadRequestException({ code: "relational_sector_realtime_invalid" });
      }
      const structured = parsed.data as Record<string, unknown>;
      if (typeof structured.eventId === "string") {
        const gate = this.sectorIngress.allowStructured(body.organizationId, et, structured);
        if (!gate.accept) {
          return { ok: true as const, deduped: gate.reason };
        }
      }
    }
    if (typeof et === "string" && et.startsWith("relational.geo.")) {
      if (!isRelationalGeoEconomicRealtimeEventType(et)) {
        throw new BadRequestException({ code: "relational_geo_economic_realtime_unknown_event" });
      }
      const parsed = GeoEconomicRealtimeSchema.safeParse(body.body ?? {});
      if (!parsed.success) {
        throw new BadRequestException({ code: "relational_geo_economic_realtime_invalid" });
      }
    }
    if (typeof et === "string" && et.startsWith("relational.pressure.")) {
      if (!isRelationalEconomicPressureRealtimeEventType(et)) {
        throw new BadRequestException({ code: "relational_pressure_realtime_unknown_event" });
      }
      const parsed = PressureRealtimeSchema.safeParse(body.body ?? {});
      if (!parsed.success) {
        throw new BadRequestException({ code: "relational_pressure_realtime_invalid" });
      }
    }
    if (typeof et === "string" && et.startsWith("relational.order.")) {
      if (!isRelationalOrderExecutionRealtimeEventType(et)) {
        throw new BadRequestException({ code: "relational_order_execution_realtime_unknown_event" });
      }
      const parsed = RelationalOrderExecutionRealtimeSchema.safeParse(body.body ?? {});
      if (!parsed.success) {
        throw new BadRequestException({ code: "relational_order_execution_realtime_invalid" });
      }
    }
    if (typeof et === "string" && et.startsWith("relational.predictive.")) {
      if (!isRelationalPredictiveRealtimeEventType(et)) {
        throw new BadRequestException({ code: "relational_predictive_realtime_unknown_event" });
      }
      const parsed = RelationalPredictiveRealtimeSchema.safeParse(body.body ?? {});
      if (!parsed.success) {
        throw new BadRequestException({ code: "relational_predictive_realtime_invalid" });
      }
    } else if (typeof et === "string" && et.startsWith("relational.command.")) {
      if (!isRelationalEconomicCommandCenterRealtimeType(et)) {
        throw new BadRequestException({ code: "relational_command_center_realtime_unknown_event" });
      }
      const parsed = RelationalEconomicCommandCenterRealtimeSchema.safeParse(body.body ?? {});
      if (!parsed.success) {
        throw new BadRequestException({ code: "relational_command_center_realtime_invalid" });
      }
    } else if (typeof et === "string" && et.startsWith("relational.economic.")) {
      if (!isRelationalEconomicSignalRealtimeType(et)) {
        throw new BadRequestException({ code: "relational_economic_signal_realtime_unknown_event" });
      }
      const parsed = RelationalEconomicRealtimeSchema.safeParse(body.body ?? {});
      if (!parsed.success) {
        throw new BadRequestException({ code: "relational_economic_signal_realtime_invalid" });
      }
    } else if (typeof et === "string" && et.startsWith("relational.memory.")) {
      if (!isRelationalStrategicMemoryRealtimeEventType(et)) {
        throw new BadRequestException({ code: "relational_strategic_memory_realtime_unknown_event" });
      }
      const parsed = RelationalStrategicMemoryRealtimeSchema.safeParse(body.body ?? {});
      if (!parsed.success) {
        throw new BadRequestException({ code: "relational_strategic_memory_realtime_invalid" });
      }
    } else if (typeof et === "string" && et.startsWith("relational.scenario.")) {
      if (!isRelationalScenarioReviewRealtimeEventType(et)) {
        throw new BadRequestException({ code: "relational_scenario_review_realtime_unknown_event" });
      }
      const parsed = RelationalScenarioReviewRealtimeSchema.safeParse(body.body ?? {});
      if (!parsed.success) {
        throw new BadRequestException({ code: "relational_scenario_review_realtime_invalid" });
      }
    } else if (typeof et === "string" && et.startsWith("relational.operational.")) {
      if (isRelationalOperationalSimulationRealtimeEventType(et)) {
        const parsed = RelationalOperationalSimulationRealtimeSchema.safeParse(body.body ?? {});
        if (!parsed.success) {
          throw new BadRequestException({ code: "relational_operational_simulation_realtime_invalid" });
        }
      } else if (isRelationalOperationalOrchestrationRealtimeEventType(et)) {
        const parsed = RelationalOperationalOrchestrationRealtimeSchema.safeParse(body.body ?? {});
        if (!parsed.success) {
          throw new BadRequestException({ code: "relational_operational_orchestration_realtime_invalid" });
        }
      } else if (isRelationalOperationalRecommendationRealtimeEventType(et)) {
        const parsed = RelationalOperationalRecommendationRealtimeSchema.safeParse(body.body ?? {});
        if (!parsed.success) {
          throw new BadRequestException({ code: "relational_operational_recommendation_realtime_invalid" });
        }
      } else if (isRelationalOperationalRealtimeEventType(et)) {
        const parsed = RelationalOperationalRealtimeSchema.safeParse(body.body ?? {});
        if (!parsed.success) {
          throw new BadRequestException({ code: "relational_operational_realtime_invalid" });
        }
      } else {
        throw new BadRequestException({ code: "relational_operational_realtime_unknown_event" });
      }
    } else if (typeof et === "string" && et.startsWith("relational.fulfillment.task_")) {
      if (!isRelationalFulfillmentTaskRealtimeEventType(et)) {
        throw new BadRequestException({ code: "relational_fulfillment_task_realtime_unknown_event" });
      }
      const parsed = RelationalFulfillmentTaskRealtimeSchema.safeParse(body.body ?? {});
      if (!parsed.success) {
        throw new BadRequestException({ code: "relational_fulfillment_task_realtime_invalid" });
      }
    } else if (typeof et === "string" && et.startsWith("relational.fulfillment.")) {
      if (!isRelationalFulfillmentRealtimeEventType(et)) {
        throw new BadRequestException({ code: "relational_fulfillment_realtime_unknown_event" });
      }
      const parsed = RelationalFulfillmentRealtimeSchema.safeParse(body.body ?? {});
      if (!parsed.success) {
        throw new BadRequestException({ code: "relational_fulfillment_realtime_invalid" });
      }
    }

    this.gateway.ingestRelationalOrdersDomainSignal(body);
    return { ok: true };
  }
}
