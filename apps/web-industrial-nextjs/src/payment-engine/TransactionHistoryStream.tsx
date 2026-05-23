"use client";

type Tx = { id: string; status: string; amount: string; type: string; createdAt: string };

export function TransactionHistoryStream({ items }: { items: Tx[] }) {
  if (!items.length) return <p className="text-[11px] text-slate-500">Aucun mouvement récent.</p>;
  return (
    <ul className="max-h-56 space-y-1 overflow-y-auto border border-slate-800/80 bg-slate-950/50 p-2">
      {items.map((t) => (
        <li
          key={t.id}
          className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-900/80 py-1 text-[11px] last:border-0"
        >
          <span className="font-mono text-slate-400">{t.type}</span>
          <span className="font-mono text-slate-100">{t.amount}</span>
          <span className="text-[10px] text-slate-500">{t.status}</span>
          <span className="w-full text-[9px] text-slate-600">{new Date(t.createdAt).toLocaleString()}</span>
        </li>
      ))}
    </ul>
  );
}
