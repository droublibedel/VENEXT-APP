"use client";

import Link from "next/link";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useIndustrialUiStore } from "@/state/ui-store";

const telemetryPreview = [
  { t: "T-4", load: 42 },
  { t: "T-3", load: 48 },
  { t: "T-2", load: 51 },
  { t: "T-1", load: 47 },
  { t: "Now", load: 53 },
];

export default function IndustrialHome() {
  const { selectedPoleId, setPole } = useIndustrialUiStore();
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-vxxl px-vxlg py-vxxl">
      <header className="flex flex-col gap-vxsm">
        <p className="text-xs uppercase tracking-wide text-vx-signal">
          Industrial pole
        </p>
        <h1 className="text-3xl font-semibold text-vx-ink">
          Operational intelligence
        </h1>
        <p className="max-w-2xl text-sm text-vx-ink/80">
          Mapbox GL hosts geospatial layers for sites and corridors; Recharts
          handles dense telemetry; D3 remains available for bespoke overlays where
          chart primitives are insufficient.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Link
            href="/producer-industrial"
            className="inline-flex w-fit items-center gap-2 rounded-md border border-emerald-700/30 bg-emerald-600/5 px-3 py-2 text-sm font-medium text-vx-ink hover:border-emerald-600/50 hover:bg-emerald-600/10"
          >
            Cockpit producteur industriel →
          </Link>
          <Link
            href="/poles"
            className="inline-flex w-fit items-center gap-2 rounded-md border border-vx-signal/30 bg-vx-signal/5 px-3 py-2 text-sm font-medium text-vx-ink hover:border-vx-signal/60 hover:bg-vx-signal/10"
          >
            Enter industrial pole cockpits →
          </Link>
          <Link
            href="/product-intelligence"
            className="inline-flex w-fit items-center gap-2 rounded-md border border-vx-trust/30 bg-vx-trust/5 px-3 py-2 text-sm font-medium text-vx-ink hover:border-vx-trust/60 hover:bg-vx-trust/10"
          >
            Living commerce catalogue →
          </Link>
          <Link
            href="/commerce-messaging"
            className="inline-flex w-fit items-center gap-2 rounded-md border border-vx-ink/10 bg-vx-ink/5 px-3 py-2 text-sm font-medium text-vx-ink hover:border-vx-signal/40 hover:bg-vx-signal/5"
          >
            Commerce messaging →
          </Link>
          <Link
            href="/wallet"
            className="inline-flex w-fit items-center gap-2 rounded-md border border-vx-trust/20 bg-vx-trust/5 px-3 py-2 text-sm font-medium text-vx-ink hover:border-vx-trust/50 hover:bg-vx-trust/10"
          >
            Operational wallet →
          </Link>
          <Link
            href="/relational-network"
            className="inline-flex w-fit items-center gap-2 rounded-md border border-emerald-700/25 bg-emerald-600/5 px-3 py-2 text-sm font-medium text-vx-ink hover:border-emerald-600/50 hover:bg-emerald-600/10"
          >
            Closed relational network →
          </Link>
        </div>
      </header>

      <section className="grid gap-vxlg md:grid-cols-2">
        <div className="rounded-xl border border-black/5 bg-white p-vxlg shadow-sm">
          <div className="mb-vxmd flex items-center justify-between">
            <h2 className="text-sm font-semibold">Pole selection</h2>
            <button
              type="button"
              className="text-xs text-vx-signal underline-offset-2 hover:underline"
              onClick={() =>
                setPole(selectedPoleId ? null : "pole-demo-west-africa")
              }
            >
              {selectedPoleId ? "Clear" : "Simulate bind"}
            </button>
          </div>
          <p className="text-xs text-vx-ink/70">
            {selectedPoleId
              ? `Bound to ${selectedPoleId}`
              : "No pole bound — Mapbox container mounts here with tenant style URL."}
          </p>
          <div className="mt-vxmd h-48 rounded-vxsm bg-gradient-to-br from-vx-signal/10 to-vx-trust/10" />
        </div>

        <div className="rounded-xl border border-black/5 bg-white p-vxlg shadow-sm">
          <h2 className="mb-vxmd text-sm font-semibold">Throughput signal</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={telemetryPreview}>
                <XAxis dataKey="t" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="load"
                  stroke="#1c6bff"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </main>
  );
}
