"use client";

import type { ReactNode } from "react";

import type { ProducerDataSource } from "../data/producer-industrial-data.types";
import { ProducerDataSourceHint } from "../shared/ProducerDataSourceHint";

export function ProducerFinancePanelFrame(props: {
  title: string;
  subtitle?: string;
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyMessage?: string;
  dataSource: ProducerDataSource;
  fallbackUsed: boolean;
  testId?: string;
  children: ReactNode;
}) {
  const {
    title,
    subtitle,
    loading,
    error,
    empty,
    emptyMessage = "Aucune donnée financière pour le moment.",
    dataSource,
    fallbackUsed,
    testId,
    children,
  } = props;

  return (
    <section className="producer-industrial-card p-4" data-testid={testId}>
      <header className="mb-3 border-b border-slate-800/70 pb-2">
        <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
        {subtitle ? <p className="mt-0.5 text-[11px] text-slate-500">{subtitle}</p> : null}
      </header>
      <ProducerDataSourceHint dataSource={dataSource} fallbackUsed={fallbackUsed} loading={loading} />
      {loading ? (
        <div className="animate-pulse space-y-2 py-6" data-testid={`${testId}-loading`}>
          <div className="h-3 w-2/3 rounded bg-slate-800" />
          <div className="h-3 w-1/2 rounded bg-slate-800" />
        </div>
      ) : error ? (
        <p className="py-4 text-xs text-amber-400/90" data-testid={`${testId}-error`}>
          Lecture temporairement indisponible — affichage de secours actif.
        </p>
      ) : empty ? (
        <p className="py-4 text-xs text-slate-500" data-testid={`${testId}-empty`}>
          {emptyMessage}
        </p>
      ) : (
        children
      )}
    </section>
  );
}
