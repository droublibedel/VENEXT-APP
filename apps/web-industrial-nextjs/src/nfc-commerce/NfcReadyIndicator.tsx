"use client";

import { useEffect, useState } from "react";

import { DEMO_FINANCE_ORG } from "@/financial-feature-system/constants";

type Cap = {
  nfc_enabled_flag: boolean;
  device_nfc_likely: boolean;
  tap_protocol: string;
  note?: string;
};

export function NfcReadyIndicator({ organizationId = DEMO_FINANCE_ORG }: { organizationId?: string }) {
  const [cap, setCap] = useState<Cap | null>(null);

  useEffect(() => {
    void (async () => {
      const q = new URLSearchParams({ organizationId });
      const r = await fetch(`/api/core/v1/nfc-commerce/capability?${q.toString()}`);
      if (r.ok) setCap((await r.json()) as Cap);
    })();
  }, [organizationId]);

  if (!cap) return <p className="text-[10px] text-slate-500">NFC…</p>;

  return (
    <div className="rounded border border-slate-800 bg-slate-950/70 px-2 py-2 text-[10px] text-slate-300">
      <p>
        Flag <span className="font-mono text-cyan-200/90">{String(cap.nfc_enabled_flag)}</span> · device likely{" "}
        <span className="font-mono">{String(cap.device_nfc_likely)}</span>
      </p>
      <p className="mt-1 text-slate-500">{cap.tap_protocol}</p>
    </div>
  );
}
