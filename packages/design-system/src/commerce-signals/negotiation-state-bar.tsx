import type { HTMLAttributes } from "react";
import { venextTokens } from "../tokens";

export type NegotiationPhase =
  | "draft"
  | "proposed"
  | "countered"
  | "reserved"
  | "accepted";

export interface NegotiationStateBarProps extends HTMLAttributes<HTMLDivElement> {
  phase: NegotiationPhase;
}

const phases: NegotiationPhase[] = [
  "draft",
  "proposed",
  "countered",
  "reserved",
  "accepted",
];

export function NegotiationStateBar({
  phase,
  style,
  ...rest
}: NegotiationStateBarProps) {
  const activeIndex = phases.indexOf(phase);
  return (
    <div
      data-vx-negotiation-bar
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${phases.length},1fr)`,
        gap: 6,
        fontFamily: venextTokens.font.sans,
        ...style,
      }}
      {...rest}
    >
      {phases.map((p, idx) => {
        const active = idx <= activeIndex;
        return (
          <div key={p} style={{ textAlign: "center" }}>
            <div
              style={{
                height: 6,
                borderRadius: 999,
                background: active
                  ? venextTokens.color.primary
                  : venextTokens.color.neutral.panel,
                border: `1px solid ${venextTokens.color.neutral.line}`,
              }}
            />
            <div
              style={{
                marginTop: 6,
                fontSize: 10,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: active
                  ? venextTokens.color.neutral.graphite
                  : "#94a3b8",
              }}
            >
              {p}
            </div>
          </div>
        );
      })}
    </div>
  );
}
