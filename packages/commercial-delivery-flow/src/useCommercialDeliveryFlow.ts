import { useCallback, useMemo, useState } from "react";

import { resolveActiveDeliveryPanel, nextStatusForDeliveryAction } from "./commercial-delivery-governance";
import { buildDeliveryTimeline } from "./commercial-delivery-timeline";
import { mockCommercialDeliveryView } from "./commercial-delivery.viewmodel";
import type {
  CommercialDeliveryActorRole,
  CommercialDeliveryFlowFlags,
  CommercialDeliveryFlowInjected,
  CommercialDeliveryQuickActionId,
  CommercialDeliveryStatus,
} from "./commercial-delivery-flow.types";

export function useCommercialDeliveryFlow(input: {
  actorRole: CommercialDeliveryActorRole;
  injected?: CommercialDeliveryFlowInjected;
  enabled?: boolean;
  flags?: CommercialDeliveryFlowFlags;
  onStatusTransition?: (deliveryId: string, nextStatus: CommercialDeliveryStatus) => void;
}) {
  const { actorRole, injected, enabled = true, flags = {}, onStatusTransition } = input;
  const [activeDeliveryId, setActiveDeliveryId] = useState<string | null>(null);
  const [localDeliveries, setLocalDeliveries] = useState<import("./commercial-delivery-flow.types").CommercialDelivery[] | null>(null);

  const fallbackView = useMemo(
    () => (enabled ? mockCommercialDeliveryView(actorRole, flags) : null),
    [actorRole, enabled, flags],
  );

  const baseDeliveries = useMemo(() => {
    const fromInjected = injected?.view?.deliveries;
    if (fromInjected?.length) return fromInjected;
    return fallbackView?.deliveries ?? [];
  }, [injected?.view?.deliveries, fallbackView?.deliveries]);

  const deliveries = localDeliveries ?? baseDeliveries;

  const resolvedActiveId = useMemo(() => {
    if (activeDeliveryId && deliveries.some((d) => d.id === activeDeliveryId)) return activeDeliveryId;
    const injectedActive = injected?.view?.activeDeliveryId;
    if (injectedActive && deliveries.some((d) => d.id === injectedActive)) return injectedActive;
    return deliveries[0]?.id ?? null;
  }, [activeDeliveryId, injected?.view?.activeDeliveryId, deliveries]);

  const activeDelivery = useMemo(
    () => deliveries.find((d) => d.id === resolvedActiveId) ?? null,
    [deliveries, resolvedActiveId],
  );

  const timeline = useMemo(
    () => (activeDelivery ? buildDeliveryTimeline(activeDelivery, flags) : []),
    [activeDelivery, flags],
  );

  const activePanel = useMemo(() => {
    if (activeDelivery) return resolveActiveDeliveryPanel(activeDelivery, actorRole);
    return "status";
  }, [activeDelivery, actorRole]);

  const selectDelivery = useCallback((id: string) => {
    setActiveDeliveryId(id);
  }, []);

  const applyQuickAction = useCallback(
    (actionId: CommercialDeliveryQuickActionId) => {
      if (!activeDelivery) return;
      const next = nextStatusForDeliveryAction(actionId, activeDelivery.status);
      if (!next) return;
      setLocalDeliveries((prev) => {
        const list = prev ?? baseDeliveries;
        return list.map((d) => (d.id === activeDelivery.id ? { ...d, status: next } : d));
      });
      onStatusTransition?.(activeDelivery.id, next);
    },
    [activeDelivery, baseDeliveries, onStatusTransition],
  );

  return {
    deliveries,
    activeDelivery,
    activeDeliveryId: resolvedActiveId,
    selectDelivery,
    activePanel,
    timeline,
    loading: injected?.loading ?? false,
    error: injected?.error ?? null,
    dataSource: injected?.dataSource ?? "fallback",
    fallbackUsed: injected?.fallbackUsed ?? true,
    onRefresh: injected?.onRefresh,
    applyQuickAction,
    isTerrain: actorRole === "grossiste_b" || actorRole === "detaillant",
    isFormal: actorRole === "producteur" || actorRole === "grossiste_a",
  };
}
