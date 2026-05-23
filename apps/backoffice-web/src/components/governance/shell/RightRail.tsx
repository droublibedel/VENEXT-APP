"use client";

import { useGovernanceShell } from "../context/GovernanceShellContext";
import { vx } from "../ui/vx-styles";

export function RightRail() {
  const { selection } = useGovernanceShell();

  return (
    <aside className="flex flex-col border-l py-3 text-[11px]" style={{ borderColor: vx.line, backgroundColor: "#12171c" }}>
      <p className="mb-2 px-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/40">Context rail</p>
      <div className="flex-1 space-y-3 overflow-auto px-3 text-white/75">
        {!selection ? (
          <p className="text-white/45">Select an entity in the intelligence surface to inspect risk notes and trace.</p>
        ) : (
          <>
            <div className="rounded border border-white/10 bg-black/25 p-2">
              <p className="mb-1 text-[9px] uppercase tracking-wider text-white/40">Selection</p>
              <p className="font-mono text-[10px] text-emerald-200/90">{selection.kind}</p>
              {"key" in selection && selection.key ? (
                <p className="mt-1 font-mono text-[10px]">{selection.key}</p>
              ) : null}
              {"id" in selection && selection.id ? (
                <p className="mt-1 break-all font-mono text-[10px]">{selection.id}</p>
              ) : null}
              {"code" in selection && selection.code ? (
                <p className="mt-1 font-mono text-[10px]">{selection.code}</p>
              ) : null}
            </div>
            {selection.payload != null ? (
              <div className="rounded border border-white/10 bg-black/30 p-2">
                <p className="mb-1 text-[9px] uppercase tracking-wider text-white/40">Payload</p>
                <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all text-[9px] text-cyan-100/70">
                  {JSON.stringify(selection.payload, null, 2)}
                </pre>
              </div>
            ) : null}
            <p className="text-[10px] text-white/45">
              Audit trace for mutations appears in the banner on the surface after confirm.
            </p>
          </>
        )}
      </div>
    </aside>
  );
}
