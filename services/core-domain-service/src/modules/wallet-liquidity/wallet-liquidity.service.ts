import { Injectable } from "@nestjs/common";
import type { WalletLiquiditySurfaceResponse } from "@venext/shared-contracts";
import type { FinanceCollectionsSnapshot } from "../finance-collections-intelligence/finance-collections-data.service";
import { clamp01 } from "../finance-collections-intelligence/finance-metrics.util";

function resolveProviderMode(): "MOCK_PROVIDER" | "NOT_CONFIGURED" | "READY" {
  if (process.env.VENEXT_PAYMENT_PROVIDER_READY === "1" || process.env.VENEXT_PAYMENT_PROVIDER_READY === "true") {
    return "READY";
  }
  if (process.env.VENEXT_USE_MOCK_PAYMENT_PROVIDER === "1" || process.env.VENEXT_USE_MOCK_PAYMENT_PROVIDER === "true") {
    return "MOCK_PROVIDER";
  }
  return "NOT_CONFIGURED";
}

@Injectable()
export class WalletLiquidityService {
  build(snapshot: FinanceCollectionsSnapshot, subOn: boolean): WalletLiquiditySurfaceResponse {
    const providerMode = resolveProviderMode();
    if (!subOn) {
      return {
        version: "1",
        generatedAt: snapshot.generatedAt,
        organizationId: snapshot.organizationId,
        policy: "DISABLED",
        providerMode,
        wallets: [],
        liquidityStressIndex: 0,
      };
    }

    const since = Date.now() - 14 * 86400000;
    const wallets = snapshot.wallets.map((w) => {
      const txns = snapshot.transactions.filter((t) => t.organizationId === w.organizationId && t.createdAt.getTime() >= since);
      const velocity = txns.length / 14;
      const qrReadiness = w.qrPayload.length > 8 ? 0.92 : w.qrPayload.length > 0 ? 0.55 : 0.2;
      const nfcReadiness = w.nfcEnabled ? 0.88 : 0.25;
      const electronicReadiness =
        providerMode === "READY" ? 0.9 : providerMode === "MOCK_PROVIDER" ? 0.62 : 0.28;
      const stress =
        w.balance < 400_000 && w.organizationId === snapshot.organizationId
          ? 0.82
          : w.balance < 1_200_000
            ? 0.45
            : 0.18;
      return {
        organizationId: w.organizationId,
        currency: w.currency,
        balance: w.balance,
        status: w.status,
        qrReadiness: clamp01(qrReadiness),
        nfcReadiness: clamp01(nfcReadiness),
        electronicReadiness: clamp01(electronicReadiness),
        liquidityStress: clamp01(stress),
        recentTxnVelocity: velocity,
      };
    });

    const liquidityStressIndex = clamp01(
      wallets.length ? wallets.reduce((s, w) => s + w.liquidityStress, 0) / wallets.length : 0,
    );

    return {
      version: "1",
      generatedAt: snapshot.generatedAt,
      organizationId: snapshot.organizationId,
      policy: "ACTIVE",
      providerMode,
      wallets: wallets.slice(0, 24),
      liquidityStressIndex,
    };
  }
}
