"use client";

import type { IndustrialSituationRoomBundle } from "@venext/shared-contracts";

export function IndustrialSituationRoomWorkspace({
  bundle,
  loading,
  error,
}: {
  bundle: IndustrialSituationRoomBundle | null;
  loading: boolean;
  error: string | null;
}) {
  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="rounded border border-amber-900/50 bg-amber-950/25 px-3 py-2 text-[10px] text-amber-100/90">
        <span className="font-semibold uppercase tracking-wide">Lecture seule · projection symbolique</span>
        <p className="mt-1 text-[10px] text-amber-200/85">
          Aucun assistant conversationnel, aucun orchestrateur d’exécution, aucune mutation métier. Cellules et missions sont
          analytiques et non opérationnelles.
        </p>
      </div>
      <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500">
        {loading ? "chargement bundle summary" : ""}
        {error ? ` · ${error}` : ""}
      </div>
      {!bundle ? (
        <p className="text-xs text-slate-500">Bundle situation room indisponible.</p>
      ) : (
        <>
          <section className="rounded border border-slate-800 bg-slate-950/80 p-3 text-xs text-slate-200">
            <h2 className="text-sm font-semibold text-slate-100">Digest economic command (amont)</h2>
            <p className="mt-1 text-[11px] text-slate-300">{bundle.snapshot.economicCommandDigest.headline}</p>
            <p className="mt-2 text-[10px] text-slate-500">
              Stress global proxy {bundle.snapshot.economicCommandDigest.globalStress.toFixed(2)} · zones{" "}
              {bundle.snapshot.economicCommandDigest.pressureZoneCount} · risques {bundle.snapshot.economicCommandDigest.riskCount}{" "}
              · arbitrages {bundle.snapshot.economicCommandDigest.arbitrationCount}
            </p>
            <p className="mt-2 text-[10px] text-slate-500">
              Compose plan (étapes logiques): propagation {bundle.diagnostics.composePlan.propagationCompose} · coordination{" "}
              {bundle.diagnostics.composePlan.coordinationCompose} · scénarios {bundle.diagnostics.composePlan.scenariosCompose} ·
              mémoire {bundle.diagnostics.composePlan.memoryCompose} · DI {bundle.diagnostics.composePlan.dataIntelligenceCompose}{" "}
              · command {bundle.diagnostics.composePlan.commandCompose} · synthèse situation {bundle.diagnostics.composePlan.situationRoomSynthesis}{" "}
              — {bundle.diagnostics.composeCountMeaning}
            </p>
            <p className="mt-1 text-[10px] italic text-slate-500">{bundle.disclaimer}</p>
          </section>
          <section className="rounded border border-cyan-900/40 bg-slate-950/70 p-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-cyan-200/90">Cellules de situation</h3>
            <ul className="mt-2 flex flex-col gap-1.5">
              {bundle.situationCells.map((c) => (
                <li key={c.cellId} className="rounded border border-slate-800/80 bg-black/40 px-2 py-1.5 text-[11px] text-slate-200">
                  <span className="font-mono text-[9px] text-slate-500">{c.cellType}</span>
                  <span className="ml-2 font-medium text-cyan-100/90">urgence {c.urgency.toFixed(2)}</span>
                  <p className="mt-0.5 text-[10px] text-slate-400">{c.explanation}</p>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded border border-violet-900/40 bg-slate-950/70 p-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-violet-200/90">Missions symboliques</h3>
            <ul className="mt-2 flex flex-col gap-1.5">
              {bundle.operationalMissions.map((m) => (
                <li key={m.missionCode} className="rounded border border-slate-800/80 bg-black/40 px-2 py-1.5 text-[11px] text-slate-200">
                  <span className="font-mono text-[9px] text-slate-500">{m.missionType}</span>
                  <span className="ml-2 text-violet-100/90">{m.missionCode}</span>
                  <p className="mt-0.5 text-[10px] text-slate-400">{m.explanation}</p>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded border border-rose-900/35 bg-slate-950/70 p-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-rose-200/90">Dépendances critiques</h3>
            <ul className="mt-2 flex flex-col gap-1.5">
              {bundle.criticalDependencies.map((d) => (
                <li key={d.dependencyId} className="rounded border border-slate-800/80 bg-black/40 px-2 py-1.5 text-[11px] text-slate-200">
                  <span className="font-mono text-[9px] text-slate-500">{d.kind}</span>
                  <span className="ml-2">fragilité {d.fragility.toFixed(2)}</span>
                  <p className="mt-0.5 text-[10px] text-slate-400">{d.explanation}</p>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded border border-amber-900/40 bg-slate-950/70 p-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-amber-200/90">Attention exécutive</h3>
            <ul className="mt-2 flex flex-col gap-1.5">
              {bundle.executiveAttention.map((a) => (
                <li key={a.attentionId} className="rounded border border-slate-800/80 bg-black/40 px-2 py-1.5 text-[11px] text-slate-200">
                  <span className="font-mono text-[9px] text-slate-500">{a.kind}</span>
                  <span className="ml-2">intensité {a.intensity.toFixed(2)}</span>
                  <p className="mt-0.5 text-[10px] text-slate-400">{a.explanation}</p>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded border border-slate-700/90 bg-black/50 p-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-200">Briefings</h3>
            <div className="mt-2 grid gap-2 md:grid-cols-3">
              <div>
                <p className="text-[9px] uppercase text-slate-500">Exécutif</p>
                <ol className="list-decimal pl-4 text-[11px] text-slate-200">
                  {bundle.briefings.executiveLines.map((l, i) => (
                    <li key={i}>{l}</li>
                  ))}
                </ol>
              </div>
              <div>
                <p className="text-[9px] uppercase text-slate-500">Opérationnel</p>
                <ol className="list-decimal pl-4 text-[11px] text-slate-200">
                  {bundle.briefings.operationalLines.map((l, i) => (
                    <li key={i}>{l}</li>
                  ))}
                </ol>
              </div>
              <div>
                <p className="text-[9px] uppercase text-slate-500">Stabilisation</p>
                <ol className="list-decimal pl-4 text-[11px] text-slate-200">
                  {bundle.briefings.stabilizationLines.map((l, i) => (
                    <li key={i}>{l}</li>
                  ))}
                </ol>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
