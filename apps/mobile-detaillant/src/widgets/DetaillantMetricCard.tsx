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
    <article className="detaillant-card" data-testid={testId}>
      <p style={{ margin: 0, fontSize: 12, color: "#8fa39a", fontWeight: 600 }}>{label}</p>
      <p style={{ margin: "10px 0 0", fontSize: 24, fontWeight: 800, color: "#00a884" }}>{value}</p>
    </article>
  );
});
