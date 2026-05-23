import { Injectable, Logger } from "@nestjs/common";
import type { EconomicPropagationBundle } from "@venext/shared-contracts";
import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import { CrisisSignatureService } from "./crisis-signature.service";
import { EconomicMemoryRealtimePublishService } from "./economic-memory-realtime-publish.service";
import { TemporalEconomicAnalysisService } from "./temporal-economic-analysis.service";

@Injectable()
export class EconomicMemoryStorageService {
  private readonly log = new Logger(EconomicMemoryStorageService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly crisis: CrisisSignatureService,
    private readonly temporal: TemporalEconomicAnalysisService,
    private readonly realtime: EconomicMemoryRealtimePublishService,
  ) {}

  /**
   * Instruction 18.2 — fire-and-forget persistence from propagation bundle (never block HTTP).
   */
  persistPropagationSnapshot(bundle: EconomicPropagationBundle): void {
    void this.runPersist(bundle);
  }

  private async runPersist(bundle: EconomicPropagationBundle): Promise<void> {
    if (!(await this.flags.isEnabled("economic_memory_enabled", { organizationId: bundle.organizationId }))) return;
    const org = bundle.organizationId;

    const wave1: Promise<unknown>[] = [
      this.persistShocks(bundle),
      this.persistChains(bundle),
      this.persistTerritoryRows(bundle),
      this.persistSimulation(bundle),
    ];
    const r1 = await Promise.allSettled(wave1);
    for (const r of r1) {
      if (r.status === "rejected") this.log.warn(`economic_memory persist wave1: ${String(r.reason)}`);
    }

    const wave2: Promise<unknown>[] = [];
    if (await this.flags.isEnabled("crisis_signature_enabled", { organizationId: org })) {
      wave2.push(this.crisis.persistFromBundle(bundle));
    }
    if (await this.flags.isEnabled("temporal_analysis_enabled", { organizationId: org })) {
      wave2.push(this.temporal.persistFromBundle(bundle));
    }
    const r2 = await Promise.allSettled(wave2);
    for (const r of r2) {
      if (r.status === "rejected") this.log.warn(`economic_memory persist wave2: ${String(r.reason)}`);
    }

    void this.realtime.publishMemoryPulse(org, bundle);
  }

  private async persistShocks(bundle: EconomicPropagationBundle): Promise<void> {
    for (const s of bundle.shocks) {
      await this.prisma.economicEventMemory.create({
        data: {
          organizationId: bundle.organizationId,
          territory: s.affectedTerritories[0] ?? null,
          pole: s.sourcePole,
          eventType: `propagation_shock.${s.type}`,
          severity: s.severity,
          confidence: s.confidence,
          sourceSignals: s.sourceSignals,
          propagationDepth: null,
          affectedPoles: s.affectedPoles,
          affectedTerritories: s.affectedTerritories,
          metadata: {
            shockId: s.id,
            deduplicationKey: s.deduplicationKey ?? null,
            bundleGeneratedAt: bundle.generatedAt,
            provenance: "economic_propagation_engine.compose",
          },
        },
      });
    }
  }

  private async persistChains(bundle: EconomicPropagationBundle): Promise<void> {
    for (const ch of bundle.chains) {
      const path = ch.impacts.map((i) => ({
        targetPole: i.targetPole,
        impactType: i.impactType,
        intensity: i.intensity,
      }));
      const durationEstimate = ch.impacts.reduce((m, i) => Math.max(m, i.estimatedDelayMinutes), 0);
      await this.prisma.economicPropagationMemory.create({
        data: {
          organizationId: bundle.organizationId,
          territory: ch.shock.affectedTerritories[0] ?? null,
          pole: ch.shock.sourcePole,
          rootShockType: ch.shock.type,
          chainId: ch.chainId,
          impactPath: path,
          durationEstimate,
          stabilized: bundle.overview.systemicRiskRollup < 0.35,
          severity: ch.shock.severity,
          confidence: ch.shock.confidence,
          sourceSignals: ch.shock.sourceSignals,
          propagationDepth: ch.propagationDepth,
          affectedPoles: [...new Set(ch.impacts.map((i) => i.targetPole))],
          affectedTerritories: ch.shock.affectedTerritories,
          metadata: {
            systemicRiskScore: ch.systemicRiskScore,
            provenance: "economic_propagation_engine.compose",
            bundleGeneratedAt: bundle.generatedAt,
          },
        },
      });
    }
  }

  private async persistTerritoryRows(bundle: EconomicPropagationBundle): Promise<void> {
    for (const row of bundle.territoryFragility.slice(0, 8)) {
      await this.prisma.economicEventMemory.create({
        data: {
          organizationId: bundle.organizationId,
          territory: row.territory,
          pole: "territory_supervision",
          eventType: "economic_memory.territory_fragility",
          severity: row.fragilityScore > 0.55 ? "HIGH" : "MODERATE",
          confidence: Number(Math.min(1, 0.45 + row.localTerritoryEvidence).toFixed(3)),
          sourceSignals: row.localEvidenceSignals,
          propagationDepth: null,
          affectedPoles: ["data_intelligence", "finance_collections", "supply_logistics"],
          affectedTerritories: [row.territory],
          metadata: {
            fragilityScore: row.fragilityScore,
            globalSystemicPressure: row.globalSystemicPressure,
            localTerritoryEvidence: row.localTerritoryEvidence,
            provenance: "economic_propagation_engine.compose",
            bundleGeneratedAt: bundle.generatedAt,
          },
        },
      });
    }
  }

  private async persistSimulation(bundle: EconomicPropagationBundle): Promise<void> {
    const sim = bundle.simulationPreview;
    await this.prisma.economicEventMemory.create({
      data: {
        organizationId: bundle.organizationId,
        territory: sim.affectedTerritories[0] ?? null,
        pole: "propagation_simulation",
        eventType: "economic_memory.simulation_preview",
        severity: "MODERATE",
        confidence: 0.5,
        sourceSignals: [`simulation.trigger:${sim.triggerType}`, `simulation.id:${sim.simulationId}`],
        propagationDepth: sim.affectedPoles.length,
        affectedPoles: sim.affectedPoles,
        affectedTerritories: sim.affectedTerritories,
        metadata: {
          systemicRiskScore: sim.systemicRiskScore,
          synthetic: true,
          provenance: "economic_propagation_engine.compose",
          bundleGeneratedAt: bundle.generatedAt,
        },
      },
    });
  }
}
