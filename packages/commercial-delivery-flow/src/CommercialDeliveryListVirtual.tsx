"use client";

import { memo, useCallback, useMemo, useRef, useState } from "react";

import { humanDeliveryStatusLabel } from "./commercial-delivery-governance";
import type { CommercialDelivery } from "./commercial-delivery-flow.types";

const ROW = 68;
const OVERSCAN = 3;

function CommercialDeliveryListVirtualInner({
  deliveries,
  activeId,
  onSelect,
  compact = false,
}: {
  deliveries: CommercialDelivery[];
  activeId: string | null;
  onSelect: (id: string) => void;
  compact?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [vh, setVh] = useState(280);

  const onScroll = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setScrollTop(el.scrollTop);
    setVh(el.clientHeight);
  }, []);

  const { start, end, total } = useMemo(() => {
    const s = Math.max(0, Math.floor(scrollTop / ROW) - OVERSCAN);
    const vis = Math.ceil(vh / ROW) + OVERSCAN * 2;
    return { start: s, end: Math.min(deliveries.length, s + vis), total: deliveries.length * ROW };
  }, [scrollTop, vh, deliveries.length]);

  const slice = deliveries.slice(start, end);

  return (
    <div
      ref={ref}
      className="cdf-list-virtual"
      data-testid="cdf-delivery-list-virtual"
      onScroll={onScroll}
      style={{ maxHeight: compact ? 180 : 240, overflow: "auto" }}
    >
      <div style={{ height: total, position: "relative" }}>
        {slice.map((d, i) => {
          const idx = start + i;
          return (
            <button
              key={d.id}
              type="button"
              className={`cdf-delivery-row${activeId === d.id ? " cdf-delivery-row--active" : ""}`}
              data-testid={`cdf-delivery-row-${d.id}`}
              style={{ position: "absolute", top: idx * ROW, left: 0, right: 0, height: ROW - 6 }}
              onClick={() => onSelect(d.id)}
            >
              <span>{d.partner.displayName}</span>
              <span>{humanDeliveryStatusLabel(d.status)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const CommercialDeliveryListVirtual = memo(CommercialDeliveryListVirtualInner);
