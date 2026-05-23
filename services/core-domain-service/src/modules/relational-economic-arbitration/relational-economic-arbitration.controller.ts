/**
 * Instruction 20.31 — REST API for relational economic arbitration (non-autopilot).
 */
import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import type {
  RelationalEconomicArbitrationCase,
  RelationalEconomicArbitrationDecision,
  RelationalEconomicArbitrationScenario,
} from "@prisma/client";
import {
  RelationalEconomicArbitrationActionResponseSchema,
  RelationalEconomicArbitrationCaseSchema,
  RelationalEconomicArbitrationSnapshotSchema,
} from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { VenextAuthzGuard } from "../../platform-authz/venext-authz.guard";
import { VenextAuthz } from "../../platform-authz/venext-authz.decorators";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import { RelationalEconomicArbitrationConflictService } from "./relational-economic-arbitration-conflict.service";
import { RelationalEconomicArbitrationCorridorContextService } from "./relational-economic-arbitration-corridor-context.service";
import { RelationalEconomicArbitrationDecisionService } from "./relational-economic-arbitration-decision.service";
import { RelationalEconomicArbitrationGuard } from "./relational-economic-arbitration.guard";
import { RelationalEconomicArbitrationIngestionService } from "./relational-economic-arbitration-ingestion.service";
import { RelationalEconomicArbitrationPolicyService } from "./relational-economic-arbitration-policy.service";
import { RelationalEconomicArbitrationScenarioService } from "./relational-economic-arbitration-scenario.service";

@Controller("relational-economic-arbitration")
@UseGuards(VenextAuthzGuard, RelationalEconomicArbitrationGuard)
export class RelationalEconomicArbitrationController {
  constructor(
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly prisma: PrismaService,
    private readonly governance: RelationshipGovernancePolicyService,
    private readonly policy: RelationalEconomicArbitrationPolicyService,
    private readonly corridorContext: RelationalEconomicArbitrationCorridorContextService,
    private readonly conflictSvc: RelationalEconomicArbitrationConflictService,
    private readonly scenarioSvc: RelationalEconomicArbitrationScenarioService,
    private readonly decisionSvc: RelationalEconomicArbitrationDecisionService,
    private readonly ingestion: RelationalEconomicArbitrationIngestionService,
  ) {}

  private async assertFlag(organizationId: string): Promise<void> {
    if (!(await this.flags.isEnabled("relational_economic_arbitration_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "relational_economic_arbitration_disabled" });
    }
  }

  private async assertOrgOnRelationship(organizationId: string, relationshipId: string): Promise<void> {
    const rel = await this.prisma.relationship.findFirst({
      where: {
        id: relationshipId,
        OR: [{ requesterOrganizationId: organizationId }, { receiverOrganizationId: organizationId }],
      },
      select: { id: true },
    });
    if (!rel) throw new NotFoundException({ code: "relational_economic_arbitration_relationship_not_found" });
  }

  private caseWire(c: RelationalEconomicArbitrationCase) {
    return {
      id: c.id,
      relationshipId: c.relationshipId,
      caseCode: c.caseCode,
      arbitrationType: c.arbitrationType,
      arbitrationPriority: c.arbitrationPriority,
      arbitrationStatus: c.arbitrationStatus,
      severity: c.severity,
      arbitrationScore: c.arbitrationScore,
      conflictSeverity: c.conflictSeverity,
      systemicImpact: c.systemicImpact,
      dependencyPressure: c.dependencyPressure,
      continuityPressure: c.continuityPressure,
      sovereigntyPressure: c.sovereigntyPressure,
      propagationPressure: c.propagationPressure,
      coordinationPressure: c.coordinationPressure,
      resolutionComplexity: c.resolutionComplexity,
      resolutionProbability: c.resolutionProbability,
      interventionUrgency: c.interventionUrgency,
      territoryCountry: c.territoryCountry,
      territoryCity: c.territoryCity,
      sectorSlug: c.sectorSlug,
      active: c.active,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  private scenarioWire(s: RelationalEconomicArbitrationScenario) {
    return {
      id: s.id,
      scenarioCode: s.scenarioCode,
      scenarioType: s.scenarioType,
      priority: s.priority,
      estimatedImpact: s.estimatedImpact,
      estimatedRisk: s.estimatedRisk,
      estimatedRecoveryGain: s.estimatedRecoveryGain,
      dependencyImpact: s.dependencyImpact,
      propagationImpact: s.propagationImpact,
      continuityImpact: s.continuityImpact,
      sovereigntyImpact: s.sovereigntyImpact,
      confidenceLevel: s.confidenceLevel as "LOW" | "MEDIUM" | "HIGH",
      createdAt: s.createdAt.toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  private decisionWire(d: RelationalEconomicArbitrationDecision) {
    return {
      id: d.id,
      decisionCode: d.decisionCode,
      decisionType: d.decisionType,
      arbitrationReason: d.arbitrationReason,
      expectedRecoveryGain: d.expectedRecoveryGain,
      expectedStabilityGain: d.expectedStabilityGain,
      validationRequired: d.validationRequired,
      dualValidationRequired: d.dualValidationRequired,
      selectedScenarioId: d.selectedScenarioId,
      createdAt: d.createdAt.toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("arbitration-overview/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async arbitrationOverview(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const arbitrationCase = await this.prisma.relationalEconomicArbitrationCase.findFirst({
      where: { relationshipId, active: true },
      orderBy: { createdAt: "desc" },
    });
    if (!arbitrationCase) {
      const ctx = await this.corridorContext.load(relationshipId);
      const candidates = this.conflictSvc.detectArbitrationCandidates(ctx);
      const candidate = candidates[0]!;
      const caseCode = `ARB_CASE:${relationshipId}:preview`;
      const scenarios = this.scenarioSvc.generateScenarios(relationshipId, caseCode, candidate, ctx);
      const raw = {
        relationshipId,
        case: {
          id: "00000000-0000-4000-8000-000000000000",
          relationshipId,
          caseCode,
          ...candidate,
          territoryCountry: ctx.territoryCountry,
          territoryCity: ctx.territoryCity,
          sectorSlug: ctx.sectorSlug,
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          paymentExecutionDisabled: true as const,
          publicTrackingDisabled: true as const,
        },
        scenarios: scenarios.map((s, i) => ({
          id: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
          ...s,
          createdAt: new Date().toISOString(),
          paymentExecutionDisabled: true as const,
          publicTrackingDisabled: true as const,
        })),
        decisions: [],
        overviewDiagnostics: {
          heuristicFallbackUsed: ctx.heuristicFallbackUsed,
          fallbackReasons: ctx.fallbackReasons,
          governanceConflictsUsed: ctx.governanceConflictCount,
          scenarioCount: scenarios.length,
          dualValidationRequired: scenarios.some((s) =>
            this.policy.requiresDualValidation(s.scenarioType),
          ),
        },
        computedAt: new Date().toISOString(),
        paymentExecutionDisabled: true as const,
        publicTrackingDisabled: true as const,
      };
      const p = RelationalEconomicArbitrationCaseSchema.safeParse(raw);
      if (!p.success) throw new BadRequestException({ code: "relational_economic_arbitration_overview_invalid" });
      return p.data;
    }
    const [scenarios, decisions] = await Promise.all([
      this.prisma.relationalEconomicArbitrationScenario.findMany({
        where: { arbitrationCaseId: arbitrationCase.id },
      }),
      this.prisma.relationalEconomicArbitrationDecision.findMany({
        where: { arbitrationCaseId: arbitrationCase.id },
      }),
    ]);
    const raw = {
      relationshipId,
      case: this.caseWire(arbitrationCase),
      scenarios: scenarios.map((s) => this.scenarioWire(s)),
      decisions: decisions.map((d) => this.decisionWire(d)),
      overviewDiagnostics: {
        heuristicFallbackUsed: false,
        fallbackReasons: [],
        governanceConflictsUsed: await this.prisma.relationalEconomicGovernanceConflict.count({
          where: { relationshipId },
        }),
        scenarioCount: scenarios.length,
        dualValidationRequired: scenarios.some((s) => this.policy.requiresDualValidation(s.scenarioType)),
      },
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalEconomicArbitrationCaseSchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_economic_arbitration_overview_invalid" });
    return p.data;
  }

  @Get("arbitration-conflicts/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async arbitrationConflicts(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const ctx = await this.corridorContext.load(relationshipId);
    const candidates = this.conflictSvc.detectArbitrationCandidates(ctx);
    return {
      relationshipId,
      conflicts: candidates.map((c) => ({
        governanceConflictId: c.governanceConflictId,
        conflictType: c.conflictType,
        arbitrationScore: c.arbitrationScore,
        systemicImpact: c.systemicImpact,
        interventionUrgency: c.interventionUrgency,
        paymentExecutionDisabled: true as const,
        publicTrackingDisabled: true as const,
      })),
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("arbitration-scenarios/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async arbitrationScenarios(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const scenarios = await this.prisma.relationalEconomicArbitrationScenario.findMany({
      where: { relationshipId },
      orderBy: { createdAt: "desc" },
      take: 120,
    });
    return {
      relationshipId,
      scenarios: scenarios.map((s) => this.scenarioWire(s)),
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("arbitration-priorities")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async arbitrationPriorities(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const cases = await this.prisma.relationalEconomicArbitrationCase.findMany({
      where: {
        active: true,
        relationship: {
          OR: [{ requesterOrganizationId: organizationId }, { receiverOrganizationId: organizationId }],
        },
      },
      orderBy: [{ interventionUrgency: "desc" }, { systemicImpact: "desc" }],
      take: 48,
    });
    return {
      organizationId,
      priorities: cases.map((c) => ({
        relationshipId: c.relationshipId,
        caseId: c.id,
        caseCode: c.caseCode,
        arbitrationScore: c.arbitrationScore,
        interventionUrgency: c.interventionUrgency,
        systemicImpact: c.systemicImpact,
        paymentExecutionDisabled: true as const,
        publicTrackingDisabled: true as const,
      })),
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("arbitration-history/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async arbitrationHistory(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const snaps = await this.prisma.relationalEconomicArbitrationSnapshot.findMany({
      where: { relationshipId },
      orderBy: { createdAt: "desc" },
      take: 48,
    });
    const parsed = snaps.map((s) =>
      RelationalEconomicArbitrationSnapshotSchema.parse({
        id: s.id,
        relationshipId: s.relationshipId,
        snapshotCode: s.snapshotCode,
        arbitrationStatus: s.arbitrationStatus,
        arbitrationScore: s.arbitrationScore,
        systemicImpact: s.systemicImpact,
        createdAt: s.createdAt.toISOString(),
        paymentExecutionDisabled: true as const,
        publicTrackingDisabled: true as const,
      }),
    );
    return {
      relationshipId,
      snapshots: parsed,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Get("arbitration-critical-corridors")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async arbitrationCriticalCorridors(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const critical = await this.prisma.relationalEconomicArbitrationCase.findMany({
      where: {
        active: true,
        systemicImpact: { gte: 55 },
        relationship: {
          OR: [{ requesterOrganizationId: organizationId }, { receiverOrganizationId: organizationId }],
        },
      },
      orderBy: [{ systemicImpact: "desc" }, { interventionUrgency: "desc" }],
      take: 24,
    });
    return {
      organizationId,
      criticalCorridors: critical.map((c) => ({
        relationshipId: c.relationshipId,
        caseId: c.id,
        caseCode: c.caseCode,
        score: c.systemicImpact,
        paymentExecutionDisabled: true as const,
        publicTrackingDisabled: true as const,
      })),
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  @Post("arbitration-decisions/:id/validate")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async validateDecision(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    const decision = await this.prisma.relationalEconomicArbitrationDecision.findUnique({
      where: { id },
      include: { arbitrationCase: { include: { relationship: { select: { id: true, corridorState: true } } } } },
    });
    if (!decision) throw new NotFoundException({ code: "relational_economic_arbitration_decision_not_found" });
    await this.assertOrgOnRelationship(organizationId, decision.relationshipId);
    await this.governance.assertCorridorOperational(decision.relationshipId, "operational_observation");
    const gate = this.policy.assertEconomicArbitrationMutationAllowed(
      decision.arbitrationCase.relationship.corridorState,
    );
    if (!gate.allowed) {
      throw new ForbiddenException({
        code: "relational_economic_arbitration_corridor_readonly",
        detail: gate.diagnostics,
      });
    }
    await this.decisionSvc.validateDecision(id, organizationId);
    const raw = {
      ok: true as const,
      code: "relational_economic_arbitration_decision_validated",
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalEconomicArbitrationActionResponseSchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_economic_arbitration_action_invalid" });
    return p.data;
  }

  @Post("arbitration-decisions/:id/reject")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async rejectDecision(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("organizationId") organizationId: string,
    @Body() body: { reason?: string },
  ) {
    await this.assertFlag(organizationId);
    const decision = await this.prisma.relationalEconomicArbitrationDecision.findUnique({
      where: { id },
      include: { arbitrationCase: { include: { relationship: { select: { id: true, corridorState: true } } } } },
    });
    if (!decision) throw new NotFoundException({ code: "relational_economic_arbitration_decision_not_found" });
    await this.assertOrgOnRelationship(organizationId, decision.relationshipId);
    await this.governance.assertCorridorOperational(decision.relationshipId, "operational_observation");
    const gate = this.policy.assertEconomicArbitrationMutationAllowed(
      decision.arbitrationCase.relationship.corridorState,
    );
    if (!gate.allowed) {
      throw new ForbiddenException({
        code: "relational_economic_arbitration_corridor_readonly",
        detail: gate.diagnostics,
      });
    }
    await this.decisionSvc.rejectDecision(
      id,
      organizationId,
      body?.reason ?? "Rejected by corridor operator — analytical arbitration only.",
    );
    const raw = {
      ok: true as const,
      code: "relational_economic_arbitration_decision_rejected",
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalEconomicArbitrationActionResponseSchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_economic_arbitration_action_invalid" });
    return p.data;
  }

  @Post("archive-arbitration-snapshot/:id")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async archiveArbitrationSnapshot(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    const snap = await this.prisma.relationalEconomicArbitrationSnapshot.findUnique({
      where: { id },
      include: { relationship: { select: { corridorState: true, id: true } } },
    });
    if (!snap) throw new NotFoundException({ code: "relational_economic_arbitration_snapshot_not_found" });
    await this.assertOrgOnRelationship(organizationId, snap.relationshipId);
    await this.governance.assertCorridorOperational(snap.relationshipId, "operational_observation");
    const gate = this.policy.assertEconomicArbitrationMutationAllowed(snap.relationship.corridorState);
    if (!gate.allowed) {
      throw new ForbiddenException({
        code: "relational_economic_arbitration_corridor_readonly",
        detail: gate.diagnostics,
      });
    }
    await this.ingestion.archiveArbitrationSnapshot(id, organizationId);
    const raw = {
      ok: true as const,
      code: "relational_economic_arbitration_snapshot_archived",
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = RelationalEconomicArbitrationActionResponseSchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_economic_arbitration_action_invalid" });
    return p.data;
  }
}
