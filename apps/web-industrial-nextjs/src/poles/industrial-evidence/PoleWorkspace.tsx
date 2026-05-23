"use client";

import { useIndustrialFeatureFlags } from "../hooks/useIndustrialFeatureFlags";
import { usePoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";
import { OperationalPoleCanvas } from "../shell/OperationalPoleCanvas";
import type { PoleSlug } from "../types";
import { getPoleEntry } from "../registry";
import { IndustrialEvidenceWorkspace } from "./IndustrialEvidenceWorkspace";
import { resolveIndustrialEvidenceOrganizationId } from "./resolveIndustrialEvidenceOrganizationId";
import { useIndustrialEvidenceData } from "./useIndustrialEvidenceData";

const SLUG = "industrial-evidence" as const satisfies PoleSlug;

export default function PoleWorkspace() {
  const org = resolveIndustrialEvidenceOrganizationId();
  const entry = getPoleEntry(SLUG);
  const { flags, hydrated } = useIndustrialFeatureFlags();
  const gatewayEnabled =
    hydrated &&
    flags.industrial_poles_enabled !== false &&
    flags.realtime_signals_enabled !== false &&
    flags.industrial_evidence_enabled !== false &&
    Boolean(entry);

  const realtimeGateway = usePoleRealtimeGateway({
    poleChannel: entry?.poleChannel ?? "",
    enabled: gatewayEnabled,
    subscribeOrganizationId: org.organizationId,
    subscribeToken: process.env.NEXT_PUBLIC_VENEXT_WS_SUBSCRIBE_TOKEN,
  });

  const data = useIndustrialEvidenceData(org.organizationId);

  return (
    <div className="flex min-h-0 flex-col">
      {flags.industrial_evidence_realtime_enabled !== false ? (
        <p className="border-b border-slate-800/80 px-3 py-1.5 text-[10px] text-slate-500">
          Temps réel registre preuve — événements{" "}
          <span className="font-mono">live.industrial_evidence.*</span> /{" "}
          <span className="font-mono">demo.industrial_evidence.synthetic_tick.*</span> (classification explicite).
        </p>
      ) : (
        <p className="px-4 pt-2 text-[10px] text-slate-500">
          Temps réel coupé par <span className="font-mono">industrial_evidence_realtime_enabled</span>.
        </p>
      )}
      <IndustrialEvidenceWorkspace
        bundle={data.bundle}
        loading={data.loading}
        error={data.error}
        degradedBundleMode={data.degradedBundleMode}
        fallbackSource={data.fallbackSource}
        fallbackReason={data.fallbackReason}
      />
      <OperationalPoleCanvas poleSlug={SLUG} realtimeGateway={realtimeGateway} />
    </div>
  );
}
