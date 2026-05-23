import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
} from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { RelationalOperationalSimulationType } from "@prisma/client";
import {
  RelationalOperationalSimulationActionResponseSchema,
  RelationalOperationalSimulationCancelRequestSchema,
  RelationalOperationalSimulationListSchema,
  RelationalOperationalSimulationOverviewSchema,
  RelationalOperationalSimulationReviewRequestSchema,
  RelationalOperationalSimulationRunRequestSchema,
  RelationalOperationalSimulationSchema,
  type RelationalOperationalSimulationActionResponseDto,
  type RelationalOperationalSimulationDto,
  type RelationalOperationalSimulationRealtimeEventType,
} from "@venext/shared-contracts";

import { PrismaService } from "../../prisma/prisma.service";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import {
  type SimulationCorridorInputs,
  SIMULATION_ENGINE_THRESHOLDS,
  RelationalOperationalSimulationPolicyService,
} from "./relational-operational-simulation-policy.service";
import { RelationalScenarioReviewIngestionService } from "../relational-scenario-review/relational-scenario-review-ingestion.service";
import { RelationalOperationalSimulationRealtimeService } from "./relational-operational-simulation-realtime.service";

@Injectable()
export class RelationalOperationalSimulationService {
  private readonly log = new Logger(RelationalOperationalSimulationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalOperationalSimulationPolicyService,
    private readonly corridorPolicy: RelationshipGovernancePolicyService,
    private readonly realtime: RelationalOperationalSimulationRealtimeService,
    @Inject(forwardRef(() => RelationalScenarioReviewIngestionService))
    private readonly reviewIngestion: RelationalScenarioReviewIngestionService,
  ) {}

  private toDto(
    row: {
      id: string;
      relationshipId: string;
      simulationType: RelationalOperationalSimulationType;
      status: import("@prisma/client").RelationalOperationalSimulationStatus;
      severity: import("@prisma/client").RelationalOperationalSimulationSeverity;
      title: string;
      description: string;
      simulationCode: string;
      expectedRiskScore: number;
      resultingRiskScore: number | null;
      outcome: import("@prisma/client").RelationalOperationalSimulationOutcome | null;
      deterministic: boolean;
      requiresHumanReview: boolean;
      startedAt: Date | null;
      completedAt: Date | null;
      expiresAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
    },
    scenarios: Parameters<RelationalOperationalSimulationService["toScenarioDto"]>[0][],
    results: Parameters<RelationalOperationalSimulationService["toResultDto"]>[0][],
  ): RelationalOperationalSimulationDto {
    const dto = {
      ...row,
      deterministic: true as const,
      resultingRiskScore: row.resultingRiskScore,
      outcome: row.outcome,
      startedAt: row.startedAt?.toISOString() ?? null,
      completedAt: row.completedAt?.toISOString() ?? null,
      expiresAt: row.expiresAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      scenarios: scenarios.map((s) => this.toScenarioDto(s)),
      results: results.map((r) => this.toResultDto(r)),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalOperationalSimulationSchema.safeParse(dto);
    if (!p.success) throw new BadRequestException({ code: "operational_simulation_contract_invalid" });
    return p.data;
  }

  private toScenarioDto(row: {
    id: string;
    simulationId: string;
    scenarioCode: string;
    scenarioTitle: string;
    scenarioDescription: string;
    scenarioOrder: number;
    createdAt: Date;
  }) {
    return {
      id: row.id,
      simulationId: row.simulationId,
      scenarioCode: row.scenarioCode,
      scenarioTitle: row.scenarioTitle,
      scenarioDescription: row.scenarioDescription,
      scenarioOrder: row.scenarioOrder,
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toResultDto(row: {
    id: string;
    simulationId: string;
    resultCode: string;
    resultTitle: string;
    resultDescription: string;
    calculatedRiskScore: number;
    projectedSlaImpact: number;
    projectedOperationalImpact: number;
    projectedCorridorState: string;
    createdAt: Date;
  }) {
    return {
      id: row.id,
      simulationId: row.simulationId,
      resultCode: row.resultCode,
      resultTitle: row.resultTitle,
      resultDescription: row.resultDescription,
      calculatedRiskScore: row.calculatedRiskScore,
      projectedSlaImpact: row.projectedSlaImpact,
      projectedOperationalImpact: row.projectedOperationalImpact,
      projectedCorridorState: row.projectedCorridorState,
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async assertObservationAllowed(relationshipId: string) {
    await this.corridorPolicy.assertCorridorOperational(relationshipId, "operational_observation");
    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      select: {
        corridorState: true,
        corridorHealthScore: true,
        requesterOrganizationId: true,
        receiverOrganizationId: true,
      },
    });
    if (!rel) throw new NotFoundException(relationshipId);
    const order = await this.prisma.order.findFirst({
      where: { relationshipId },
      select: { buyerOrganizationId: true, sellerOrganizationId: true },
      orderBy: { createdAt: "desc" },
    });
    return {
      corridorState: rel.corridorState,
      corridorHealthScore: rel.corridorHealthScore ?? 70,
      buyerOrganizationId: order?.buyerOrganizationId ?? rel.requesterOrganizationId,
      sellerOrganizationId: order?.sellerOrganizationId ?? rel.receiverOrganizationId,
    };
  }

  assertCanRunSimulation(corridorState: string): void {
    if (corridorState === "TERMINATED" || corridorState === "SUSPENDED") {
      throw new ForbiddenException({ code: "simulation_corridor_not_eligible_for_running" });
    }
  }

  private async gatherInputs(relationshipId: string, stressMultiplier: number): Promise<SimulationCorridorInputs> {
    const ctx = await this.assertObservationAllowed(relationshipId);
    const orders = await this.prisma.order.findMany({ where: { relationshipId }, select: { id: true } });
    const orderIds = orders.map((o) => o.id);
    const openIncidents =
      orderIds.length > 0
        ? await this.prisma.relationalFulfillmentIncident.count({
            where: {
              fulfillmentRecord: { orderId: { in: orderIds } },
              resolutionStatus: { not: "RESOLVED" },
            },
          })
        : 0;
    const recordIds =
      orderIds.length > 0
        ? (
            await this.prisma.relationalFulfillmentRecord.findMany({
              where: { orderId: { in: orderIds } },
              select: { id: true },
            })
          ).map((r) => r.id)
        : [];
    const openTasks =
      recordIds.length > 0
        ? await this.prisma.relationalFulfillmentTask.count({
            where: { fulfillmentRecordId: { in: recordIds }, taskStatus: { not: "COMPLETED" } },
          })
        : 0;
    const openAlerts = await this.prisma.relationalOperationalAlert.count({
      where: { relationshipId, resolvedAt: null },
    });
    const criticalAlerts = await this.prisma.relationalOperationalAlert.count({
      where: { relationshipId, resolvedAt: null, severity: "CRITICAL" },
    });
    const openRecommendations = await this.prisma.relationalOperationalRecommendation.count({
      where: { relationshipId, status: { in: ["ACTIVE", "ACKNOWLEDGED"] } },
    });
    const openOrchestrations = await this.prisma.relationalOperationalOrchestration.count({
      where: { relationshipId, status: { in: ["DRAFT", "ACTIVE", "PAUSED", "WAITING_VALIDATION"] } },
    });
    const predictiveSignals = await this.prisma.relationalPredictiveRiskSignal.count({
      where: { relationshipId, resolvedAt: null },
    });
    return {
      openAlerts,
      criticalAlerts,
      openIncidents,
      openTasks,
      openRecommendations,
      openOrchestrations,
      corridorHealthScore: ctx.corridorHealthScore,
      corridorState: ctx.corridorState,
      predictiveSignals,
      stressMultiplier,
    };
  }

  private async loadSimulation(id: string) {
    const row = await this.prisma.relationalOperationalSimulation.findUnique({
      where: { id },
      include: {
        scenarios: { orderBy: { scenarioOrder: "asc" } },
        results: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!row) throw new NotFoundException(id);
    return row;
  }

  async listSimulations(input: { organizationId: string; relationshipId?: string }) {
    if (input.relationshipId) await this.assertObservationAllowed(input.relationshipId);
    const relFilter = input.relationshipId
      ? { relationshipId: input.relationshipId }
      : {
          relationship: {
            OR: [
              { requesterOrganizationId: input.organizationId },
              { receiverOrganizationId: input.organizationId },
              { upstreamOrganizationId: input.organizationId },
              { downstreamOrganizationId: input.organizationId },
            ],
          },
        };
    const rows = await this.prisma.relationalOperationalSimulation.findMany({
      where: relFilter,
      include: { scenarios: { orderBy: { scenarioOrder: "asc" } }, results: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    const simulations = rows.map((r) => this.toDto(r, r.scenarios, r.results));
    return RelationalOperationalSimulationListSchema.parse({
      simulations,
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
  }

  async buildOverview(relationshipId: string) {
    await this.assertObservationAllowed(relationshipId);
    const rows = await this.prisma.relationalOperationalSimulation.findMany({ where: { relationshipId } });
    const completed = rows.filter((r) => r.status === "COMPLETED");
    const avg =
      completed.length > 0
        ? completed.reduce((s, r) => s + (r.resultingRiskScore ?? 0), 0) / completed.length
        : 0;
    return RelationalOperationalSimulationOverviewSchema.parse({
      relationshipId,
      completedCount: completed.length,
      runningCount: rows.filter((r) => r.status === "RUNNING").length,
      highRiskCount: completed.filter((r) => r.outcome === "HIGH_RISK" || r.outcome === "COLLAPSE_RISK").length,
      collapseRiskCount: completed.filter((r) => r.outcome === "COLLAPSE_RISK").length,
      averageResultingRisk: Math.round(avg * 100) / 100,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
  }

  private async publish(
    row: Awaited<ReturnType<typeof this.loadSimulation>>,
    event: RelationalOperationalSimulationRealtimeEventType,
  ) {
    const parties = await this.assertObservationAllowed(row.relationshipId);
    void this.realtime
      .publishBothSides({
        buyerOrganizationId: parties.buyerOrganizationId,
        sellerOrganizationId: parties.sellerOrganizationId,
        simulationId: row.id,
        relationshipId: row.relationshipId,
        simulationType: row.simulationType,
        severity: row.severity,
        outcome: row.outcome,
        realtimeEventType: event,
      })
      .catch((e) => this.log.warn(String(e)));
  }

  private actionResponse(row: Awaited<ReturnType<typeof this.loadSimulation>>): RelationalOperationalSimulationActionResponseDto {
    return RelationalOperationalSimulationActionResponseSchema.parse({
      simulation: this.toDto(row, row.scenarios, row.results),
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
  }

  async runSimulation(input: {
    relationshipId: string;
    body: unknown;
  }): Promise<RelationalOperationalSimulationActionResponseDto> {
    const parsed = RelationalOperationalSimulationRunRequestSchema.safeParse(input.body ?? {});
    if (!parsed.success) throw new BadRequestException({ code: "simulation_run_invalid" });

    const ctx = await this.assertObservationAllowed(input.relationshipId);
    this.assertCanRunSimulation(ctx.corridorState);

    const running = await this.prisma.relationalOperationalSimulation.count({
      where: { relationshipId: input.relationshipId, status: "RUNNING" },
    });
    if (running >= SIMULATION_ENGINE_THRESHOLDS.maxRunningPerRelationship) {
      throw new BadRequestException({ code: "simulation_max_running" });
    }

    const stressMultiplier = parsed.data.stressMultiplier ?? 1;
    const inputs = await this.gatherInputs(input.relationshipId, stressMultiplier);
    const expectedRisk = this.policy.computeRiskScore(inputs);
    const severity = this.policy.severityFromScore(expectedRisk);
    const requiresHumanReview = this.policy.requiresHumanReview(parsed.data.simulationType);
    const now = new Date();
    const code = this.policy.buildCode(parsed.data.simulationType, input.relationshipId);

    const sim = await this.prisma.relationalOperationalSimulation.create({
      data: {
        relationshipId: input.relationshipId,
        simulationType: parsed.data.simulationType,
        status: "RUNNING",
        severity,
        title: `Simulation ${parsed.data.simulationType}`,
        description: "Projection déterministe — aucune mutation opérationnelle réelle.",
        simulationCode: code,
        expectedRiskScore: expectedRisk,
        requiresHumanReview,
        deterministic: true,
        startedAt: now,
        expiresAt: new Date(now.getTime() + SIMULATION_ENGINE_THRESHOLDS.expirationDays * 86400000),
        simulationMetadata: { notes: parsed.data.notes ?? null, stressMultiplier } as Prisma.InputJsonValue,
      },
    });

    const templates = this.policy.scenarioTemplatesFor(parsed.data.simulationType);
    await Promise.all(
      templates.map((t) =>
        this.prisma.relationalOperationalSimulationScenario.create({
          data: {
            simulationId: sim.id,
            scenarioCode: t.scenarioCode,
            scenarioTitle: t.scenarioTitle,
            scenarioDescription: t.scenarioDescription,
            scenarioOrder: t.scenarioOrder,
            assumptions: t.assumptions as Prisma.InputJsonValue,
            expectedEffects: t.expectedEffects as Prisma.InputJsonValue,
          },
        }),
      ),
    );

    let row = await this.loadSimulation(sim.id);
    await this.publish(row, "relational.operational.simulation_started");

    try {
      const result = await this.executeSimulationEngine(parsed.data.simulationType, input.relationshipId, inputs);
      await this.prisma.relationalOperationalSimulationResult.create({
        data: {
          simulationId: sim.id,
          resultCode: result.resultCode,
          resultTitle: result.resultTitle,
          resultDescription: result.resultDescription,
          calculatedRiskScore: result.calculatedRiskScore,
          projectedSlaImpact: result.projectedSlaImpact,
          projectedOperationalImpact: result.projectedOperationalImpact,
          projectedCorridorState: result.projectedCorridorState,
          recommendations: result.recommendations as Prisma.InputJsonValue,
        },
      });

      const outcome = this.policy.outcomeFromScore(result.calculatedRiskScore);
      await this.prisma.relationalOperationalSimulation.update({
        where: { id: sim.id },
        data: {
          status: "COMPLETED",
          resultingRiskScore: result.calculatedRiskScore,
          outcome,
          completedAt: new Date(),
          simulationDiagnostics: result.diagnostics as Prisma.InputJsonValue,
        },
      });

      row = await this.loadSimulation(sim.id);
      await this.publish(row, "relational.operational.simulation_completed");
      if (outcome === "HIGH_RISK" || outcome === "COLLAPSE_RISK") {
        await this.publish(
          row,
          outcome === "COLLAPSE_RISK"
            ? "relational.operational.simulation_collapse_detected"
            : "relational.operational.simulation_high_risk_detected",
        );
      }
      void this.reviewIngestion.syncForRelationship(input.relationshipId).catch((e) => this.log.warn(String(e)));
    } catch (err) {
      await this.prisma.relationalOperationalSimulation.update({
        where: { id: sim.id },
        data: { status: "FAILED", completedAt: new Date() },
      });
      row = await this.loadSimulation(sim.id);
      await this.publish(row, "relational.operational.simulation_failed");
      throw err;
    }

    return this.actionResponse(row);
  }

  private async executeSimulationEngine(
    type: RelationalOperationalSimulationType,
    relationshipId: string,
    inputs: SimulationCorridorInputs,
  ) {
    switch (type) {
      case "SLA_STRESS_TEST":
        return this.simulateSlaStress(relationshipId, inputs);
      case "CORRIDOR_DEGRADATION":
        return this.simulateCorridorDegradation(relationshipId, inputs);
      case "INCIDENT_ESCALATION":
        return this.simulateIncidentEscalation(relationshipId, inputs);
      case "EXECUTION_SATURATION":
        return this.simulateExecutionSaturation(relationshipId, inputs);
      case "FULFILLMENT_DISRUPTION":
        return this.simulateFulfillmentDisruption(relationshipId, inputs);
      case "COORDINATION_OVERLOAD":
        return this.simulateCoordinationOverload(relationshipId, inputs);
      case "COLLAPSE_PROPAGATION":
        return this.simulateCollapsePropagation(relationshipId, inputs);
      case "GOVERNANCE_BREAKDOWN":
        return this.simulateGovernanceBreakdown(relationshipId, inputs);
      case "PARTNER_FAILURE":
        return this.simulatePartnerFailure(relationshipId, inputs);
      case "MULTI_CORRIDOR_STRESS":
        return this.simulateMultiCorridorStress(relationshipId, inputs);
      default:
        return this.simulateSlaStress(relationshipId, inputs);
    }
  }

  private buildResult(
    relationshipId: string,
    inputs: SimulationCorridorInputs,
    resultCode: string,
    resultTitle: string,
    resultDescription: string,
    extraDiagnostics?: Record<string, unknown>,
  ) {
    const calculatedRiskScore = this.policy.computeRiskScore(inputs);
    const collapse = this.policy.projectCollapsePropagation(inputs);
    return {
      resultCode,
      resultTitle,
      resultDescription,
      calculatedRiskScore,
      projectedSlaImpact: Math.round(calculatedRiskScore * 0.35 * 10) / 10,
      projectedOperationalImpact: Math.round(collapse.operationalFragility * 0.4 * 10) / 10,
      projectedCorridorState: this.policy.projectedCorridorState(inputs.corridorState, calculatedRiskScore),
      recommendations: [
        "Revue humaine recommandée si outcome HIGH_RISK ou COLLAPSE_RISK",
        "Aucune action commerce exécutée par la simulation",
      ],
      diagnostics: { relationshipId, collapse, ...extraDiagnostics },
    };
  }

  async simulateSlaStress(relationshipId: string, inputs: SimulationCorridorInputs) {
    return this.buildResult(
      relationshipId,
      { ...inputs, stressMultiplier: inputs.stressMultiplier * 1.15 },
      "sla_stress_result",
      "Projection stress SLA",
      "Hausse délais projetée sans modification fulfillment réelle.",
      { simulation: "SLA_STRESS_TEST" },
    );
  }

  async simulateCorridorDegradation(relationshipId: string, inputs: SimulationCorridorInputs) {
    return this.buildResult(
      relationshipId,
      inputs,
      "corridor_degrade_result",
      "Projection dégradation corridor",
      "Santé opérationnelle projetée en baisse (lecture seule).",
    );
  }

  async simulateIncidentEscalation(relationshipId: string, inputs: SimulationCorridorInputs) {
    return this.buildResult(
      relationshipId,
      { ...inputs, openIncidents: inputs.openIncidents + 2 },
      "incident_escalation_result",
      "Projection escalade incidents",
      "Charge incidents simulée — pas de création d'incident réel.",
    );
  }

  async simulateExecutionSaturation(relationshipId: string, inputs: SimulationCorridorInputs) {
    const blocked = await this.prisma.order.count({
      where: { relationshipId, relationalOrderExecutionStatus: "BLOCKED" },
    });
    return this.buildResult(
      relationshipId,
      { ...inputs, openAlerts: inputs.openAlerts + blocked },
      "execution_saturation_result",
      "Projection saturation exécution",
      `${blocked} commande(s) bloquée(s) prises en compte dans la projection.`,
    );
  }

  async simulateFulfillmentDisruption(relationshipId: string, inputs: SimulationCorridorInputs) {
    return this.buildResult(
      relationshipId,
      { ...inputs, openTasks: inputs.openTasks + 1 },
      "fulfillment_disruption_result",
      "Projection disruption fulfillment",
      "Stagnation fulfillment simulée analytiquement.",
    );
  }

  async simulateCoordinationOverload(relationshipId: string, inputs: SimulationCorridorInputs) {
    return this.buildResult(
      relationshipId,
      { ...inputs, openTasks: inputs.openTasks + 3 },
      "coordination_overload_result",
      "Projection surcharge coordination",
      "Saturation tâches coordination simulée.",
    );
  }

  async simulateCollapsePropagation(relationshipId: string, inputs: SimulationCorridorInputs) {
    const collapse = this.policy.projectCollapsePropagation(inputs);
    const score = collapse.collapsePropagationRisk;
    return {
      resultCode: "collapse_propagation_result",
      resultTitle: "Propagation collapse simulée",
      resultDescription: `Risque propagation ${score}/100 — fragilité ${collapse.operationalFragility}.`,
      calculatedRiskScore: score,
      projectedSlaImpact: Math.round(score * 0.5 * 10) / 10,
      projectedOperationalImpact: collapse.operationalFragility,
      projectedCorridorState: this.policy.projectedCorridorState(inputs.corridorState, score),
      recommendations: [
        `Probabilité stabilisation: ${collapse.stabilizationProbability}%`,
        `Complexité récupération: ${collapse.recoveryComplexity}`,
      ],
      diagnostics: { collapse, domino: true },
    };
  }

  async simulateGovernanceBreakdown(relationshipId: string, inputs: SimulationCorridorInputs) {
    return this.buildResult(
      relationshipId,
      { ...inputs, corridorState: "BLOCKED" },
      "governance_breakdown_result",
      "Simulation rupture gouvernance",
      "État BLOCKED projeté sans mutation corridor réelle.",
    );
  }

  async simulatePartnerFailure(relationshipId: string, inputs: SimulationCorridorInputs) {
    return this.buildResult(
      relationshipId,
      inputs,
      "partner_failure_result",
      "Projection désalignement partenaire",
      "Réceptions partielles répétées modélisées.",
    );
  }

  async simulateMultiCorridorStress(relationshipId: string, inputs: SimulationCorridorInputs) {
    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      select: { requesterOrganizationId: true, receiverOrganizationId: true },
    });
    const orgs = rel ? [rel.requesterOrganizationId, rel.receiverOrganizationId] : [];
    const related =
      orgs.length > 0
        ? await this.prisma.relationship.count({
            where: {
              id: { not: relationshipId },
              corridorState: { in: ["DEGRADED", "BLOCKED"] },
              OR: [
                { requesterOrganizationId: { in: orgs } },
                { receiverOrganizationId: { in: orgs } },
              ],
            },
          })
        : 0;
    return this.buildResult(
      relationshipId,
      { ...inputs, stressMultiplier: inputs.stressMultiplier * (1 + related * 0.1) },
      "multi_corridor_stress_result",
      "Stress réseau multi-corridor",
      `${related} corridor(s) corrélé(s) en dégradation (lecture agrégée).`,
      { correlatedCorridors: related },
    );
  }

  async cancel(input: { simulationId: string; body: unknown }) {
    const p = RelationalOperationalSimulationCancelRequestSchema.safeParse(input.body ?? {});
    if (!p.success) throw new BadRequestException({ code: "simulation_cancel_invalid" });
    const row = await this.loadSimulation(input.simulationId);
    if (row.status !== "RUNNING" && row.status !== "DRAFT") {
      throw new BadRequestException({ code: "simulation_not_cancellable" });
    }
    await this.prisma.relationalOperationalSimulation.update({
      where: { id: row.id },
      data: {
        status: "CANCELLED",
        completedAt: new Date(),
        simulationMetadata: {
          ...((row.simulationMetadata ?? {}) as object),
          cancelReason: p.data.reason,
        } as Prisma.InputJsonValue,
      },
    });
    const updated = await this.loadSimulation(row.id);
    await this.publish(updated, "relational.operational.simulation_cancelled");
    return this.actionResponse(updated);
  }

  async review(input: { simulationId: string; userId: string; body: unknown }) {
    const p = RelationalOperationalSimulationReviewRequestSchema.safeParse(input.body ?? {});
    if (!p.success) throw new BadRequestException({ code: "simulation_review_invalid" });
    const row = await this.loadSimulation(input.simulationId);
    if (!row.requiresHumanReview) throw new BadRequestException({ code: "simulation_review_not_required" });
    await this.prisma.relationalOperationalSimulation.update({
      where: { id: row.id },
      data: {
        simulationMetadata: {
          ...((row.simulationMetadata ?? {}) as object),
          reviewedByUserId: input.userId,
          reviewNotes: p.data.reviewNotes,
          reviewedAt: new Date().toISOString(),
        } as Prisma.InputJsonValue,
      },
    });
    return this.actionResponse(await this.loadSimulation(row.id));
  }
}
