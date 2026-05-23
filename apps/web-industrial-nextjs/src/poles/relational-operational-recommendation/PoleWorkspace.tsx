"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { useIndustrialFeatureFlags } from "../hooks/useIndustrialFeatureFlags";
import { usePoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";
import { OperationalPoleCanvas } from "../shell/OperationalPoleCanvas";
import type { PoleSlug } from "../types";
import { getPoleEntry } from "../registry";
import { resolveRelationalOrdersOrganizationId } from "../relational-orders/resolveRelationalOrdersOrganizationId";
import { RelationalOperationalRecommendationPanel } from "./RelationalOperationalRecommendationPanel";

const SLUG = "relational-operational-recommendation" as const satisfies PoleSlug;

export default function PoleWorkspace() {
  const org = resolveRelationalOrdersOrganizationId();
  const params = useSearchParams();
  const relationshipId = params.get("relationshipId");
  const organizationId = params.get("organizationId") ?? org.organizationId;
  const entry = getPoleEntry(SLUG);
  const { flags, hydrated } = useIndustrialFeatureFlags();

  const recommendationEnabled = hydrated && flags.relational_operational_recommendation_enabled !== false;
  const realtimeEnabled = hydrated && flags.relational_operational_recommendation_realtime_enabled !== false;

  const gatewayEnabled =
    hydrated &&
    flags.industrial_poles_enabled !== false &&
    flags.realtime_signals_enabled !== false &&
    recommendationEnabled &&
    Boolean(entry);

  const realtimeGateway = usePoleRealtimeGateway({
    poleChannel: entry?.poleChannel ?? "",
    enabled: gatewayEnabled && realtimeEnabled,
    subscribeOrganizationId: organizationId ?? undefined,
    subscribeToken: process.env.NEXT_PUBLIC_VENEXT_WS_SUBSCRIBE_TOKEN,
  });

  const lastRealtimeEvent = useMemo(() => {
    const hit = realtimeGateway.stream.find(
      (s) =>
        s.label.includes("recommendation") ||
        s.detail.includes("relational.operational.recommendation"),
    );
    return hit?.label ?? null;
  }, [realtimeGateway.stream]);

  return (
    <div className="flex min-h-0 flex-col gap-3 px-3 py-3">
      <header className="rounded border border-cyan-900/40 bg-slate-950/90 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-200/90">
          {entry?.title ?? "Recommandations opérationnelles"}
        </p>
        <p className="mt-1 text-[10px] text-slate-500">{entry?.subtitle}</p>
      </header>
      <RelationalOperationalRecommendationPanel
        organizationId={organizationId}
        relationshipId={relationshipId}
        recommendationEnabled={recommendationEnabled}
        realtimeEnabled={realtimeEnabled}
        lastRealtimeEvent={lastRealtimeEvent}
      />
      <OperationalPoleCanvas poleSlug={SLUG} realtimeGateway={realtimeGateway} />
    </div>
  );
}
