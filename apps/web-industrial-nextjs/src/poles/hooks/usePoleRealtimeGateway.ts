"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { OperationalSignalItem } from "../types";
import { SignalBatcher } from "../performance/signal-batcher";

type Options = {
  poleChannel: string;
  enabled: boolean;
  wsUrl?: string;
  /** Instruction 15A — forwarded on subscribe when gateway strict auth is enabled */
  subscribeOrganizationId?: string;
  subscribeToken?: string;
};

export function usePoleRealtimeGateway({
  poleChannel,
  enabled,
  wsUrl,
  subscribeOrganizationId,
  subscribeToken,
}: Options) {
  const [connected, setConnected] = useState(false);
  const [demoMode, setDemoMode] = useState(true);
  const [liveChannel, setLiveChannel] = useState<string | undefined>(undefined);
  const [stream, setStream] = useState<OperationalSignalItem[]>([]);
  const batcher = useMemo(
    () =>
      new SignalBatcher((items) => {
        setStream((prev) => [...items, ...prev].slice(0, 80));
      }),
    [],
  );
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const url =
      wsUrl ??
      process.env.NEXT_PUBLIC_VENEXT_REALTIME_WS ??
      "ws://127.0.0.1:3000/realtime";
    const ws = new WebSocket(url);
    wsRef.current = ws;
    ws.onopen = () => {
      setConnected(true);
      ws.send(
        JSON.stringify({
          type: "subscribe",
          poles: [poleChannel],
          organizationId: subscribeOrganizationId,
          ...(subscribeToken && subscribeOrganizationId
            ? { auth: { organizationId: subscribeOrganizationId, token: subscribeToken } }
            : {}),
        }),
      );
    };
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(String(ev.data)) as {
          type?: string;
          channel?: string;
          mode?: string;
          items?: OperationalSignalItem[];
        };
        if (msg.type === "session.open") {
          const ch = typeof msg.channel === "string" ? msg.channel : "";
          setLiveChannel(ch);
          setDemoMode(msg.mode === "demo" || ch.startsWith("demo."));
          return;
        }
        if (msg.type === "live.economic.signal" && Array.isArray(msg.items)) {
          setDemoMode(false);
          for (const it of msg.items) batcher.push(it);
          return;
        }
        const mType = typeof msg.type === "string" ? msg.type : "";
        if (
          (mType.startsWith("demo.commercial.") || mType.startsWith("live.commercial.")) &&
          Array.isArray(msg.items)
        ) {
          setDemoMode(mType.startsWith("demo."));
          for (const it of msg.items) {
            batcher.push({ ...it, commercialEnvelope: mType });
          }
          return;
        }
        if (
          (mType.startsWith("demo.marketing.") || mType.startsWith("live.marketing.")) &&
          Array.isArray(msg.items)
        ) {
          setDemoMode(mType.startsWith("demo."));
          for (const it of msg.items) {
            batcher.push({ ...it, marketingEnvelope: mType });
          }
          return;
        }
        if (
          (mType.startsWith("demo.order_adv.") || mType.startsWith("live.order_adv.")) &&
          Array.isArray(msg.items)
        ) {
          setDemoMode(mType.startsWith("demo."));
          for (const it of msg.items) {
            batcher.push({ ...it, orderAdvEnvelope: mType });
          }
          return;
        }
        if (
          (mType.startsWith("demo.supply_logistics.") || mType.startsWith("live.supply_logistics.")) &&
          Array.isArray(msg.items)
        ) {
          setDemoMode(mType.startsWith("demo."));
          for (const it of msg.items) {
            batcher.push({ ...it, supplyLogisticsEnvelope: mType });
          }
          return;
        }
        if (
          (mType.startsWith("demo.finance_collections.") || mType.startsWith("live.finance_collections.")) &&
          Array.isArray(msg.items)
        ) {
          setDemoMode(mType.startsWith("demo."));
          for (const it of msg.items) {
            batcher.push({ ...it, financeCollectionsEnvelope: mType });
          }
          return;
        }
        if (
          (mType.startsWith("demo.economic_memory.") || mType.startsWith("live.economic_memory.")) &&
          Array.isArray(msg.items)
        ) {
          setDemoMode(mType.startsWith("demo."));
          for (const it of msg.items) {
            batcher.push({ ...it, economicMemoryEnvelope: mType });
          }
          return;
        }
        if (
          (mType.startsWith("demo.economic_scenarios.") || mType.startsWith("live.economic_scenarios.")) &&
          Array.isArray(msg.items)
        ) {
          setDemoMode(mType.startsWith("demo."));
          for (const it of msg.items) {
            batcher.push({ ...it, economicScenariosEnvelope: mType });
          }
          return;
        }
        if (
          (mType.startsWith("demo.economic_coordination.") || mType.startsWith("live.economic_coordination.")) &&
          Array.isArray(msg.items)
        ) {
          setDemoMode(mType.startsWith("demo."));
          for (const it of msg.items) {
            batcher.push({ ...it, economicCoordinationEnvelope: mType });
          }
          return;
        }
        if (
          (mType.startsWith("demo.economic_command.") || mType.startsWith("live.economic_command.")) &&
          Array.isArray(msg.items)
        ) {
          setDemoMode(mType.startsWith("demo."));
          for (const it of msg.items) {
            const cls =
              (it as { economicCommandRealtimeClass?: string }).economicCommandRealtimeClass ??
              (mType.startsWith("live.") ? "DOMAIN_LIVE" : "DEMO_MIRROR");
            batcher.push({
              ...it,
              economicCommandEnvelope: mType,
              economicCommandRealtimeClass: cls as OperationalSignalItem["economicCommandRealtimeClass"],
            });
          }
          return;
        }
        if (
          (mType.startsWith("demo.industrial_situation_room.") || mType.startsWith("live.industrial_situation_room.")) &&
          Array.isArray(msg.items)
        ) {
          setDemoMode(mType.startsWith("demo."));
          for (const it of msg.items) {
            const cls =
              (it as { industrialSituationRoomRealtimeClass?: string }).industrialSituationRoomRealtimeClass ??
              (mType.startsWith("live.") ? "DOMAIN_LIVE" : "DEMO_MIRROR");
            batcher.push({
              ...it,
              industrialSituationRoomEnvelope: mType,
              industrialSituationRoomRealtimeClass: cls as OperationalSignalItem["industrialSituationRoomRealtimeClass"],
            });
          }
          return;
        }
        if (
          (mType.startsWith("demo.industrial_operational_continuity.") ||
            mType.startsWith("live.industrial_operational_continuity.")) &&
          Array.isArray(msg.items)
        ) {
          setDemoMode(mType.startsWith("demo."));
          for (const it of msg.items) {
            const inferred: OperationalSignalItem["industrialOperationalContinuityRealtimeClass"] =
              mType.includes(".synthetic_tick.")
                ? "SYNTHETIC_TICK"
                : mType.startsWith("live.")
                  ? "DOMAIN_LIVE"
                  : "DEMO_MIRROR";
            const cls =
              (it as { industrialOperationalContinuityRealtimeClass?: string }).industrialOperationalContinuityRealtimeClass ??
              inferred;
            batcher.push({
              ...it,
              industrialOperationalContinuityEnvelope: mType,
              industrialOperationalContinuityRealtimeClass:
                cls as OperationalSignalItem["industrialOperationalContinuityRealtimeClass"],
            });
          }
          return;
        }
        if (
          (mType.startsWith("demo.industrial_evidence.") || mType.startsWith("live.industrial_evidence.")) &&
          Array.isArray(msg.items)
        ) {
          setDemoMode(mType.startsWith("demo."));
          for (const it of msg.items) {
            const inferred: OperationalSignalItem["industrialEvidenceRealtimeClass"] = mType.includes(".synthetic_tick.")
              ? "SYNTHETIC_TICK"
              : mType.startsWith("live.")
                ? "DOMAIN_LIVE"
                : "DEMO_MIRROR";
            const cls =
              (it as { industrialEvidenceRealtimeClass?: string }).industrialEvidenceRealtimeClass ?? inferred;
            batcher.push({
              ...it,
              industrialEvidenceEnvelope: mType,
              industrialEvidenceRealtimeClass: cls as OperationalSignalItem["industrialEvidenceRealtimeClass"],
            });
          }
          return;
        }
        if (
          (mType.startsWith("demo.commercial_relationship_graph.") || mType.startsWith("live.commercial_relationship_graph.")) &&
          Array.isArray(msg.items)
        ) {
          setDemoMode(mType.startsWith("demo."));
          for (const it of msg.items) {
            const inferred: OperationalSignalItem["commercialRelationshipGraphRealtimeClass"] = mType.includes(
              ".synthetic_tick.",
            )
              ? "SYNTHETIC_TICK"
              : mType.startsWith("live.")
                ? "DOMAIN_LIVE"
                : "DEMO_MIRROR";
            const cls =
              (it as { commercialRelationshipGraphRealtimeClass?: string }).commercialRelationshipGraphRealtimeClass ??
              inferred;
            batcher.push({
              ...it,
              commercialRelationshipGraphEnvelope: mType,
              commercialRelationshipGraphRealtimeClass:
                cls as OperationalSignalItem["commercialRelationshipGraphRealtimeClass"],
            });
          }
          return;
        }
        if (
          (mType.startsWith("demo.relational_catalog.") || mType.startsWith("live.relational_catalog.")) &&
          Array.isArray(msg.items)
        ) {
          setDemoMode(mType.startsWith("demo."));
          for (const it of msg.items) {
            const inferred: OperationalSignalItem["relationalCatalogRealtimeClass"] = mType.includes(".synthetic_tick.")
              ? "SYNTHETIC_TICK"
              : mType.startsWith("live.")
                ? "DOMAIN_LIVE"
                : "DEMO_MIRROR";
            const cls = (it as { relationalCatalogRealtimeClass?: string }).relationalCatalogRealtimeClass ?? inferred;
            batcher.push({
              ...it,
              relationalCatalogEnvelope: mType,
              relationalCatalogRealtimeClass: cls as OperationalSignalItem["relationalCatalogRealtimeClass"],
            });
          }
          return;
        }
        if (
          (mType.startsWith("demo.relational_orders.") ||
            mType.startsWith("live.relational_orders.") ||
            mType.startsWith("relational.order.") ||
            mType.startsWith("relational.fulfillment.") ||
            mType.startsWith("relational.supply.") ||
            mType.startsWith("relational.macro.") ||
            mType.startsWith("relational.executive_operations.") ||
            mType.startsWith("relational.strategic_command.") ||
            mType.startsWith("relational.strategic_intelligence.") ||
            mType.startsWith("relational.institutional_reporting.") ||
            mType.startsWith("relational.executive_orchestration.") ||
            mType.startsWith("relational.monitoring.") ||
            mType.startsWith("relational.stabilization.") ||
            mType.startsWith("relational.arbitration.") ||
            mType.startsWith("relational.governance.") ||
            mType.startsWith("relational.recovery.") ||
            mType.startsWith("relational.sovereignty.") ||
            mType.startsWith("relational.continuity.") ||
            mType.startsWith("relational.sector.")) &&
          Array.isArray(msg.items)
        ) {
          setDemoMode(mType.startsWith("demo."));
          for (const it of msg.items) {
            const inferred: OperationalSignalItem["relationalOrdersRealtimeClass"] = mType.includes(".synthetic_tick.")
              ? "SYNTHETIC_TICK"
              : mType.startsWith("live.") ||
                  mType.startsWith("relational.order.") ||
                  mType.startsWith("relational.fulfillment.") ||
                  mType.startsWith("relational.executive_orchestration.") ||
                  mType.startsWith("relational.monitoring.") ||
                  mType.startsWith("relational.stabilization.") ||
                  mType.startsWith("relational.arbitration.") ||
                  mType.startsWith("relational.governance.") ||
                  mType.startsWith("relational.recovery.") ||
                  mType.startsWith("relational.sovereignty.") ||
                  mType.startsWith("relational.continuity.") ||
                  mType.startsWith("relational.macro.") ||
                  mType.startsWith("relational.supply.") ||
                  mType.startsWith("relational.sector.")
                ? "DOMAIN_LIVE"
                : "DEMO_MIRROR";
            const cls = (it as { relationalOrdersRealtimeClass?: string }).relationalOrdersRealtimeClass ?? inferred;
            batcher.push({
              ...it,
              relationalOrdersEnvelope: mType,
              relationalExecutiveOperationsEnvelope: mType.startsWith("relational.executive_operations.")
                ? mType
                : undefined,
              relationalStrategicCommandEnvelope: mType.startsWith("relational.strategic_command.")
                ? mType
                : undefined,
              relationalStrategicIntelligenceEnvelope: mType.startsWith("relational.strategic_intelligence.")
                ? mType
                : undefined,
              relationalInstitutionalReportingEnvelope: mType.startsWith("relational.institutional_reporting.")
                ? mType
                : undefined,
              relationalExecutiveOrchestrationEnvelope: mType.startsWith("relational.executive_orchestration.")
                ? mType
                : undefined,
              relationalEconomicMonitoringEnvelope: mType.startsWith("relational.monitoring.")
                ? mType
                : undefined,
              relationalEconomicStabilizationEnvelope: mType.startsWith("relational.stabilization.")
                ? mType
                : undefined,
              relationalEconomicArbitrationEnvelope: mType.startsWith("relational.arbitration.")
                ? mType
                : undefined,
              relationalEconomicGovernanceEnvelope: mType.startsWith("relational.governance.")
                ? mType
                : undefined,
              relationalEconomicRecoveryEnvelope: mType.startsWith("relational.recovery.")
                ? mType
                : undefined,
              relationalEconomicSovereigntyEnvelope: mType.startsWith("relational.sovereignty.")
                ? mType
                : undefined,
              relationalEconomicContinuityEnvelope: mType.startsWith("relational.continuity.")
                ? mType
                : undefined,
              relationalMacroEconomicEnvelope: mType.startsWith("relational.macro.") ? mType : undefined,
              relationalSupplyFlowEnvelope: mType.startsWith("relational.supply.") ? mType : undefined,
              relationalSectorEnvelope: mType.startsWith("relational.sector.") ? mType : undefined,
              relationalOrdersRealtimeClass: cls as OperationalSignalItem["relationalOrdersRealtimeClass"],
            });
          }
          return;
        }
        if (
          (mType.startsWith("demo.commercial_trust.") || mType.startsWith("live.commercial_trust.")) &&
          Array.isArray(msg.items)
        ) {
          setDemoMode(mType.startsWith("demo."));
          for (const it of msg.items) {
            const inferred: OperationalSignalItem["commercialTrustRealtimeClass"] = mType.includes(".synthetic_tick.")
              ? "SYNTHETIC_TICK"
              : mType.startsWith("live.")
                ? "DOMAIN_LIVE"
                : "DEMO_MIRROR";
            const cls = (it as { commercialTrustRealtimeClass?: string }).commercialTrustRealtimeClass ?? inferred;
            batcher.push({
              ...it,
              commercialTrustEnvelope: mType,
              commercialTrustRealtimeClass: cls as OperationalSignalItem["commercialTrustRealtimeClass"],
            });
          }
          return;
        }
        if (
          (mType.startsWith("demo.corridor_intelligence.") || mType.startsWith("live.corridor_intelligence.")) &&
          Array.isArray(msg.items)
        ) {
          setDemoMode(mType.startsWith("demo."));
          for (const it of msg.items) {
            const inferred: OperationalSignalItem["corridorIntelligenceRealtimeClass"] = mType.includes(".synthetic_tick.")
              ? "SYNTHETIC_TICK"
              : mType.startsWith("live.")
                ? "DOMAIN_LIVE"
                : "DEMO_MIRROR";
            const cls = (it as { corridorIntelligenceRealtimeClass?: string }).corridorIntelligenceRealtimeClass ?? inferred;
            batcher.push({
              ...it,
              corridorIntelligenceEnvelope: mType,
              corridorIntelligenceRealtimeClass: cls as OperationalSignalItem["corridorIntelligenceRealtimeClass"],
            });
          }
          return;
        }
        if (
          (mType.startsWith("demo.economic_propagation.") || mType.startsWith("live.economic_propagation.")) &&
          Array.isArray(msg.items)
        ) {
          setDemoMode(mType.startsWith("demo."));
          for (const it of msg.items) {
            batcher.push({ ...it, economicPropagationEnvelope: mType });
          }
          return;
        }
        if (
          (mType.startsWith("demo.data_intelligence.") || mType.startsWith("live.data_intelligence.")) &&
          Array.isArray(msg.items)
        ) {
          setDemoMode(mType.startsWith("demo."));
          for (const it of msg.items) {
            batcher.push({ ...it, dataIntelligenceEnvelope: mType });
          }
          return;
        }
        if (
          (msg.type === "demo.operational.signal.batch" || msg.type === "operational.signal.batch") &&
          Array.isArray(msg.items)
        ) {
          for (const it of msg.items) {
            const row = it as OperationalSignalItem;
            batcher.push(
              row.pole === "ECONOMIC_COMMAND"
                ? {
                    ...row,
                    economicCommandRealtimeClass:
                      row.economicCommandRealtimeClass ?? ("SYNTHETIC_TICK" as const),
                  }
                : row.pole === "INDUSTRIAL_SITUATION_ROOM"
                  ? {
                      ...row,
                      industrialSituationRoomRealtimeClass:
                        row.industrialSituationRoomRealtimeClass ?? ("SYNTHETIC_TICK" as const),
                    }
                  : row.pole === "INDUSTRIAL_OPERATIONAL_CONTINUITY"
                    ? {
                        ...row,
                        industrialOperationalContinuityRealtimeClass:
                          row.industrialOperationalContinuityRealtimeClass ?? ("SYNTHETIC_TICK" as const),
                      }
                    : row.pole === "INDUSTRIAL_EVIDENCE"
                      ? {
                          ...row,
                          industrialEvidenceRealtimeClass:
                            row.industrialEvidenceRealtimeClass ?? ("SYNTHETIC_TICK" as const),
                        }
                      : row.pole === "COMMERCIAL_RELATIONSHIP_GRAPH"
                        ? {
                            ...row,
                            commercialRelationshipGraphRealtimeClass:
                              row.commercialRelationshipGraphRealtimeClass ?? ("SYNTHETIC_TICK" as const),
                          }
                        : row.pole === "RELATIONAL_CATALOG"
                          ? {
                              ...row,
                              relationalCatalogRealtimeClass:
                                row.relationalCatalogRealtimeClass ?? ("SYNTHETIC_TICK" as const),
                            }
                          : row.pole === "RELATIONAL_ORDERS"
                            ? {
                                ...row,
                                relationalOrdersRealtimeClass:
                                  row.relationalOrdersRealtimeClass ?? ("SYNTHETIC_TICK" as const),
                              }
                            : row.pole === "COMMERCIAL_TRUST"
                              ? {
                                  ...row,
                                  commercialTrustRealtimeClass:
                                    row.commercialTrustRealtimeClass ?? ("SYNTHETIC_TICK" as const),
                                }
                              : row.pole === "CORRIDOR_INTELLIGENCE"
                                ? {
                                    ...row,
                                    corridorIntelligenceRealtimeClass:
                                      row.corridorIntelligenceRealtimeClass ?? ("SYNTHETIC_TICK" as const),
                                  }
                                : row,
            );
          }
        }
      } catch {
        /* ignore */
      }
    };
    ws.onclose = () => setConnected(false);
    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [batcher, enabled, poleChannel, wsUrl, subscribeOrganizationId, subscribeToken]);

  return { connected, stream, demoMode, liveChannel };
}

export type PoleRealtimeGateway = ReturnType<typeof usePoleRealtimeGateway>;
