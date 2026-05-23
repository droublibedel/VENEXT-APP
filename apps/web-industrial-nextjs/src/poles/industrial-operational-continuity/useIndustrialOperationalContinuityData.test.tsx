import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { IndustrialOperationalContinuityWorkspace } from "./IndustrialOperationalContinuityWorkspace";
import {
  INDUSTRIAL_OPERATIONAL_CONTINUITY_BUNDLE_ERROR_FR,
  useIndustrialOperationalContinuityData,
} from "./useIndustrialOperationalContinuityData";
import * as api from "./industrial-operational-continuity-api";

describe("useIndustrialOperationalContinuityData (18.7A bundle-first)", () => {
  it("issues a single bundle fetch on success and exposes product role in workspace", async () => {
    const spy = vi.spyOn(api, "fetchIndustrialOperationalContinuityBundleJson").mockResolvedValue({
      version: "1",
      generatedAt: "2026-01-01T00:00:00.000Z",
      organizationId: "31111111-1111-1111-1111-111111111101",
      policy: "ACTIVE",
      disclaimer: "d",
      snapshot: {
        version: "1",
        generatedAt: "2026-01-01T00:00:00.000Z",
        organizationId: "31111111-1111-1111-1111-111111111101",
        continuitySource: "LIVE_INDUSTRIAL_OPERATIONAL_CONTINUITY_COMPOSE",
        situationRoomDigest: {
          bundleGeneratedAt: "2026-01-01T00:00:00.000Z",
          situationCellCount: 0,
          criticalDependencyCount: 0,
          missionCount: 0,
          globalStressProxy: 0,
          executivePosture: "UNKNOWN",
        },
        economicCommandDigest: { headline: "h", pressureZoneCount: 0, globalStress: 0 },
      },
      stabilityStates: [],
      continuityPressures: [],
      continuityCorridors: [],
      cadenceSignals: [],
      briefings: { executiveLines: [], operationalLines: [], stabilizationLines: [] },
      diagnostics: {
        heuristicOnly: true,
        advisoryOnly: true,
        symbolicProjection: true,
        nonOperationalExecution: true,
        proxySignals: true,
        deterministicReadout: true,
        productRole: "CONTINUITY_LENS_ABOVE_SITUATION_ROOM",
        relationToSituationRoom: "Uses Situation Room outputs to summarize continuity, cadence, corridors and operational stability. It does not replace ISR.",
        sourceMode: "LIVE_INDUSTRIAL_OPERATIONAL_CONTINUITY_COMPOSE",
        projectionMode: "summary",
        payloadWeightClass: "compact",
        composeCacheHit: false,
        inFlightReuse: false,
        cacheStrategy: "SHORT_TTL_CONTINUITY_CACHE_WITH_SINGLE_FLIGHT",
        composeCount: 2,
        continuityComposePlan: {
          situationRoomMaterialization: 1,
          continuitySynthesis: 1,
          propagationCompose: 0,
          coordinationCompose: 0,
          scenariosCompose: 0,
          memoryCompose: 0,
          dataIntelligenceCompose: 0,
          commandCompose: 0,
          situationRoomSynthesis: 0,
        },
        continuityComposeMeaning: "logical_pipeline_steps_not_cpu_cost",
        costDisclosure: "c",
        reusedBundles: [],
        sourceBundlesEmbedded: false,
        degradedMode: false,
        continuitySource: "LIVE_INDUSTRIAL_OPERATIONAL_CONTINUITY_COMPOSE",
        upstreamPropagationColdStarts: 0,
      },
    } as never);

    function Probe() {
      const { bundle, loading, error } = useIndustrialOperationalContinuityData({
        organizationId: "31111111-1111-1111-1111-111111111101",
        source: "explicit_env",
      });
      return <IndustrialOperationalContinuityWorkspace bundle={bundle} loading={loading} error={error} />;
    }

    render(<Probe />);
    await waitFor(() => expect(screen.queryByTestId("ioc-diagnostics-product-role")).toBeTruthy());
    expect(spy).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("ioc-continuity-lens-positioning").textContent).toContain(
      "Vue continuité — synthèse dérivée de la Situation Room, non source opérationnelle primaire.",
    );
    expect(screen.getByTestId("ioc-diagnostics-product-role")!.textContent).toContain("CONTINUITY_LENS_ABOVE_SITUATION_ROOM");
    spy.mockRestore();
  });

  it("shows degraded-unavailable copy on bundle failure without slice calls", async () => {
    const spy = vi.spyOn(api, "fetchIndustrialOperationalContinuityBundleJson").mockResolvedValue(null);

    function Probe() {
      const { bundle, loading, error } = useIndustrialOperationalContinuityData({
        organizationId: "31111111-1111-1111-1111-111111111101",
        source: "explicit_env",
      });
      return <IndustrialOperationalContinuityWorkspace bundle={bundle} loading={loading} error={error} />;
    }

    render(<Probe />);
    await waitFor(() => expect(screen.queryByTestId("ioc-degraded-unavailable")).toBeTruthy());
    expect(spy).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("ioc-degraded-unavailable").textContent).toContain(INDUSTRIAL_OPERATIONAL_CONTINUITY_BUNDLE_ERROR_FR);
    spy.mockRestore();
  });
});
