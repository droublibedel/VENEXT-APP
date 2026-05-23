import { useCallback, useMemo, useState } from "react";

import { nextStatusForAction, resolveActivePanel } from "./relational-order-governance";
import { mockRelationalOrderView } from "./relational-order.viewmodel";
import type {
  OrderLifecycleStatus,
  RelationalCommercialOrder,
  RelationalOrderActorRole,
  RelationalOrderOrchestrationFlags,
  RelationalOrderOrchestrationInjected,
  RelationalOrderPanelId,
  RelationalOrderQuickActionId,
} from "./relational-order-orchestration.types";
import { buildOrderTimeline } from "./relational-order-timeline";

export function useRelationalOrderOrchestration(input: {
  actorRole: RelationalOrderActorRole;
  injected?: RelationalOrderOrchestrationInjected;
  enabled?: boolean;
  flags?: RelationalOrderOrchestrationFlags;
  onStatusTransition?: (orderId: string, nextStatus: OrderLifecycleStatus) => void;
}) {
  const { actorRole, injected, enabled = true, flags = {}, onStatusTransition } = input;
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<RelationalOrderPanelId>("status");
  const [localOrders, setLocalOrders] = useState<RelationalCommercialOrder[] | null>(null);

  const fallbackView = useMemo(
    () => (enabled ? mockRelationalOrderView(actorRole, flags) : null),
    [actorRole, enabled, flags],
  );

  const baseOrders = useMemo(() => {
    const fromInjected = injected?.view?.orders;
    if (fromInjected?.length) return fromInjected;
    return fallbackView?.orders ?? [];
  }, [injected?.view?.orders, fallbackView?.orders]);

  const orders = localOrders ?? baseOrders;

  const resolvedActiveId = useMemo(() => {
    if (activeOrderId && orders.some((o) => o.id === activeOrderId)) return activeOrderId;
    const injectedActive = injected?.view?.activeOrderId;
    if (injectedActive && orders.some((o) => o.id === injectedActive)) return injectedActive;
    return orders[0]?.id ?? null;
  }, [activeOrderId, injected?.view?.activeOrderId, orders]);

  const activeOrder = useMemo(
    () => orders.find((o) => o.id === resolvedActiveId) ?? null,
    [orders, resolvedActiveId],
  );

  const timeline = useMemo(
    () => (activeOrder ? buildOrderTimeline(activeOrder, flags) : []),
    [activeOrder, flags],
  );

  const resolvedPanel = useMemo(() => {
    if (activeOrder) return resolveActivePanel(activeOrder, actorRole) as RelationalOrderPanelId;
    return activePanel;
  }, [activeOrder, actorRole, activePanel]);

  const selectOrder = useCallback((orderId: string) => {
    setActiveOrderId(orderId);
    setActivePanel("status");
  }, []);

  const applyQuickAction = useCallback(
    (actionId: RelationalOrderQuickActionId) => {
      if (!activeOrder) return;
      const next = nextStatusForAction(actionId, activeOrder.status);
      if (!next) return;
      setLocalOrders((prev) => {
        const list = prev ?? baseOrders;
        return list.map((o) => (o.id === activeOrder.id ? { ...o, status: next } : o));
      });
      onStatusTransition?.(activeOrder.id, next);
    },
    [activeOrder, baseOrders, onStatusTransition],
  );

  return {
    orders,
    activeOrder,
    activeOrderId: resolvedActiveId,
    selectOrder,
    activePanel: resolvedPanel,
    setActivePanel,
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
