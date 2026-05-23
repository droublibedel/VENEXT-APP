"use client";

import { useEffect, useState } from "react";

type Props = {
  collapsed: boolean;
  onToggle: () => void;
  /** venext:// or data URL text for lightweight QR libs later */
  uri: string;
  label?: string;
};

/**
 * Strategic QR layer — commerce identity, not a banking receipt (Instruction 8 §5).
 */
export function DynamicQrOverlay({ collapsed, onToggle, uri, label }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 transition-transform duration-300 ease-out ${
        collapsed ? "translate-y-[calc(100%-3.25rem)]" : "translate-y-0"
      }`}
      style={{ willChange: "transform" }}
    >
      <div className="mx-auto max-w-lg px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-center justify-between rounded-t-lg border border-cyan-800/60 bg-slate-950/95 px-3 py-2 text-left text-[11px] font-medium text-cyan-50 backdrop-blur-sm"
        >
          <span>{label ?? "QR commerce — interaction rapide"}</span>
          <span className="font-mono text-cyan-300/80">{collapsed ? "▲" : "▼"}</span>
        </button>
        {!collapsed ? (
          <div className="space-y-2 rounded-b-lg border border-t-0 border-cyan-900/40 bg-black/80 px-3 py-3 text-[11px] text-slate-200 backdrop-blur-sm">
            <p className="text-[9px] uppercase tracking-wide text-slate-500">
              Rendu léger · 2G/3G — remplacer par canvas QR si besoin
            </p>
            <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-md border border-dashed border-cyan-700/50 bg-slate-900/80 font-mono text-[8px] leading-tight text-cyan-100/90">
              {mounted ? uri.slice(0, 220) : "…"}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
