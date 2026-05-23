"use client";

import type { ProducerDataSource } from "../data/producer-industrial-data.types";

export function producerDataSourceLabel(dataSource: ProducerDataSource, fallbackUsed: boolean): string {
  if (dataSource === "live" && !fallbackUsed) return "Données synchronisées";
  if (dataSource === "mixed") return "Données synchronisées (complétées)";
  return "Données de démonstration enrichies";
}

export function ProducerDataSourceHint(props: {
  dataSource: ProducerDataSource;
  fallbackUsed: boolean;
  loading?: boolean;
}) {
  const { dataSource, fallbackUsed, loading } = props;
  if (loading) return null;
  return (
    <p
      className="mb-3 text-[10px] text-slate-500"
      data-testid="producer-data-source-hint"
      data-source={dataSource}
      data-fallback={fallbackUsed ? "true" : "false"}
    >
      {producerDataSourceLabel(dataSource, fallbackUsed)}
    </p>
  );
}
