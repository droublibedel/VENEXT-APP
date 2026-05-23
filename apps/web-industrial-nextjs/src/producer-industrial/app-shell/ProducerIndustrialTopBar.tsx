"use client";

import Link from "next/link";

import { PRODUCER_DEMO_ORGANIZATION_ID } from "../mocks/industrial-mock-data";
import { PRODUCER_POLE_NAV } from "../navigation/producer-navigation.config";
import type { ProducerPoleId } from "../navigation/producer-navigation.config";

export function ProducerIndustrialTopBar(props: {
  activePole: ProducerPoleId;
  onMenuToggle?: () => void;
}) {
  const { activePole, onMenuToggle } = props;
  const pole = PRODUCER_POLE_NAV.find((p) => p.id === activePole);

  return (
    <header
      className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-800/80 bg-[#0a0c10]/95 px-4 py-3 backdrop-blur"
      data-testid="producer-topbar"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-400 lg:hidden"
          onClick={onMenuToggle}
          aria-label="Menu navigation"
          data-testid="producer-mobile-menu"
        >
          Menu
        </button>
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-emerald-400/80">Producteur industriel</p>
          <h1 className="text-sm font-semibold text-slate-100">{pole?.label ?? "Cockpit"}</h1>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="hidden font-mono text-[10px] text-slate-600 sm:inline">{PRODUCER_DEMO_ORGANIZATION_ID.slice(0, 8)}…</span>
        <Link
          href="/poles"
          className="rounded border border-slate-700/80 px-2 py-1 text-[10px] text-slate-400 hover:border-emerald-500/40 hover:text-emerald-300"
        >
          Pôles techniques
        </Link>
        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-400">Réseau live</span>
      </div>
    </header>
  );
}
