"use client";

import type { RelationalOrderExecutionViewResponseDto } from "@venext/shared-contracts";

import {
  relationExecutionStatusHeadline,
} from "../relational-order-execution-copy";

export function RelationalOrderExecutionGovernanceSurface(props: { data: RelationalOrderExecutionViewResponseDto | null }) {
  const raw = props.data?.execution.executionStatus ?? "—";
  const st = raw === "—" ? "—" : relationExecutionStatusHeadline(raw);
  return (
    <section className="rounded border border-slate-800 bg-slate-950/70 p-3" data-testid="relational-order-execution-governance">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Gouvernance corridor</p>
      <p className="mt-2 text-[10px] text-slate-300">
        Statut d’exécution relationnelle : <span className="font-mono text-cyan-100/90">{st}</span>
        {raw !== "—" && raw !== st ? (
          <span className="ml-1 font-mono text-[9px] text-slate-500">({raw})</span>
        ) : null}
      </p>
      <p className="mt-2 text-[9px] leading-snug text-slate-500">
        Chaque transition est soumise à <span className="font-mono">assertCorridorOperational(..., &quot;order_execution&quot;)</span> côté
        domaine — corridor bloqué ou suspendu : pas d’exécution ; corridor dégradé : avertissements internes uniquement.
      </p>
      <p className="mt-2 text-[9px] text-slate-500">
        Paiement orchestré sur ce périmètre désactivé par contrat (<span className="font-mono">paymentExecutionDisabled</span>) — pas
        de lien de suivi destiné aux consommateurs finaux (<span className="font-mono">publicTrackingDisabled</span>).
      </p>
    </section>
  );
}
