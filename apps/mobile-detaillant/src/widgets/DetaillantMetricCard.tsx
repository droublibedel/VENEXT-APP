import { memo } from "react";

export const DetaillantMetricCard = memo(function DetaillantMetricCard({
  label,
  value,
  testId,
}: {
  label: string;
  value: string | number;
  testId?: string;
}) {
  return (
    <article className="detaillant-card detaillant-kpi-card" data-testid={testId}>
      <p className="detaillant-kpi-label">{label}</p>
      <p className="detaillant-kpi-value">{value}</p>
    </article>
  );
});
