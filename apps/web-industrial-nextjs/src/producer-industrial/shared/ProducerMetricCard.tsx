"use client";

export function ProducerMetricCard(props: {
  label: string;
  value: string | number;
  hint?: string;
  trend?: "up" | "down" | "flat";
  accent?: "default" | "caution" | "signal";
  testId?: string;
}) {
  const { label, value, hint, trend, accent = "default", testId } = props;
  const trendColor =
    trend === "up" ? "text-emerald-400" : trend === "down" ? "text-rose-400" : "text-slate-500";
  const valueColor =
    accent === "caution" ? "text-amber-300" : accent === "signal" ? "text-emerald-400" : "text-slate-50";

  return (
    <div className="producer-industrial-card p-4" data-testid={testId}>
      <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className={`producer-industrial-metric-value mt-1 text-2xl font-semibold ${valueColor}`}>{value}</p>
      {hint ? <p className={`mt-1 text-[11px] ${trend ? trendColor : "text-slate-500"}`}>{hint}</p> : null}
    </div>
  );
}
