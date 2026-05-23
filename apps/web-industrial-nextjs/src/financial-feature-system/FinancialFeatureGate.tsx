"use client";

import type { ReactNode } from "react";

import { useFinancialFeatureSnapshot } from "./useFinancialFeatureSnapshot";

type Props = {
  flag: string;
  organizationId?: string;
  children: ReactNode;
  fallback?: ReactNode;
};

/**
 * Runtime financial surfaces — no dead routes when flags are off (Instruction 8 §10).
 */
export function FinancialFeatureGate({ flag, organizationId, children, fallback }: Props) {
  const { data, loading, error } = useFinancialFeatureSnapshot(organizationId);

  if (loading) {
    return (
      <div className="rounded border border-slate-800 bg-slate-950/80 px-3 py-2 text-[11px] text-slate-500">
        Contrôle financier…
      </div>
    );
  }
  if (error || !data) {
    return (
      fallback ?? (
        <div className="rounded border border-rose-900/50 bg-rose-950/30 px-3 py-2 text-[11px] text-rose-200">
          Couche financière indisponible ({error ?? "inconnu"}).
        </div>
      )
    );
  }
  if (!(data as Record<string, boolean>)[flag]) {
    return (
      fallback ?? (
        <div className="rounded border border-slate-800 bg-slate-900/60 px-3 py-2 text-[11px] text-slate-400">
          Fonction <span className="font-mono text-slate-300">{String(flag)}</span> désactivée côté
          pilotage.
        </div>
      )
    );
  }
  return <>{children}</>;
}
