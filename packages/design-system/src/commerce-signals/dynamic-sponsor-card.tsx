import type { HTMLAttributes, ReactNode } from "react";
import { venextTokens } from "../tokens";

export interface DynamicSponsorCardProps extends HTMLAttributes<HTMLDivElement> {
  headline: string;
  contextLine: string;
  children?: ReactNode;
}

/**
 * Sponsored visibility stays contextual — never billboard spam.
 */
export function DynamicSponsorCard({
  headline,
  contextLine,
  children,
  style,
  ...rest
}: DynamicSponsorCardProps) {
  return (
    <div
      data-vx-sponsor
      style={{
        padding: venextTokens.space.md,
        borderRadius: venextTokens.radius.lg,
        border: `1px solid ${venextTokens.color.neutral.line}`,
        borderTop: `3px solid ${venextTokens.color.accent}`,
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
          color: venextTokens.color.signal.sponsor,
        }}
      >
        Sponsored · contextual
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 15,
          fontWeight: 600,
          color: venextTokens.color.neutral.graphite,
        }}
      >
        {headline}
      </div>
      <div style={{ marginTop: 4, fontSize: 12, color: "#475569" }}>
        {contextLine}
      </div>
      {children}
    </div>
  );
}
