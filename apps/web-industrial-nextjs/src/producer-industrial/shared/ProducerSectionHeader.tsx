"use client";

export function ProducerSectionHeader(props: {
  kicker?: string;
  title: string;
  subtitle?: string;
}) {
  const { kicker, title, subtitle } = props;
  return (
    <header className="mb-4 border-b border-slate-800/80 pb-3">
      {kicker ? (
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-emerald-400/90">{kicker}</p>
      ) : null}
      <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-slate-50">{title}</h2>
      {subtitle ? <p className="mt-1 max-w-3xl text-xs text-slate-500">{subtitle}</p> : null}
    </header>
  );
}
