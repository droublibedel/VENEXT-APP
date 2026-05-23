"use client";

/** Raw JSON — development only (Instruction 10A §1). */
export function DebugPayloadDrawer({ label, data }: { label: string; data: unknown }) {
  if (process.env.NODE_ENV !== "development") return null;
  return (
    <details className="mt-6 rounded border border-dashed border-white/15 bg-black/30">
      <summary className="cursor-pointer px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-white/45">
        Debug · {label}
      </summary>
      <pre className="max-h-52 overflow-auto border-t border-white/10 p-3 text-[10px] text-cyan-100/65">
        {JSON.stringify(data, null, 2)}
      </pre>
    </details>
  );
}
