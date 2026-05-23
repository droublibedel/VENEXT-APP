import { Injectable } from "@nestjs/common";
import {
  RelationalEconomicMonitoringAlertType,
  RelationalEconomicMonitoringPriority,
  RelationalEconomicMonitoringSeverity,
} from "@prisma/client";

import type { ComputedMonitoringState } from "./relational-economic-monitoring-engine.service";
import type { EconomicMonitoringCorridorContext } from "./relational-economic-monitoring-corridor-context.service";
import { RelationalEconomicMonitoringPolicyService } from "./relational-economic-monitoring-policy.service";
import { RelationalEconomicMonitoringPriorityService } from "./relational-economic-monitoring-priority.service";

export type MonitoringAlertDraft = {
  alertCode: string;
  alertType: RelationalEconomicMonitoringAlertType;
  severity: RelationalEconomicMonitoringSeverity;
  priority: RelationalEconomicMonitoringPriority;
  alertPressure: number;
  systemicExposure: number;
};

@Injectable()
export class RelationalEconomicMonitoringAlertService {
  constructor(
    private readonly policy: RelationalEconomicMonitoringPolicyService,
    private readonly prioritySvc: RelationalEconomicMonitoringPriorityService,
  ) {}

  detectCriticalAlerts(ctx: EconomicMonitoringCorridorContext, state: ComputedMonitoringState): MonitoringAlertDraft[] {
    return [
      ...this.detectExecutiveAlerts(ctx, state),
      ...this.detectSystemicAlerts(ctx, state),
      ...this.detectCoordinationAlerts(ctx, state),
    ].filter((a, i, arr) => arr.findIndex((x) => x.alertType === a.alertType) === i);
  }

  detectExecutiveAlerts(ctx: EconomicMonitoringCorridorContext, state: ComputedMonitoringState): MonitoringAlertDraft[] {
    const alerts: MonitoringAlertDraft[] = [];
    if (state.executivePressure >= 58) {
      alerts.push(
        this.draft(ctx, state, RelationalEconomicMonitoringAlertType.EXECUTIVE_PRESSURE, state.executivePressure),
      );
    }
    return alerts;
  }

  detectSystemicAlerts(ctx: EconomicMonitoringCorridorContext, state: ComputedMonitoringState): MonitoringAlertDraft[] {
    const alerts: MonitoringAlertDraft[] = [];
    if (state.systemicEscalationDetected) {
      alerts.push(
        this.draft(ctx, state, RelationalEconomicMonitoringAlertType.SYSTEMIC_ESCALATION, state.systemicRisk),
      );
    }
    if (state.executiveUrgency >= 70) {
      alerts.push(this.draft(ctx, state, RelationalEconomicMonitoringAlertType.CRITICAL_CORRIDOR, state.executiveUrgency));
    }
    if (ctx.topStabilizationScore < 40 && ctx.topInstabilityPressure >= 55) {
      alerts.push(
        this.draft(ctx, state, RelationalEconomicMonitoringAlertType.STABILIZATION_FAILURE, ctx.topInstabilityPressure),
      );
    }
    return alerts;
  }

  detectCoordinationAlerts(ctx: EconomicMonitoringCorridorContext, state: ComputedMonitoringState): MonitoringAlertDraft[] {
    const alerts: MonitoringAlertDraft[] = [];
    if (state.governancePressure >= 60) {
      alerts.push(
        this.draft(ctx, state, RelationalEconomicMonitoringAlertType.GOVERNANCE_OVERLOAD, state.governancePressure),
      );
    }
    if (state.dependencyPressure >= 65) {
      alerts.push(
        this.draft(ctx, state, RelationalEconomicMonitoringAlertType.DEPENDENCY_COLLAPSE, state.dependencyPressure),
      );
    }
    if (ctx.sectorSlug && state.coordinationPressure >= 55) {
      alerts.push(
        this.draft(ctx, state, RelationalEconomicMonitoringAlertType.TERRITORIAL_IMBALANCE, state.coordinationPressure),
      );
    }
    if (state.recoveryPressure >= 62) {
      alerts.push(
        this.draft(ctx, state, RelationalEconomicMonitoringAlertType.RECOVERY_DEGRADATION, state.recoveryPressure),
      );
    }
    return alerts;
  }

  detectStrategicEscalation(ctx: EconomicMonitoringCorridorContext, state: ComputedMonitoringState): MonitoringAlertDraft[] {
    if (!state.systemicEscalationDetected && !state.strategicImbalanceDetected) return [];
    return [
      this.draft(
        ctx,
        state,
        RelationalEconomicMonitoringAlertType.SYSTEMIC_ESCALATION,
        Math.max(state.systemicRisk, state.executiveUrgency),
      ),
    ];
  }

  private draft(
    ctx: EconomicMonitoringCorridorContext,
    state: ComputedMonitoringState,
    alertType: RelationalEconomicMonitoringAlertType,
    pressure: number,
  ): MonitoringAlertDraft {
    const p = this.policy.clampInt(pressure);
    return {
      alertCode: `MON_ALERT:${ctx.relationshipId}:${alertType}:${Date.now()}`,
      alertType,
      severity: this.prioritySvc.toSeverity(state.executiveUrgency),
      priority: this.prioritySvc.toPriority(p),
      alertPressure: p,
      systemicExposure: state.systemicRisk,
    };
  }
}
