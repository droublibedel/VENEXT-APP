import { memo } from "react";

export const GrossisteMetricCard = memo(function GrossisteMetricCard({
  label,
  value,
  testId,
}: {
  label: string;
  value: string | number;
  testId?: string;
}) {
  return (
    <article className="grossiste-b-card grossiste-b-kpi-card" data-testid={testId}>
      <p className="grossiste-b-kpi-label">{label}</p>
      <p className="grossiste-b-kpi-value">{value}</p>
    </article>
  );
});
