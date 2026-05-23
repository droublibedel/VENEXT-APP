"use client";

import { useIndustrialFeatureFlags } from "../hooks/useIndustrialFeatureFlags";
import { usePoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";
import { OperationalPoleCanvas } from "../shell/OperationalPoleCanvas";
import type { PoleSlug } from "../types";
import { getPoleEntry } from "../registry";
import { DirectionStrategyWorkspace } from "./DirectionStrategyWorkspace";
import { MacroCorridorTicker } from "./widgets/MacroCorridorTicker";

const SLUG = "direction-strategy" as const satisfies PoleSlug;

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
      <MacroCorridorTicker />
      <DirectionStrategyWorkspace realtimeGateway={realtimeGateway} />
      <OperationalPoleCanvas poleSlug={SLUG} realtimeGateway={realtimeGateway} />
    </div>
  );
}
