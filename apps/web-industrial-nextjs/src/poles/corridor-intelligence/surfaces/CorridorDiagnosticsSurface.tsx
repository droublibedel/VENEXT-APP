import type { CommercialCorridorProfileDto } from "@venext/shared-contracts";

export function CorridorDiagnosticsSurface({ data }: { data: CommercialCorridorProfileDto | null }) {
  const d = data?.diagnostics;
  if (!d) {
    return (
      <section className="rounded border border-slate-800 bg-slate-950/40 p-4 text-xs text-slate-500">
        Diagnostics corridor indisponibles.
      </section>
    );
  }
  const unavailablePreview = d.unavailableSignalTypes.slice(0, 6).join(", ");
  return (
    <section className="rounded border border-slate-800 bg-slate-950/40 p-4 text-xs text-slate-200" data-testid="corridor-diagnostics">
      <h2 className="font-semibold uppercase tracking-[0.2em] text-slate-400">Diagnostics gouvernance</h2>
      <dl className="mt-3 grid gap-2">
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Périmètre lecture</dt>
          <dd className="font-mono text-slate-300">{d.relationshipIntelligenceScope}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Niveau de risque corridor</dt>
          <dd className="font-mono text-slate-300">{d.corridorRiskLevel}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Origine sponsor</dt>
          <dd className="font-mono text-slate-300">{d.sponsoredOrigin ? "oui" : "non"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Signaux indisponibles (aperçu)</dt>
          <dd className="text-right font-mono text-[10px] text-slate-400">{unavailablePreview || "—"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Préparation signaux</dt>
          <dd className="text-right text-[10px] text-slate-400">
            {Object.entries(d.signalReadiness)
              .filter(([, v]) => v !== "EMITTED")
              .slice(0, 4)
              .map(([k, v]) => `${k}:${v}`)
              .join(" · ") || "Tous les signaux moteur sont émis ou en attente module."}
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-[10px] leading-relaxed text-slate-500">
        Diagnostics internes — heuristique seulement, exposition marketplace désactivée, classement public désactivé.
      </p>
    </section>
  );
}
