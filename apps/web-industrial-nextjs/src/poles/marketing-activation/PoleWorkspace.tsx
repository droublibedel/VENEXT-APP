"use client";

import { useIndustrialFeatureFlags } from "../hooks/useIndustrialFeatureFlags";
import { usePoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";
import { OperationalPoleCanvas } from "../shell/OperationalPoleCanvas";
import type { PoleSlug } from "../types";
import { getPoleEntry } from "../registry";
import { MARKETING_ACTIVATION_DEMO_ORGANIZATION_ID } from "./constants";
import { MarketingActivationWorkspace } from "./MarketingActivationWorkspace";
import { DiffusionRibbon } from "./widgets/DiffusionRibbon";

const SLUG = "marketing-activation" as const satisfies PoleSlug;

export default function PoleWorkspace() {
  const entry = getPoleEntry(SLUG);
  const { flags, hydrated } = useIndustrialFeatureFlags();
  const gatewayEnabled =
    hydrated && flags.industrial_poles_enabled !== false && flags.realtime_signals_enabled !== false && Boolean(entry);

  const realtimeGateway = usePoleRealtimeGateway({
    poleChannel: entry?.poleChannel ?? "",
    enabled: gatewayEnabled,
  });

  return (
    <div className="flex min-h-0 flex-col">
      <DiffusionRibbon />
      <MarketingActivationWorkspace realtimeGateway={realtimeGateway} />
      <OperationalPoleCanvas
        poleSlug={SLUG}
        realtimeGateway={realtimeGateway}
        marketingActivationOrganizationId={MARKETING_ACTIVATION_DEMO_ORGANIZATION_ID}
      />
    </div>
  );
}
