"use client";

import type { ProducerPoleId } from "./producer-navigation.config";
import { PRODUCER_POLE_NAV } from "./producer-navigation.config";

export function ProducerPoleNav(props: {
  activePole: ProducerPoleId;
  onSelect: (id: ProducerPoleId) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}) {
  const { activePole, onSelect, mobileOpen, onMobileClose } = props;

  return (
    <nav
      className="producer-industrial-sidebar flex h-full w-56 flex-col border-r border-slate-800/80 bg-[#080a0d] lg:relative lg:translate-x-0"
      data-open={mobileOpen ? "true" : "false"}
      data-testid="producer-pole-nav"
      aria-label="Navigation producteur"
    >
      <div className="border-b border-slate-800/80 px-4 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-emerald-400/90">VENEXT</p>
        <p className="text-sm font-semibold text-slate-100">Cockpit producteur</p>
      </div>
      <ul className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
        {PRODUCER_POLE_NAV.map((pole) => {
          const active = pole.id === activePole;
          return (
            <li key={pole.id}>
              <button
                type="button"
                className={`flex w-full items-start gap-2 rounded-md px-3 py-2.5 text-left transition-colors ${
                  active ? "producer-industrial-nav-active text-slate-50" : "text-slate-400 hover:bg-slate-900/80 hover:text-slate-200"
                }`}
                onClick={() => {
                  onSelect(pole.id);
                  onMobileClose?.();
                }}
                data-testid={`producer-nav-${pole.id}`}
                aria-current={active ? "page" : undefined}
              >
                {pole.icon === "network" ? (
                  <svg
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500/80"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden
                  >
                    <circle cx="4" cy="8" r="1.5" fill="currentColor" />
                    <circle cx="12" cy="4" r="1.5" fill="currentColor" />
                    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                    <path d="M5 7.5 L11 4.5 M5 8.5 L11 11.5" stroke="currentColor" strokeWidth="1" />
                  </svg>
                ) : pole.icon === "fulfillment" ? (
                  <svg
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500/80"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden
                  >
                    <rect x="2" y="5" width="10" height="7" rx="1" stroke="currentColor" strokeWidth="1" />
                    <path d="M4 5 V3.5 H10 V5 M12 7 H14" stroke="currentColor" strokeWidth="1" />
                  </svg>
                ) : pole.icon === "catalog" ? (
                  <svg
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500/80"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden
                  >
                    <path d="M3 4 H13 V12 H3 Z" stroke="currentColor" strokeWidth="1" />
                    <path d="M3 6 H13 M6 4 V12" stroke="currentColor" strokeWidth="1" />
                  </svg>
                ) : pole.icon === "territory" ? (
                  <svg
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500/80"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden
                  >
                    <path d="M2 12 L6 4 L10 8 L14 3" stroke="currentColor" strokeWidth="1" />
                    <circle cx="6" cy="4" r="1" fill="currentColor" />
                    <circle cx="10" cy="8" r="1" fill="currentColor" />
                    <circle cx="14" cy="3" r="1" fill="currentColor" />
                  </svg>
                ) : pole.icon === "activation" ? (
                  <svg
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500/80"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden
                  >
                    <path d="M3 10 V6 H6 L10 3 L13 6 V10 H10 L6 13 Z" stroke="currentColor" strokeWidth="1" />
                    <path d="M8 6 V10" stroke="currentColor" strokeWidth="1" />
                  </svg>
                ) : pole.icon === "supply" ? (
                  <svg
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500/80"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden
                  >
                    <rect x="2" y="6" width="9" height="5" rx="1" stroke="currentColor" strokeWidth="1" />
                    <path d="M11 8 H14 M12 6 V10" stroke="currentColor" strokeWidth="1" />
                    <circle cx="4.5" cy="11.5" r="1" fill="currentColor" />
                    <circle cx="9" cy="11.5" r="1" fill="currentColor" />
                  </svg>
                ) : pole.icon === "finance" ? (
                  <svg
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500/80"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden
                  >
                    <path d="M3 11 V5 H8 L11 3 L13 5 V11 H3 Z" stroke="currentColor" strokeWidth="1" />
                    <path d="M6 8 H10" stroke="currentColor" strokeWidth="1" />
                  </svg>
                ) : pole.icon === "intelligence" ? (
                  <svg
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500/80"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden
                  >
                    <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1" opacity="0.6" />
                    <circle cx="8" cy="8" r="1.5" fill="currentColor" />
                    <path d="M8 3 V5 M8 11 V13 M3 8 H5 M11 8 H13" stroke="currentColor" strokeWidth="1" opacity="0.5" />
                  </svg>
                ) : null}
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-medium">{pole.shortLabel}</span>
                  <span className="mt-0.5 block text-[10px] text-slate-500">{pole.label}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="border-t border-slate-800/80 p-3 text-[10px] text-slate-600">
        Instruction 20.54 · Data & intelligence
      </div>
    </nav>
  );
}
