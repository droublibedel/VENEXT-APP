"use client";

type Props = {
  intensity: number;
  reducedMotion?: boolean;
};

/** Non–social pulse — kinetic field readout (Instruction 6 §12). */
export function ProductPulseRenderer({ intensity, reducedMotion }: Props) {
  const n = Math.min(5, 2 + Math.round(intensity * 4));
  return (
    <div className="flex items-end gap-0.5" aria-hidden>
      {Array.from({ length: n }).map((_, i) => (
        <span
          key={i}
          className={`w-0.5 rounded-sm bg-cyan-400/80 ${reducedMotion ? "" : "animate-pulse"}`}
          style={{
            height: `${8 + ((i + 1) / n) * intensity * 14}px`,
            animationDelay: reducedMotion ? undefined : `${i * 120}ms`,
          }}
        />
      ))}
    </div>
  );
}
