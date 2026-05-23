"use client";

import { memo, useCallback, useMemo, useRef, useState } from "react";

import { humanStatusLabel } from "./relational-order-governance";
import type { RelationalCommercialOrder } from "./relational-order-orchestration.types";

const ROW_HEIGHT = 72;
const OVERSCAN = 3;

function RelationalOrderListVirtualInner({
  orders,
  activeOrderId,
  onSelect,
  terrainMode = false,
}: {
  orders: RelationalCommercialOrder[];
  activeOrderId: string | null;
  onSelect: (id: string) => void;
  terrainMode?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(320);

  const onScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    setScrollTop(el.scrollTop);
    setViewportHeight(el.clientHeight);
  }, []);

  const { start, end, totalHeight } = useMemo(() => {
    const startIdx = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
    const visible = Math.ceil(viewportHeight / ROW_HEIGHT) + OVERSCAN * 2;
    const endIdx = Math.min(orders.length, startIdx + visible);
    return {
      start: startIdx,
      end: endIdx,
      totalHeight: orders.length * ROW_HEIGHT,
    };
  }, [scrollTop, viewportHeight, orders.length]);

  const visible = orders.slice(start, end);

  return (
    <div
      ref={containerRef}
      className="roo-order-list-virtual"
      data-testid="roo-order-list-virtual"
      onScroll={onScroll}
      style={{ maxHeight: terrainMode ? 200 : 280, overflow: "auto" }}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        {visible.map((order, i) => {
          const idx = start + i;
          return (
            <button
              key={order.id}
              type="button"
              className={`roo-order-row${activeOrderId === order.id ? " roo-order-row--active" : ""}`}
              data-testid={`roo-order-row-${order.id}`}
              style={{
                position: "absolute",
                top: idx * ROW_HEIGHT,
                left: 0,
                right: 0,
                height: ROW_HEIGHT - 8,
              }}
              onClick={() => onSelect(order.id)}
            >
              <span className="roo-order-row-partner">{order.partner.displayName}</span>
              <span className="roo-order-row-status">{humanStatusLabel(order.status)}</span>
              <span className="roo-order-row-amount">{order.amountLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const RelationalOrderListVirtual = memo(RelationalOrderListVirtualInner);
