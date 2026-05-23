"use client";

type Props = {
  lines: string[];
  maxLines?: number;
};

/** Economic / operational copy — no vanity metrics (Instruction 6 §4). */
export function ProductSignalOverlay({ lines, maxLines = 4 }: Props) {
  if (!lines.length) return null;
  return (
    <ul className="space-y-1 border-t border-slate-800/80 pt-2">
      {lines.slice(0, maxLines).map((line, i) => (
        <li key={i} className="text-[10px] leading-snug text-cyan-100/85">
          · {line}
        </li>
      ))}
    </ul>
  );
}
