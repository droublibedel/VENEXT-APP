import type { DetailsHTMLAttributes, ReactNode } from "react";
import { venextTokens } from "../tokens";

export interface IntelligencePanelProps
  extends DetailsHTMLAttributes<HTMLDetailsElement> {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

/** Expandable intelligence card — motion via `<details>` (no GPU spam). */
export function IntelligencePanel({
  title,
  subtitle,
  children,
  style,
  ...rest
}: IntelligencePanelProps) {
  return (
    <details
      data-vx-intelligence-panel
      style={{
        borderRadius: venextTokens.radius.lg,
        border: `1px solid ${venextTokens.color.neutral.line}`,
        background: venextTokens.color.neutral.white,
        padding: venextTokens.space.md,
        fontFamily: venextTokens.font.sans,
        ...style,
      }}
      {...rest}
    >
      <summary
        style={{
          cursor: "pointer",
          listStyle: "none",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <div
          style={{
            fontSize: 11,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: venextTokens.color.secondary,
          }}
        >
          Intelligence
        </div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: venextTokens.color.neutral.graphite,
          }}
        >
          {title}
        </div>
        {subtitle ? (
          <div style={{ fontSize: 12, color: "#475569" }}>{subtitle}</div>
        ) : null}
      </summary>
      <div style={{ marginTop: venextTokens.space.md }}>{children}</div>
    </details>
  );
}
