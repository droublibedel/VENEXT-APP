"use client";

import type { RelationalOrderExecutionViewResponseDto } from "@venext/shared-contracts";

import { RelationalOrderExecutionGovernanceSurface } from "./surfaces/RelationalOrderExecutionGovernanceSurface";
import { RelationalOrderExecutionTimelineSurface } from "./surfaces/RelationalOrderExecutionTimelineSurface";
import { VenextInlineSkeleton } from "@/ux/VenextInlineSkeleton";

export function RelationalOrderExecutionWorkspace(props: {
  data: RelationalOrderExecutionViewResponseDto | null;
  loading: boolean;
  error: string | null;
  orderId: string | null;
}) {
  const { data, loading, error, orderId } = props;
  if (!orderId) {
    return (
      <p className="px-4 py-6 text-xs text-slate-500" data-testid="relational-order-execution-missing-order">
        Ajoutez <span className="font-mono">?orderId=…&amp;organizationId=…</span> pour charger l’exécution corridor.
      </p>
    );
  }
  if (loading) {
    return <VenextInlineSkeleton />;
  }
  if (error) {
    return (
      <p className="px-4 py-6 text-xs text-amber-200/90" data-testid="relational-order-execution-workspace-error">
        {error}
      </p>
    );
  }
  return (
    <div className="flex min-h-0 flex-col gap-3 overflow-auto px-3 py-3 pb-24">
      <header className="rounded border border-cyan-900/40 bg-slate-950/90 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-200/90">Exécution relationnelle</p>
        <p className="mt-1 text-[10px] text-slate-500">
          Fulfillment corridor privé — préparation, acheminement, réception partenaire — pas de suivi colis destiné aux
          consommateurs finaux.
        </p>
        <p className="mt-1 font-mono text-[9px] text-slate-400">orderId={orderId}</p>
      </header>
      <RelationalOrderExecutionGovernanceSurface data={data} />
      <RelationalOrderExecutionTimelineSurface data={data} />
    </div>
  );
}
