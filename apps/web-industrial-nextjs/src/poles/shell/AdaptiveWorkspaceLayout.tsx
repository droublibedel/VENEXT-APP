"use client";

import type { ReactNode } from "react";

type Props = {
  contextHeader: ReactNode;
  canvas: ReactNode;
  actionRail: ReactNode;
  signalStream: ReactNode;
  lowAnimation: boolean;
};

/**
 * Adaptive operational workspace — A/B/C/D (Instruction 5 §2).
 * Not sidebar + ERP tables: vertical command stack + canvas-first.
 */
export function AdaptiveWorkspaceLayout({
  contextHeader,
  canvas,
  actionRail,
  signalStream,
  lowAnimation: _lowAnimation,
}: Props) {
  return (
    <div
      className={`flex min-h-[calc(100dvh-0px)] flex-col bg-slate-950 text-slate-100 ${_lowAnimation ? "motion-reduce:scroll-auto" : ""}`}
    >
      {contextHeader}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 px-2 pb-2 md:grid-cols-[1fr_220px] md:gap-3 md:px-3">
        <div className="min-h-[320px] min-w-0 md:min-h-0">{canvas}</div>
        <div className="min-h-0 md:max-h-none">{actionRail}</div>
      </div>
      {signalStream}
    </div>
  );
}
