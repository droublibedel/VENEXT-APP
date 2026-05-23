/**
 * Instruction 20.44 — level 5 consolidation integrity tests.
 */
import { describe, expect, it } from "vitest";

import {
  assertNoRealtimeNamespaceCollision,
  RELATIONAL_LEVEL_5_REALTIME_NAMESPACES,
} from "@venext/shared-contracts";
import { RelationalLayerRegistryService } from "./relational-layer-registry.service";
import {
  assertRelationalStrategicReadonlyPayload,
  RELATIONAL_STRATEGIC_READONLY_BOUNDARY,
} from "./relational-strategic-readonly.policy";

describe("RelationalLayerRegistryService", () => {
  const registry = new RelationalLayerRegistryService();

  it("has 16 level-5 layers in order", () => {
    const layers = registry.getLevel5Layers();
    expect(layers).toHaveLength(16);
    expect(layers[0]!.instruction).toBe("20.28");
    expect(layers[15]!.instruction).toBe("20.43");
    expect(layers[15]!.terminal).toBe(true);
  });

  it("assertRegistryIntegrity passes for ingestion chain", () => {
    expect(() => registry.assertRegistryIntegrity()).not.toThrow();
  });

  it("ingestion ordering is monotonic", () => {
    const chain = registry.getIngestionChainOrder();
    expect(chain[0]).toBe("syncEconomicSovereigntyState");
    expect(chain[chain.length - 1]).toBe("syncMacroObservatoryGovernanceState");
  });
});

describe("shared relational realtime namespace registry", () => {
  it("has no prefix collisions among level 5 namespaces", () => {
    expect(() => assertNoRealtimeNamespaceCollision()).not.toThrow();
  });

  it("lists 16 namespaces for 20.28-20.43", () => {
    expect(RELATIONAL_LEVEL_5_REALTIME_NAMESPACES).toHaveLength(16);
  });

  it("gateway order places macro_observatory_governance before strategic_observatory", () => {
    const macro = RELATIONAL_LEVEL_5_REALTIME_NAMESPACES.find(
      (e) => e.namespacePrefix === "relational.macro_observatory_governance.",
    );
    const strat = RELATIONAL_LEVEL_5_REALTIME_NAMESPACES.find(
      (e) => e.namespacePrefix === "relational.strategic_observatory.",
    );
    expect(macro!.gatewayValidationOrder).toBeLessThan(strat!.gatewayValidationOrder);
  });
});

describe("relational strategic readonly boundary", () => {
  it("enforces payment and tracking disabled on payloads", () => {
    expect(RELATIONAL_STRATEGIC_READONLY_BOUNDARY.paymentExecutionDisabled).toBe(true);
    expect(RELATIONAL_STRATEGIC_READONLY_BOUNDARY.publicTrackingDisabled).toBe(true);
    const bad = assertRelationalStrategicReadonlyPayload({
      paymentExecutionDisabled: false,
      publicTrackingDisabled: true,
    });
    expect(bad.ok).toBe(false);
    const good = assertRelationalStrategicReadonlyPayload({
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    expect(good.ok).toBe(true);
  });

  it("rejects forbidden capability fields", () => {
    const r = assertRelationalStrategicReadonlyPayload({ wallet: true });
    expect(r.ok).toBe(false);
  });
});
