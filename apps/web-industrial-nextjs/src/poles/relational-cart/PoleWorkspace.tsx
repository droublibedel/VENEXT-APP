"use client";

import { useSearchParams } from "next/navigation";

import { useIndustrialFeatureFlags } from "../hooks/useIndustrialFeatureFlags";
import { usePoleRealtimeGateway } from "../hooks/usePoleRealtimeGateway";
import { OperationalPoleCanvas } from "../shell/OperationalPoleCanvas";
import type { PoleSlug } from "../types";
import { getPoleEntry } from "../registry";
import { RelationalCartWorkspace } from "./RelationalCartWorkspace";
import { resolveRelationalCartOrganizationId } from "./resolveRelationalCartOrganizationId";
import { VenextInlineSkeleton } from "@/ux/VenextInlineSkeleton";

const SLUG = "relational-cart" as const satisfies PoleSlug;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function PoleWorkspace() {
  const searchParams = useSearchParams();
  const cartIdRaw = searchParams.get("cartId")?.trim() ?? "";
  const cartId = UUID_RE.test(cartIdRaw) ? cartIdRaw : null;

  const org = resolveRelationalCartOrganizationId();
  const entry = getPoleEntry(SLUG);
  const { flags, hydrated } = useIndustrialFeatureFlags();

  const poleAllowed =
    hydrated && flags.industrial_poles_enabled !== false && flags.relational_cart_enabled !== false && Boolean(entry);

  const gatewayEnabled =
    hydrated &&
    flags.industrial_poles_enabled !== false &&
    flags.realtime_signals_enabled !== false &&
    flags.relational_cart_enabled !== false &&
    flags.relational_cart_realtime_enabled !== false &&
    Boolean(entry);

  const realtimeGateway = usePoleRealtimeGateway({
    poleChannel: entry?.poleChannel ?? "",
    enabled: gatewayEnabled,
    subscribeOrganizationId: org.organizationId,
    subscribeToken: process.env.NEXT_PUBLIC_VENEXT_WS_SUBSCRIBE_TOKEN,
  });

  if (hydrated && flags.relational_cart_enabled === false) {
    return (
      <div className="flex min-h-0 flex-col px-4 py-6">
        <p className="text-sm text-slate-600" data-testid="relational-cart-pole-disabled">
          Le panier relationnel est désactivé.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-col">
      {poleAllowed ? (
        <RelationalCartWorkspace
          cartId={cartId ?? undefined}
          actingOrganizationId={org.organizationId}
          userId={process.env.NEXT_PUBLIC_RELATIONAL_CART_USER_ID}
        />
      ) : (
        <VenextInlineSkeleton />
      )}
      <OperationalPoleCanvas poleSlug={SLUG} realtimeGateway={realtimeGateway} />
    </div>
  );
}
