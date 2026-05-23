"use client";

import type { IndustrialOperationalContinuityBundle } from "@venext/shared-contracts";

export function IndustrialOperationalContinuityWorkspace({
  bundle,
  loading,
  error,
}: {
  bundle: IndustrialOperationalContinuityBundle | null;
  loading: boolean;
  error: string | null;
}) {
  return (
    <div className="flex flex-col gap-3 p-4">
      <div
        data-testid="ioc-continuity-lens-positioning"
        className="rounded border border-slate-800/80 bg-slate-950/50 px-3 py-2 text-[11px] text-slate-300"
      >
        Vue continuité — synthèse dérivée de la Situation Room, non source opérationnelle primaire.
      </div>
      <div className="rounded border border-emerald-900/45 bg-emerald-950/20 px-3 py-2 text-[10px] text-emerald-100/90">
        <span className="font-semibold uppercase tracking-wide">Lecture seule · continuité symbolique</span>
        <p className="mt-1 text-[10px] text-emerald-200/85">
          Aucun ordonnanceur, aucun APS, aucun workflow ERP, aucune exécution métier. États, pressions et corridors sont
          dérivés des bundles situation room / command en projection déterministe.
        </p>
      </div>
      <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500">
        {loading ? "chargement bundle summary" : error ? "erreur chargement bundle" : ""}
      </div>
      {error && !bundle && !loading ? (
        <p data-testid="ioc-degraded-unavailable" className="text-xs text-amber-200/90">
          Mode dégradé indisponible — recharger le bundle de continuité.
        </p>
      ) : null}
      {!bundle ? (
        <p className="text-xs text-slate-500">Bundle continuité opérationnelle indisponible.</p>
      ) : (
        <>
          {bundle.diagnostics.productRole ? (
            <p data-testid="ioc-diagnostics-product-role" className="text-[9px] font-mono text-slate-600">
              {bundle.diagnostics.productRole}
            </p>
          ) : null}
          <section className="rounded border border-slate-800 bg-slate-950/80 p-3 text-xs text-slate-200">
            <h2 className="text-sm font-semibold text-slate-100">Digest transverse</h2>
            <p className="mt-1 text-[11px] text-slate-300">
              Situation room · {bundle.snapshot.situationRoomDigest.situationCellCount} cellules · stress proxy{" "}
              {bundle.snapshot.situationRoomDigest.globalStressProxy.toFixed(2)}
            </p>
            <p className="mt-2 text-[10px] text-slate-500">
              Compose (étapes logiques): situation room {bundle.diagnostics.continuityComposePlan.situationRoomMaterialization}{" "}
              · synthèse continuité {bundle.diagnostics.continuityComposePlan.continuitySynthesis} · propagation{" "}
              {bundle.diagnostics.continuityComposePlan.propagationCompose} · coordination{" "}
              {bundle.diagnostics.continuityComposePlan.coordinationCompose} · scénarios{" "}
              {bundle.diagnostics.continuityComposePlan.scenariosCompose} · mémoire{" "}
              {bundle.diagnostics.continuityComposePlan.memoryCompose} · DI{" "}
              {bundle.diagnostics.continuityComposePlan.dataIntelligenceCompose} · command{" "}
              {bundle.diagnostics.continuityComposePlan.commandCompose} · synthèse situation{" "}
              {bundle.diagnostics.continuityComposePlan.situationRoomSynthesis} — {bundle.diagnostics.continuityComposeMeaning}
            </p>
            <p className="mt-1 text-[10px] italic text-slate-500">{bundle.disclaimer}</p>
          </section>
          <section className="rounded border border-cyan-900/40 bg-slate-950/70 p-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-cyan-200/90">États de stabilité</h3>
            <ul className="mt-2 flex flex-col gap-1.5">
              {bundle.stabilityStates.map((s) => (
                <li key={s.stateId} className="rounded border border-slate-800/80 bg-black/40 px-2 py-1.5 text-[11px] text-slate-200">
                  <span className="font-mono text-[9px] text-slate-500">{s.stateType}</span>
                  <span className="ml-2">score {s.continuityScore.toFixed(2)}</span>
                  <p className="mt-0.5 text-[10px] text-slate-400">{s.explanation}</p>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded border border-amber-900/35 bg-slate-950/70 p-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-amber-200/90">Pressions continuité</h3>
            <ul className="mt-2 flex flex-col gap-1.5">
              {bundle.continuityPressures.map((p) => (
                <li key={p.pressureId} className="rounded border border-slate-800/80 bg-black/40 px-2 py-1.5 text-[11px] text-slate-200">
                  <span className="font-mono text-[9px] text-slate-500">{p.kind}</span>
                  <span className="ml-2">intensité {p.intensity.toFixed(2)}</span>
                  <p className="mt-0.5 text-[10px] text-slate-400">{p.explanation}</p>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded border border-rose-900/35 bg-slate-950/70 p-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-rose-200/90">Corridors critiques</h3>
            <ul className="mt-2 flex flex-col gap-1.5">
              {bundle.continuityCorridors.map((c) => (
                <li key={c.corridorId} className="rounded border border-slate-800/80 bg-black/40 px-2 py-1.5 text-[11px] text-slate-200">
                  <span className="font-mono text-[9px] text-slate-500">{c.kind}</span>
                  <span className="ml-2">fragilité {c.fragility.toFixed(2)}</span>
                  <p className="mt-0.5 text-[10px] text-slate-400">{c.explanation}</p>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded border border-violet-900/35 bg-slate-950/70 p-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-violet-200/90">Cadence opérationnelle</h3>
            <ul className="mt-2 flex flex-col gap-1.5">
              {bundle.cadenceSignals.map((c) => (
                <li key={c.cadenceId} className="rounded border border-slate-800/80 bg-black/40 px-2 py-1.5 text-[11px] text-slate-200">
                  <span className="font-mono text-[9px] text-slate-500">{c.kind}</span>
                  <span className="ml-2">intensité {c.intensity.toFixed(2)}</span>
                  <p className="mt-0.5 text-[10px] text-slate-400">{c.explanation}</p>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded border border-slate-800 bg-black/50 p-2 text-[10px] text-slate-300">
            <h3 className="text-[11px] font-semibold text-slate-200">Briefings</h3>
            <p className="mt-1 font-medium text-slate-400">Exécutif</p>
            {bundle.briefings.executiveLines.map((l, i) => (
              <p key={`e${i}`} className="mt-0.5">
                {l}
              </p>
            ))}
            <p className="mt-2 font-medium text-slate-400">Opérationnel</p>
            {bundle.briefings.operationalLines.map((l, i) => (
              <p key={`o${i}`} className="mt-0.5">
                {l}
              </p>
            ))}
            <p className="mt-2 font-medium text-slate-400">Stabilisation</p>
            {bundle.briefings.stabilizationLines.map((l, i) => (
              <p key={`s${i}`} className="mt-0.5">
                {l}
              </p>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
