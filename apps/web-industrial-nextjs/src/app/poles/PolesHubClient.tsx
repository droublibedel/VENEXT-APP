"use client";

import Link from "next/link";

import { useIndustrialFeatureFlags } from "@/poles/hooks/useIndustrialFeatureFlags";
import { POLE_REGISTRY } from "@/poles/registry";
import { VenextInlineSkeleton } from "@/ux/VenextInlineSkeleton";

/** Pole hub — kinetic entry tiles; gated by industrial_poles_enabled (Instruction 5A). */
export function PolesHubClient() {
  const { flags, hydrated } = useIndustrialFeatureFlags();

  if (!hydrated) {
    return (
      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
        <VenextInlineSkeleton variant="pole" />
      </main>
    );
  }

  if (flags.industrial_poles_enabled === false) {
    return (
      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
        <header className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-cyan-300/90">
            Industrial pole system
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-50">
            Pôles industriels
          </h1>
        </header>
        <div className="rounded-lg border border-slate-800/90 bg-slate-950/90 px-4 py-6 text-sm text-slate-300">
          Les pôles industriels sont désactivés pour cette organisation.
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
      <header className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-cyan-300/90">
          Industrial pole system
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-50">
          Operational intelligence cockpits
        </h1>
        <p className="max-w-2xl text-sm text-slate-400">
          Each pole is a command surface: context header, intelligence canvas, action rail, and
          live signal stream — not sidebar + CRUD tables.
        </p>
      </header>
      <ul className="grid gap-3 sm:grid-cols-2">
        {POLE_REGISTRY.map((p) => (
          <li key={p.slug}>
            <Link
              href={`/poles/${p.slug}`}
              className="group flex flex-col gap-2 rounded-lg border border-slate-800/90 bg-gradient-to-br from-slate-950 to-slate-900 px-4 py-4 transition hover:border-cyan-500/40 hover:shadow-[0_0_28px_rgba(34,211,238,0.12)]"
            >
              <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                {p.poleChannel.replace(/_/g, " ")}
              </span>
              <span className="text-lg font-semibold text-slate-50 group-hover:text-cyan-50">
                {p.title}
              </span>
              <span className="text-xs text-slate-400">{p.subtitle}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
