"use client";

import { VenextHiddenDataSourceMarker } from "commerce-ux-harmony";

import type { ProducerDataSource } from "../data/producer-industrial-data.types";

export function ProducerDataSourceHint(props: {
  dataSource: ProducerDataSource;
  fallbackUsed: boolean;
  loading?: boolean;
}) {
  const { dataSource, fallbackUsed, loading } = props;
  if (loading) return null;
  return (
    <VenextHiddenDataSourceMarker
      testId="producer-data-source-hint"
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
    />
  );
}
