"use client";

import { useCallback, useState } from "react";

type Props = {
  commercialNetworkId: string;
  organizationName?: string;
};

export function CommercialCodeCard({ commercialNetworkId, organizationName }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(commercialNetworkId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [commercialNetworkId]);

  return (
    <div className="rounded-lg border border-emerald-800/60 bg-emerald-950/40 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-200/90">ID réseau commercial</p>
      {organizationName ? (
        <p className="mt-0.5 text-xs text-slate-300">{organizationName}</p>
      ) : null}
      <div className="mt-2 flex items-center gap-2">
        <code className="text-lg font-semibold tracking-[0.2em] text-white">{commercialNetworkId}</code>
        <button
          type="button"
          onClick={() => void copy()}
          className="rounded-md border border-emerald-600/50 bg-emerald-900/30 px-2 py-1 text-[11px] font-medium text-emerald-100 active:scale-[0.98]"
        >
          {copied ? "Copié" : "Copier"}
        </button>
      </div>
      <p className="mt-1.5 text-[10px] text-slate-500">10 chiffres — invitation manuelle, QR, partage rapide.</p>
    </div>
  );
}
