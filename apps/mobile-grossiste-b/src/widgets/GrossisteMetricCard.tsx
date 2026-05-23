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
    <article className="grossiste-b-card" data-testid={testId}>
      <p style={{ margin: 0, fontSize: 11, color: "#8fa39a", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </p>
      <p style={{ margin: "8px 0 0", fontSize: 22, fontWeight: 700, color: "#00a884" }}>{value}</p>
    </article>
  );
});
