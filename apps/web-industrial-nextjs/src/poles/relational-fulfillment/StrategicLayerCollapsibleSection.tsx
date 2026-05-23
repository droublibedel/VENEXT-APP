"use client";

import { useState, type ReactNode } from "react";

export function StrategicLayerCollapsibleSection(props: {
  sectionId: string;
  title: string;
  subtitle: string;
  layerCount: number;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const { sectionId, title, subtitle, layerCount, defaultOpen = false, children } = props;
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section
      className="rounded border border-slate-800/80 bg-slate-950/60"
      data-testid={`strategic-layer-section-${sectionId}`}
      data-expanded={open ? "true" : "false"}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        data-testid={`strategic-layer-section-toggle-${sectionId}`}
      >
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-violet-200/90">{title}</p>
          <p className="mt-0.5 text-[10px] text-slate-500">{subtitle}</p>
        </div>
        <span className="shrink-0 font-mono text-[9px] text-slate-500">
          {layerCount} panneaux · {open ? "replier" : "déplier"}
        </span>
      </button>
      {open ? <div className="flex flex-col gap-3 border-t border-slate-800/60 px-1 py-2">{children}</div> : null}
    </section>
  );
}
