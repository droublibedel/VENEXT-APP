import type { HTMLAttributes, ReactNode } from "react";
import { venextTokens } from "../tokens";

export interface IntelligenceSummaryBlockProps
  extends HTMLAttributes<HTMLDivElement> {
  metrics: { label: string; value: ReactNode; hint?: string }[];
}

/** Dense industrial read — optimized for `industrialDense` typography profile. */
export function IntelligenceSummaryBlock({
  metrics,
  style,
  ...rest
}: IntelligenceSummaryBlockProps) {
  return (
    <div
      data-vx-intelligence-summary
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
        gap: venextTokens.space.sm,
        fontFamily: venextTokens.font.sans,
        ...style,
      }}
      {...rest}
    >
      {metrics.map((m) => (
        <div
          key={m.label}
          style={{
            padding: venextTokens.space.sm,
            borderRadius: venextTokens.radius.md,
            border: `1px solid ${venextTokens.color.neutral.line}`,
            background: venextTokens.color.neutral.panelWarm,
          }}
        >
          <div
            style={{
              fontSize: 10,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: venextTokens.color.neutral.graphiteMuted,
            }}
          >
            {m.label}
          </div>
          <div
            style={{
              marginTop: 4,
              fontSize: 18,
              fontWeight: 600,
              color: venextTokens.color.neutral.graphite,
            }}
          >
            {m.value}
          </div>
          {m.hint ? (
            <div style={{ marginTop: 4, fontSize: 11, color: "#64748b" }}>
              {m.hint}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
