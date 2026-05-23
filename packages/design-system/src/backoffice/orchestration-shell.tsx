import type { HTMLAttributes, ReactNode } from "react";
import { venextTokens } from "../tokens";

export interface OrchestrationShellProps extends HTMLAttributes<HTMLDivElement> {
  featureRail?: ReactNode;
  moduleRail?: ReactNode;
  aiProviderRail?: ReactNode;
  monitoringStrip?: ReactNode;
  emergencyStrip?: ReactNode;
}

/**
 * Governance command center — orchestrates activation, AI providers, monitoring, kill-switches.
 */
export function OrchestrationShell({
  featureRail,
  moduleRail,
  aiProviderRail,
  monitoringStrip,
  emergencyStrip,
  style,
  ...rest
}: OrchestrationShellProps) {
  return (
    <div
      data-vx-backoffice="command"
      style={{
        display: "grid",
        gap: venextTokens.space.md,
        padding: venextTokens.space.lg,
        borderRadius: venextTokens.radius.lg,
        color: venextTokens.color.neutral.white,
        background: venextTokens.color.neutral.graphiteMuted,
        fontFamily: venextTokens.font.sans,
        ...style,
      }}
      {...rest}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: venextTokens.space.sm,
        }}
      >
        <Rail title="Feature activation">{featureRail}</Rail>
        <Rail title="Module control">{moduleRail}</Rail>
        <Rail title="AI provider">{aiProviderRail}</Rail>
      </div>
      <Rail title="Realtime monitoring">{monitoringStrip}</Rail>
      <Rail title="Emergency disable" tone="alert">
        {emergencyStrip}
      </Rail>
    </div>
  );
}

function Rail({
  title,
  children,
  tone,
}: {
  title: string;
  children?: ReactNode;
  tone?: "alert" | "neutral";
}) {
  return (
    <div
      style={{
        borderRadius: venextTokens.radius.md,
        border:
          tone === "alert"
            ? `1px solid ${venextTokens.color.accent}`
            : `1px solid ${venextTokens.color.neutral.line}`,
        padding: venextTokens.space.sm,
        background:
          tone === "alert"
            ? "rgba(255,193,7,0.08)"
            : "rgba(250,251,250,0.04)",
      }}
    >
      <div
        style={{
          fontSize: 10,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#cbd5f5",
        }}
      >
        {title}
      </div>
      <div style={{ marginTop: 8, color: venextTokens.color.neutral.white }}>
        {children}
      </div>
    </div>
  );
}
