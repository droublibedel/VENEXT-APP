"use client";

const ITEMS: { key: string; label: string; hint: string }[] = [
  { key: "verified", label: "Vérifié domaine", hint: "Événements domaine explicites — seul niveau « preuve » forte côté registre." },
  { key: "heuristic", label: "Heuristique", hint: "Estimations ordinales — voir confidenceHeuristic / confidenceInputs." },
  { key: "symbolic", label: "Symbolique", hint: "Cartes / cellules consultatives — non géographie ni MES." },
  { key: "demo", label: "Démo / synthétique", hint: "Signaux démo — seau trust dédié." },
  { key: "degraded", label: "Dégradé", hint: "Compose partiel ou politique réduite — fiabilité bornée." },
  { key: "missing", label: "Manquant", hint: "Pôle exclu (flag ou échec compose) — voir source map." },
];

export function RegistryLegend() {
  return (
    <aside
      className="rounded border border-slate-800/90 bg-slate-950/90 px-3 py-2"
      data-testid="industrial-evidence-registry-legend"
    >
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Légende registre</p>
      <ul className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
        {ITEMS.map((it) => (
          <li key={it.key} className="rounded border border-slate-800/70 bg-black/35 px-2 py-1.5">
            <p className="text-[10px] font-semibold text-slate-200">{it.label}</p>
            <p className="mt-0.5 text-[9px] leading-snug text-slate-500">{it.hint}</p>
          </li>
        ))}
      </ul>
    </aside>
  );
}
