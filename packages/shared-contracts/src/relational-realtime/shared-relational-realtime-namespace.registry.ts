/**
 * Instruction 20.44 — central registry of relational realtime namespaces (level 5 freeze).
 * Validation order in gateway follows `gatewayValidationOrder` (higher layers first).
 */

export type RelationalRealtimeNamespaceEntry = {
  instruction: string;
  layerSlug: string;
  namespacePrefix: string;
  gatewayValidationOrder: number;
  featureFlagEnabled: string;
  featureFlagRealtime: string;
};

/** Level 5 analytical stack 20.28 → 20.43 (terminal). */
export const RELATIONAL_LEVEL_5_REALTIME_NAMESPACES: readonly RelationalRealtimeNamespaceEntry[] = [
  {
    instruction: "20.43",
    layerSlug: "relational-macro-observatory-governance",
    namespacePrefix: "relational.macro_observatory_governance.",
    gatewayValidationOrder: 1,
    featureFlagEnabled: "relational_macro_observatory_governance_enabled",
    featureFlagRealtime: "relational_macro_observatory_governance_realtime_enabled",
  },
  {
    instruction: "20.42",
    layerSlug: "relational-strategic-observatory",
    namespacePrefix: "relational.strategic_observatory.",
    gatewayValidationOrder: 2,
    featureFlagEnabled: "relational_strategic_observatory_enabled",
    featureFlagRealtime: "relational_strategic_observatory_realtime_enabled",
  },
  {
    instruction: "20.41",
    layerSlug: "relational-global-executive-supervision",
    namespacePrefix: "relational.global_executive_supervision.",
    gatewayValidationOrder: 3,
    featureFlagEnabled: "relational_global_executive_supervision_enabled",
    featureFlagRealtime: "relational_global_executive_supervision_realtime_enabled",
  },
  {
    instruction: "20.40",
    layerSlug: "relational-executive-strategic-synthesis",
    namespacePrefix: "relational.executive_strategic_synthesis.",
    gatewayValidationOrder: 4,
    featureFlagEnabled: "relational_executive_strategic_synthesis_enabled",
    featureFlagRealtime: "relational_executive_strategic_synthesis_realtime_enabled",
  },
  {
    instruction: "20.39",
    layerSlug: "relational-executive-control-room",
    namespacePrefix: "relational.executive_control_room.",
    gatewayValidationOrder: 5,
    featureFlagEnabled: "relational_executive_control_room_enabled",
    featureFlagRealtime: "relational_executive_control_room_realtime_enabled",
  },
  {
    instruction: "20.38",
    layerSlug: "relational-executive-operations",
    namespacePrefix: "relational.executive_operations.",
    gatewayValidationOrder: 6,
    featureFlagEnabled: "relational_executive_operations_enabled",
    featureFlagRealtime: "relational_executive_operations_realtime_enabled",
  },
  {
    instruction: "20.37",
    layerSlug: "relational-strategic-command",
    namespacePrefix: "relational.strategic_command.",
    gatewayValidationOrder: 7,
    featureFlagEnabled: "relational_strategic_command_enabled",
    featureFlagRealtime: "relational_strategic_command_realtime_enabled",
  },
  {
    instruction: "20.36",
    layerSlug: "relational-strategic-intelligence",
    namespacePrefix: "relational.strategic_intelligence.",
    gatewayValidationOrder: 8,
    featureFlagEnabled: "relational_strategic_intelligence_enabled",
    featureFlagRealtime: "relational_strategic_intelligence_realtime_enabled",
  },
  {
    instruction: "20.35",
    layerSlug: "relational-institutional-reporting",
    namespacePrefix: "relational.institutional_reporting.",
    gatewayValidationOrder: 9,
    featureFlagEnabled: "relational_institutional_reporting_enabled",
    featureFlagRealtime: "relational_institutional_reporting_realtime_enabled",
  },
  {
    instruction: "20.34",
    layerSlug: "relational-executive-orchestration",
    namespacePrefix: "relational.executive_orchestration.",
    gatewayValidationOrder: 10,
    featureFlagEnabled: "relational_executive_orchestration_enabled",
    featureFlagRealtime: "relational_executive_orchestration_realtime_enabled",
  },
  {
    instruction: "20.33",
    layerSlug: "relational-economic-monitoring",
    namespacePrefix: "relational.monitoring.",
    gatewayValidationOrder: 11,
    featureFlagEnabled: "relational_economic_monitoring_enabled",
    featureFlagRealtime: "relational_economic_monitoring_realtime_enabled",
  },
  {
    instruction: "20.32",
    layerSlug: "relational-economic-stabilization",
    namespacePrefix: "relational.stabilization.",
    gatewayValidationOrder: 12,
    featureFlagEnabled: "relational_economic_stabilization_enabled",
    featureFlagRealtime: "relational_economic_stabilization_realtime_enabled",
  },
  {
    instruction: "20.31",
    layerSlug: "relational-economic-arbitration",
    namespacePrefix: "relational.arbitration.",
    gatewayValidationOrder: 13,
    featureFlagEnabled: "relational_economic_arbitration_enabled",
    featureFlagRealtime: "relational_economic_arbitration_realtime_enabled",
  },
  {
    instruction: "20.30",
    layerSlug: "relational-economic-governance",
    namespacePrefix: "relational.governance.",
    gatewayValidationOrder: 14,
    featureFlagEnabled: "relational_economic_governance_enabled",
    featureFlagRealtime: "relational_economic_governance_realtime_enabled",
  },
  {
    instruction: "20.29",
    layerSlug: "relational-economic-recovery",
    namespacePrefix: "relational.recovery.",
    gatewayValidationOrder: 15,
    featureFlagEnabled: "relational_economic_recovery_enabled",
    featureFlagRealtime: "relational_economic_recovery_realtime_enabled",
  },
  {
    instruction: "20.28",
    layerSlug: "relational-economic-sovereignty",
    namespacePrefix: "relational.sovereignty.",
    gatewayValidationOrder: 16,
    featureFlagEnabled: "relational_economic_sovereignty_enabled",
    featureFlagRealtime: "relational_economic_sovereignty_realtime_enabled",
  },
] as const;

export const ALL_RELATIONAL_REALTIME_NAMESPACE_PREFIXES: readonly string[] =
  RELATIONAL_LEVEL_5_REALTIME_NAMESPACES.map((e) => e.namespacePrefix);

export function findRelationalRealtimeNamespaceByEventType(
  eventType: string,
): RelationalRealtimeNamespaceEntry | undefined {
  return RELATIONAL_LEVEL_5_REALTIME_NAMESPACES.find((e) => eventType.startsWith(e.namespacePrefix));
}

export function assertNoRealtimeNamespaceCollision(): void {
  const prefixes = ALL_RELATIONAL_REALTIME_NAMESPACE_PREFIXES;
  for (let i = 0; i < prefixes.length; i++) {
    for (let j = i + 1; j < prefixes.length; j++) {
      const a = prefixes[i]!;
      const b = prefixes[j]!;
      if (a.startsWith(b) || b.startsWith(a)) {
        throw new Error(`relational realtime namespace collision: ${a} vs ${b}`);
      }
    }
  }
}
