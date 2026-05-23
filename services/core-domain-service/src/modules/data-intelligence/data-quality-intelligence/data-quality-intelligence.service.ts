import { Injectable } from "@nestjs/common";
import { WalletStatus } from "@prisma/client";
import type { DataQualityIntelligenceResponse } from "@venext/shared-contracts";
import { normalizeTerritoryLabel } from "../../supply-logistics-intelligence/territory-code-normalizer";
import type { DataIntelligenceCrossCutSnapshot } from "../data-intelligence-data.service";

@Injectable()
export class DataQualityIntelligenceService {
  build(s: DataIntelligenceCrossCutSnapshot, enabled: boolean): DataQualityIntelligenceResponse {
    if (!enabled) {
      return {
        version: "1",
        generatedAt: s.generatedAt,
        organizationId: s.organizationId,
        policy: "DISABLED",
        issues: [],
        guardianReadiness: 0,
      };
    }
    const issues: DataQualityIntelligenceResponse["issues"] = [];

    const relIds = new Set(s.commercial.relationships.map((r) => r.id));
    const orphanFin = s.finance.orders.filter((o) => o.relationshipId && !relIds.has(o.relationshipId)).length;
    if (orphanFin > 0) {
      issues.push({
        id: "dq-orphan-finance",
        kind: "orphan_relationship_reference",
        severity: Number(Math.min(1, 0.35 + orphanFin * 0.06).toFixed(3)),
        detail: `${orphanFin} finance orders reference relationship IDs absent from current graph slice.`,
        poles: ["finance_collections", "commercial_network"],
        entityRef: `finance_orders_missing_relationship:${orphanFin}`,
        affectedPole: "finance_collections",
        recommendation: "Reconcile finance order.relationshipId against commercial relationship inventory.",
      });
    }

    if (s.finance.wallets.length === 0 && s.finance.orders.length > 3) {
      issues.push({
        id: "dq-wallet-gap",
        kind: "wallet_incoherence",
        severity: 0.42,
        detail: "Orders present without wallet row on producer org — treasury supervision blind spot.",
        poles: ["finance_collections"],
        entityRef: "finance.wallets:empty",
        affectedPole: "finance_collections",
        recommendation: "Provision wallet supervision rows or gate finance intelligence until treasury model is complete.",
      });
    }

    if (s.economicSignals7d === 0 && s.orderAdv.orders.length > 10) {
      issues.push({
        id: "dq-signal-quiet",
        kind: "dead_signals",
        severity: 0.3,
        detail: "High transactional mass but zero economic signals attributed to org in 7d — realtime / signal ingestion drift risk.",
        poles: ["strategic_intelligence", "order_adv"],
        entityRef: "economicSignal.count:7d:0",
        affectedPole: "strategic_intelligence",
        recommendation: "Validate economic signal fan-in vs ADV throughput; check EXTERNAL_CONTEXT vs internal mix.",
      });
    }

    let lowConfidenceTerritories = 0;
    for (const o of s.finance.orders) {
      const n = normalizeTerritoryLabel(`${o.buyer.country ?? ""} / ${o.buyer.city ?? ""}`);
      if (n.confidence < 0.42 || n.normalizedCode === "UNKNOWN") lowConfidenceTerritories += 1;
    }
    if (lowConfidenceTerritories > 2) {
      issues.push({
        id: "dq-territory-normalization",
        kind: "territory_normalization_defect",
        severity: Number(Math.min(1, 0.28 + lowConfidenceTerritories * 0.05).toFixed(3)),
        detail: `${lowConfidenceTerritories} finance buyer geo rows normalize with low confidence or UNKNOWN — cross-pole territory reads become fragile.`,
        poles: ["finance_collections", "supply_logistics"],
        entityRef: `finance.orders.buyer.geo:lowConfidenceCount:${lowConfidenceTerritories}`,
        affectedPole: "finance_collections",
        recommendation: "Enrich buyer city/country capture or map through distributor address book before territory intelligence.",
      });
    }

    const limited = s.finance.wallets.filter((w) => w.status === WalletStatus.LIMITED).length;
    const walletSum = s.finance.wallets.reduce((a, w) => a + w.balance, 0);
    if (limited > 0 && walletSum > 35_000_000) {
      issues.push({
        id: "dq-wallet-flags",
        kind: "contradictory_flags",
        severity: 0.46,
        detail: "Wallet rows marked LIMITED while aggregate balances are high — policy / state drift vs treasury reality.",
        poles: ["finance_collections"],
        entityRef: "finance.wallets:LIMITED_vs_high_aggregate",
        affectedPole: "finance_collections",
        recommendation: "Reconcile LIMITED policy triggers against treasury run-rate and exposure caps.",
      });
    }

    if (s.economicSignals7d === 0 && s.supply.economicSignals.length > 6 && s.orderAdv.orders.length > 6) {
      issues.push({
        id: "dq-realtime-drift",
        kind: "realtime_drift",
        severity: 0.48,
        detail: "Supply snapshot includes economic signal rows while org-scoped 7d economicSignal count is zero — scope or attribution drift risk.",
        poles: ["supply_logistics", "strategic_intelligence"],
        entityRef: `economicSignal.count:7d:${s.economicSignals7d}|supply.economicSignals:${s.supply.economicSignals.length}`,
        affectedPole: "data_intelligence",
        recommendation: "Verify economicSignal.organizationId attribution on logistics ingest vs strategic org scope.",
      });
    }

    const tFin = Date.parse(s.finance.generatedAt);
    const tAdv = Date.parse(s.orderAdv.generatedAt);
    if (!Number.isNaN(tFin) && !Number.isNaN(tAdv) && Math.abs(tFin - tAdv) > 5000) {
      issues.push({
        id: "dq-snapshot-skew",
        kind: "snapshot_inconsistency",
        severity: 0.38,
        detail: "Finance snapshot timestamp diverges materially from ADV snapshot — cross-pole reads may stitch mismatched time windows.",
        poles: ["finance_collections", "order_adv"],
        entityRef: `generatedAt_skew_ms:${Math.abs(tFin - tAdv)}`,
        affectedPole: "data_intelligence",
        recommendation: "Align snapshot generation cadence or stamp a shared crossCutVersion on all pole loaders.",
      });
    }

    const guardianReadiness = Number(
      Math.max(0, Math.min(1, 1 - issues.reduce((sum, i) => sum + i.severity, 0) / Math.max(1, issues.length * 2))).toFixed(3),
    );

    return {
      version: "1",
      generatedAt: s.generatedAt,
      organizationId: s.organizationId,
      policy: "ACTIVE",
      issues: issues.slice(0, 32),
      guardianReadiness: Number(guardianReadiness),
    };
  }
}
