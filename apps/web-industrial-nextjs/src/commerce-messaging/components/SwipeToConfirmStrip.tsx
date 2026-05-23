"use client";

import { useCallback, useRef, useState, type PointerEvent } from "react";

type Props = {
  disabled?: boolean;
  onConfirm: () => void | Promise<void>;
  label?: string;
};

/**
 * Minimal tactile gesture — not an ERP modal; confirms human intent only (Instruction 20.1).
 */
export function SwipeToConfirmStrip(props: Props) {
  const { disabled, onConfirm, label = "Glisser vers la droite pour confirmer le brouillon" } = props;
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [dragX, setDragX] = useState(0);
  const startX = useRef(0);

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (disabled) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    startX.current = e.clientX - dragX;
  };

  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    if (disabled) return;
    const w = trackRef.current?.clientWidth ?? 200;
    const max = Math.max(40, w - 56);
    const x = Math.min(Math.max(0, e.clientX - startX.current), max);
    setDragX(x);
  };

  const finish = useCallback(async () => {
    const w = trackRef.current?.clientWidth ?? 200;
    const threshold = w * 0.55;
    if (dragX >= threshold) {
      await onConfirm();
    }
    setDragX(0);
  }, [dragX, onConfirm]);

  return (
    <div
      ref={trackRef}
      className="relative mt-2 h-10 overflow-hidden rounded-full border border-emerald-900/50 bg-emerald-950/25"
      data-testid="swipe-to-confirm-strip"
    >
      <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-[9px] text-emerald-100/80">
        {label}
      </p>
      <button
        type="button"
        disabled={disabled}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => void finish()}
        onPointerCancel={() => setDragX(0)}
        className="absolute left-0 top-0 z-10 flex h-10 w-14 items-center justify-center rounded-full bg-emerald-600/90 text-[10px] font-semibold text-white shadow touch-pan-y disabled:opacity-40"
        style={{ transform: `translateX(${dragX}px)` }}
        aria-label={label}
      >
        →
      </button>
    </div>
  );
}
