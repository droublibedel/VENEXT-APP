"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { RelationalStrategicMemoryDto, RelationalStrategicMemoryListDto, RelationalStrategicMemoryOverviewDto } from "@venext/shared-contracts";

import { fetchMemories, fetchMemoryOverview, reuseMemory } from "./memory-api";
import { MemoryOverviewSurface } from "./surfaces/MemoryOverviewSurface";
import { MemoryPatternSurface } from "./surfaces/MemoryPatternSurface";
import { MemoryRealtimeStrip } from "./surfaces/MemoryRealtimeStrip";
import { MemoryReuseSurface } from "./surfaces/MemoryReuseSurface";

export function RelationalStrategicMemoryPanel(props: {
  organizationId: string | null;
  relationshipId: string | null;
  memoryEnabled: boolean;
  realtimeEnabled: boolean;
  lastRealtimeEvent?: string | null;
}) {
  const { organizationId, relationshipId, memoryEnabled, realtimeEnabled, lastRealtimeEvent } = props;
  const [list, setList] = useState<RelationalStrategicMemoryListDto | null>(null);
  const [overview, setOverview] = useState<RelationalStrategicMemoryOverviewDto | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(() => {
    if (!organizationId || !relationshipId || !memoryEnabled) return;
    void fetchMemories(organizationId, relationshipId).then((r) => {
      if (r.ok) setList(r.data);
    });
    void fetchMemoryOverview(organizationId, relationshipId).then((r) => {
      if (r.ok) setOverview(r.data);
    });
  }, [organizationId, relationshipId, memoryEnabled]);

  useEffect(() => {
    reload();
  }, [reload]);

  const selected: RelationalStrategicMemoryDto | null = useMemo(() => {
    if (!list) return null;
    if (!selectedId) return list.memories[0] ?? null;
    return list.memories.find((m) => m.id === selectedId) ?? list.memories[0] ?? null;
  }, [list, selectedId]);

  useEffect(() => {
    if (list?.memories.length && !selectedId) setSelectedId(list.memories[0]!.id);
  }, [list, selectedId]);

  if (!memoryEnabled) {
    return (
      <p className="text-[9px] text-slate-500" data-testid="strategic-memory-disabled">
        Mémoire stratégique désactivée (<span className="font-mono">relational_strategic_memory_enabled</span>).
      </p>
    );
  }

  if (!relationshipId || !organizationId) {
    return (
      <p className="text-[9px] text-slate-500" data-testid="strategic-memory-missing-relationship">
        Corridor requis pour le registre de mémoire stratégique.
      </p>
    );
  }

  const onReuse = async () => {
    if (!selected || !organizationId) return;
    setBusy(true);
    const res = await reuseMemory(
      organizationId,
      selected.id,
      "Réutilisation analytique corridor — alignement orchestration/simulation.",
    );
    setBusy(false);
    if (res.ok) reload();
  };

  return (
    <section
      className="rounded border border-teal-900/40 bg-slate-950/80 p-3"
      data-testid="relational-strategic-memory-panel"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-teal-200/90">
        Mémoire stratégique corridor
      </p>
      <p className="mt-1 text-[9px] text-slate-500">
        Registre d&apos;apprentissage opérationnel explicable — historique décisionnel et patterns récurrents.
      </p>

      <div className="mt-3 rounded border border-slate-800 bg-slate-950/70 p-3">
        <MemoryOverviewSurface overview={overview} />
      </div>

      {list && list.memories.length > 1 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {list.memories.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelectedId(m.id)}
              className={`rounded border px-2 py-0.5 text-[8px] font-mono ${
                selected?.id === m.id
                  ? "border-teal-700/60 bg-teal-950/40 text-teal-200"
                  : "border-slate-800 text-slate-500"
              }`}
            >
              {m.memoryType.slice(0, 12)}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded border border-slate-800 bg-slate-950/70 p-3">
          <p className="text-[9px] font-medium text-slate-400">Patterns</p>
          <MemoryPatternSurface memories={list?.memories ?? []} />
        </div>
        <div className="rounded border border-cyan-900/30 bg-cyan-950/10 p-3">
          <p className="text-[9px] font-medium text-slate-400">Réutilisation</p>
          <MemoryReuseSurface selected={selected} busy={busy} onReuse={() => void onReuse()} />
        </div>
      </div>

      <MemoryRealtimeStrip realtimeEnabled={realtimeEnabled} lastEvent={lastRealtimeEvent ?? null} />
    </section>
  );
}
