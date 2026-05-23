"use client";

import type { ReactNode } from "react";
import { vx } from "./vx-styles";

export function OperationalStrip({
  label,
  children,
  tone = "neutral",
}: {
  label: string;
  children: ReactNode;
  tone?: "neutral" | "alert" | "ok";
}) {
  const border =
    tone === "alert" ? `1px solid ${vx.amber}55` : tone === "ok" ? `1px solid ${vx.mint}44` : `1px solid ${vx.line}`;
  const bg = tone === "alert" ? "rgba(255,193,7,0.06)" : "rgba(0,168,132,0.05)";
  return (
    <div className="rounded-md px-3 py-2" style={{ border, backgroundColor: tone === "neutral" ? "rgba(0,0,0,0.25)" : bg }}>
      <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/45">{label}</p>
      <div className="text-[12px] leading-snug text-white/85">{children}</div>
    </div>
  );
}
