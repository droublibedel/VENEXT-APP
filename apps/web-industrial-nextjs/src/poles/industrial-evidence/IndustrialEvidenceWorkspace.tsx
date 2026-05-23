"use client";

import type { ReactNode } from "react";

import { RegistryLegend } from "./RegistryLegend";
import { VenextInlineSkeleton } from "@/ux/VenextInlineSkeleton";

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded border border-slate-800 bg-slate-950/70 p-3">
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300">{title}</h3>
      <div className="text-[11px] leading-relaxed text-slate-400">{children}</div>
    </section>
  );
}

function ScopeBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded border border-slate-800/80 bg-black/30 px-2 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-300">{title}</p>
      <p className="mt-1 text-[11px] leading-snug text-slate-400">{text}</p>
    </div>
  );
}

type TrustRow = {
  matrixId?: string;
  scopeKey?: string;
  trustLevel?: string;
  trustReason?: string;
  classificationPath?: string[];
  derivedFromFlags?: Record<string, boolean>;
};

type SourceRow = {
  poleKey?: string;
  included?: boolean;
  sourceFreshness?: string;
  sourceReliability?: string;
  sourceCompleteness?: string;
  sourceAvailability?: string;
  skippedReason?: string;
};

export function IndustrialEvidenceWorkspace(props: {
  bundle: {
    policy?: string;
    disclaimer?: string;
    snapshot?: {
      headline?: string;
      records?: unknown[];
      trustMatrix?: unknown[];
      traces?: unknown[];
      limitations?: unknown[];
      sourceMap?: unknown[];
      diagnostics?: Record<string, unknown>;
      evidenceScope?: Record<string, string>;
      interpretationBoundary?: string;
      reliabilityBoundary?: string;
    };
  } | null;
  loading: boolean;
  error: string | null;
  degradedBundleMode: boolean;
  fallbackSource: string | null;
  fallbackReason: string | null;
}) {
  const { bundle, loading, error, degradedBundleMode, fallbackSource, fallbackReason } = props;

  if (loading) {
    return <VenextInlineSkeleton />;
  }
  if (error) {
    return (
      <p className="px-4 py-6 text-xs text-amber-200/90" data-testid="industrial-evidence-error">
        {error}
        {fallbackReason ? (
          <span className="mt-2 block font-mono text-[10px] text-slate-500">
            Mode dégradé: {fallbackReason}
            {fallbackSource ? ` · ${fallbackSource}` : ""}
          </span>
        ) : null}
      </p>
    );
  }
  if (!bundle?.snapshot) {
    return <p className="px-4 py-6 text-xs text-slate-500">Aucun agrégat disponible.</p>;
  }

  const snap = bundle.snapshot;
  const diag = snap.diagnostics ?? {};
  const scope = snap.evidenceScope ?? {};
  const trustMatrix = (snap.trustMatrix ?? []) as TrustRow[];
  const sourceMap = (snap.sourceMap ?? []) as SourceRow[];
  const limitations = snap.limitations ?? [];
  const traces = snap.traces ?? [];
  const excluded = sourceMap.filter((s) => !s.included);
  const symbolicSignals = (snap.records ?? []).filter((raw) => {
    const r = raw as Record<string, unknown>;
    return Boolean(r.symbolicProjection);
  });

  return (
    <div className="flex min-h-0 flex-col gap-3 overflow-auto px-3 py-3 pb-24">
      <RegistryLegend />

      {degradedBundleMode ? (
        <p className="rounded border border-amber-900/50 bg-amber-950/30 px-2 py-1.5 text-[10px] text-amber-100/90">
          Registre en <span className="font-mono">mode dégradé</span> — compose partiel ou agrégat incomplet. Aucun appel slice
          automatique (bundle-first).
        </p>
      ) : null}

      <header className="rounded border border-cyan-900/50 bg-slate-950/90 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-200/90">Registre industriel</p>
        <p className="mt-1 text-[12px] text-slate-200">{snap.headline}</p>
        <p className="mt-1 text-[10px] text-slate-500">
          Politique <span className="font-mono">{bundle.policy}</span> · vue{" "}
          <span className="font-mono">{String(diag.bundleViewSemantic ?? diag.projectionMode)}</span> · cache{" "}
          <span className="font-mono">{String(diag.composeCacheHit)}</span>
        </p>
        {bundle.disclaimer ? (
          <p className="mt-2 border-t border-slate-800/80 pt-2 text-[10px] leading-snug text-slate-500">{bundle.disclaimer}</p>
        ) : null}
      </header>

      <Panel title="Périmètre d’interprétation & fiabilité">
        <p className="mb-2 text-[11px] text-slate-300">{snap.interpretationBoundary}</p>
        <p className="text-[11px] text-slate-400">{snap.reliabilityBoundary}</p>
      </Panel>

      <Panel title="Evidence scope (what_is_*)">
        <div className="grid gap-2 md:grid-cols-2">
          <ScopeBlock title="Réel (matérialisation)" text={String(scope.what_is_real ?? "—")} />
          <ScopeBlock title="Heuristique" text={String(scope.what_is_heuristic ?? "—")} />
          <ScopeBlock title="Symbolique" text={String(scope.what_is_symbolic ?? "—")} />
          <ScopeBlock title="Démo" text={String(scope.what_is_demo ?? "—")} />
          <ScopeBlock title="Manquant" text={String(scope.what_is_missing ?? "—")} />
        </div>
      </Panel>

      <Panel title="Provenance (lignes)">
        <ul className="flex flex-col gap-2" data-testid="evidence-overview-records">
          {(snap.records ?? []).map((raw, idx) => {
            const r = raw as Record<string, unknown>;
            return (
              <li key={String(r.evidenceId ?? idx)} className="rounded border border-slate-800/80 bg-black/40 px-2 py-1.5">
                <p className="font-mono text-[10px] text-cyan-100/90">{String(r.evidenceId ?? "")}</p>
                <p className="text-slate-300">
                  {String(r.sourcePole ?? "")} · <span className="text-slate-500">{String(r.evidenceType ?? "")}</span>
                </p>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  trust: <span className="font-mono">{String(r.trustLevel ?? "")}</span>
                  {r.heuristicConfidence ? " · confiance heuristique" : ""}
                  {r.demoOrSynthetic ? " · démo/synthétique" : ""}
                </p>
                <p className="mt-1 text-[10px] text-slate-500">
                  {String(r.confidenceHeuristic ?? "")}
                </p>
                <p className="mt-0.5 font-mono text-[9px] text-slate-600">
                  inputs: {(r.confidenceInputs as string[] | undefined)?.join(", ") ?? "—"}
                </p>
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel title="Matrice de confiance (par pôle)">
        <div className="flex flex-col gap-2">
          {trustMatrix.map((row) => (
            <div key={String(row.matrixId ?? row.scopeKey)} className="rounded border border-slate-800/80 bg-black/35 px-2 py-1.5">
              <p className="font-mono text-[10px] text-emerald-100/90">{String(row.scopeKey)}</p>
              <p className="text-[11px] text-slate-300">
                Niveau: <span className="font-mono">{String(row.trustLevel)}</span>
              </p>
              <p className="mt-1 text-[10px] text-slate-400">{String(row.trustReason ?? "")}</p>
              <p className="mt-1 font-mono text-[9px] text-slate-600">
                chemin: {(row.classificationPath ?? []).join(" → ") || "—"}
              </p>
              <p className="mt-0.5 font-mono text-[9px] text-slate-600">
                drapeaux:{" "}
                {row.derivedFromFlags
                  ? Object.entries(row.derivedFromFlags)
                      .filter(([, v]) => v)
                      .map(([k]) => k)
                      .join(", ") || "—"
                  : "—"}
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Sources exclues / indisponibles">
        {excluded.length === 0 ? (
          <p className="text-[11px] text-slate-500">Aucune exclusion — tous les pôles cibles ont une ligne source map.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {excluded.map((s) => (
              <li key={String(s.poleKey)} className="font-mono text-[10px] text-slate-400">
                {String(s.poleKey)} — {String(s.sourceAvailability)} ({String(s.skippedReason ?? "")})
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Signaux à couche symbolique (aperçu)">
        <p className="mb-1 text-[10px] text-slate-500">{symbolicSignals.length} ligne(s) avec symbolicProjection=true</p>
        <ul className="flex flex-col gap-1">
          {symbolicSignals.slice(0, 8).map((raw, i) => {
            const r = raw as Record<string, unknown>;
            return (
              <li key={String(r.evidenceId ?? i)} className="font-mono text-[10px] text-slate-400">
                {String(r.evidenceId)} · {String(r.sourcePole)}
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel title="Carte source (fraîcheur / disponibilité)">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left text-[10px]">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500">
                <th className="py-1 pr-2">Pôle</th>
                <th className="py-1 pr-2">Inclus</th>
                <th className="py-1 pr-2">Fraîcheur</th>
                <th className="py-1 pr-2">Fiabilité</th>
                <th className="py-1 pr-2">Complétude</th>
                <th className="py-1">Dispo</th>
              </tr>
            </thead>
            <tbody>
              {sourceMap.map((s) => (
                <tr key={String(s.poleKey)} className="border-b border-slate-900/80 text-slate-300">
                  <td className="py-1 pr-2 font-mono">{String(s.poleKey)}</td>
                  <td className="py-1 pr-2">{s.included ? "oui" : "non"}</td>
                  <td className="py-1 pr-2 font-mono">{String(s.sourceFreshness)}</td>
                  <td className="py-1 pr-2 font-mono">{String(s.sourceReliability)}</td>
                  <td className="py-1 pr-2 font-mono">{String(s.sourceCompleteness)}</td>
                  <td className="py-1 font-mono">{String(s.sourceAvailability)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Limitations">
        <ul className="flex flex-col gap-1">
          {(limitations as { limitationId?: string; userFacingWarning?: string }[]).map((lim) => (
            <li key={String(lim.limitationId)} className="rounded border border-slate-800/60 px-2 py-1 text-[10px] text-slate-400">
              {String(lim.userFacingWarning ?? lim.limitationId)}
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Traces non causales (corrélation / co-occurrence)">
        {traces.length === 0 ? (
          <p className="text-[11px] text-slate-500">Aucune trace (flag industrial_evidence_trace_enabled ou données insuffisantes).</p>
        ) : (
          (traces as { traceId?: string; explanation?: string; interpretationRisk?: string; explanatoryBoundary?: string }[]).map(
            (tr) => (
              <div key={String(tr.traceId)} className="mb-2 rounded border border-slate-800/70 bg-black/30 px-2 py-1.5">
                <p className="text-[11px] text-slate-300">{String(tr.explanation)}</p>
                <p className="mt-1 text-[10px] text-amber-200/80">Risque lecture: {String(tr.interpretationRisk)}</p>
                <p className="mt-1 text-[10px] text-slate-500">Limite: {String(tr.explanatoryBoundary)}</p>
              </div>
            ),
          )
        )}
      </Panel>
    </div>
  );
}
