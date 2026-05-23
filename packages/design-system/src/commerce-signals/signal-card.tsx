import type { HTMLAttributes, ReactNode } from "react";
import { venextTokens } from "../tokens";

export interface SignalCardProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  value: ReactNode;
  tone?: "neutral" | "live" | "tension" | "sponsor";
}

/** Economic signal node — dense, professional, no social gimmicks. */
export function SignalCard({
  label,
  value,
  tone = "neutral",
  style,
  ...rest
}: SignalCardProps) {
  const border =
    tone === "live"
      ? venextTokens.color.secondary
      : tone === "tension"
        ? venextTokens.color.signal.stockTension
        : tone === "sponsor"
          ? venextTokens.color.accent
          : venextTokens.color.neutral.lineStrong;
  return (
    <div
      data-vx-signal-card
      style={{
        padding: venextTokens.space.sm,
        borderRadius: venextTokens.radius.md,
        border: `1px solid ${venextTokens.color.neutral.line}`,
        borderLeft: `3px solid ${border}`,
        background: venextTokens.color.neutral.white,
        fontFamily: venextTokens.font.sans,
        ...style,
      }}
      {...rest}
    >
      <div
        style={{
          fontSize: 10,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: venextTokens.color.neutral.graphiteMuted,
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 4,
          fontSize: 14,
          fontWeight: 600,
          color: venextTokens.color.neutral.graphite,
        }}
      >
        {value}
      </div>
    </div>
  );
}
