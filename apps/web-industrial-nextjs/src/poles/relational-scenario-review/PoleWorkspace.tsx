"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { useIndustrialFeatureFlags } from "../hooks/useIndustrialFeatureFlags";
import { usePoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";
import { OperationalPoleCanvas } from "../shell/OperationalPoleCanvas";
import type { PoleSlug } from "../types";
import { getPoleEntry } from "../registry";
import { resolveRelationalOrdersOrganizationId } from "../relational-orders/resolveRelationalOrdersOrganizationId";
import { RelationalScenarioReviewPanel } from "./RelationalScenarioReviewPanel";

const SLUG = "relational-scenario-review" as const satisfies PoleSlug;

export default function PoleWorkspace() {
  const org = resolveRelationalOrdersOrganizationId();
  const params = useSearchParams();
  const relationshipId = params.get("relationshipId");
  const organizationId = params.get("organizationId") ?? org.organizationId;
  const entry = getPoleEntry(SLUG);
  const { flags, hydrated } = useIndustrialFeatureFlags();

  const reviewEnabled = hydrated && flags.relational_scenario_review_enabled !== false;
  const realtimeEnabled = hydrated && flags.relational_scenario_review_realtime_enabled !== false;

  const gatewayEnabled =
    hydrated &&
    flags.industrial_poles_enabled !== false &&
    flags.realtime_signals_enabled !== false &&
    reviewEnabled &&
    Boolean(entry);

  const realtimeGateway = usePoleRealtimeGateway({
    poleChannel: entry?.poleChannel ?? "",
    enabled: gatewayEnabled && realtimeEnabled,
    subscribeOrganizationId: organizationId ?? undefined,
    subscribeToken: process.env.NEXT_PUBLIC_VENEXT_WS_SUBSCRIBE_TOKEN,
  });

  const lastRealtimeEvent = useMemo(() => {
    const hit = realtimeGateway.stream.find((s) => s.detail.includes("review") || s.label.includes("review"));
    return hit?.label ?? null;
  }, [realtimeGateway.stream]);

  return (
    <div className="flex min-h-0 flex-col gap-3 px-3 py-3">
      <header className="rounded border border-violet-900/40 bg-slate-950/90 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-violet-200/90">
          {entry?.title ?? "Revue scénario corridor"}
        </p>
        <p className="mt-1 text-[10px] text-slate-500">{entry?.subtitle}</p>
      </header>
      <RelationalScenarioReviewPanel
        organizationId={organizationId}
        relationshipId={relationshipId}
        reviewEnabled={reviewEnabled}
        realtimeEnabled={realtimeEnabled}
        lastRealtimeEvent={lastRealtimeEvent}
      />
      <OperationalPoleCanvas poleSlug={SLUG} realtimeGateway={realtimeGateway} />
    </div>
  );
}
