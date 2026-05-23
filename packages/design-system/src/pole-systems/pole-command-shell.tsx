import type { HTMLAttributes, ReactNode } from "react";
import { venextTokens } from "../tokens";

export interface PoleCommandShellProps extends HTMLAttributes<HTMLDivElement> {
  poleTitle: string;
  commandStrip?: ReactNode;
  mapRegion?: ReactNode;
  telemetryRegion?: ReactNode;
}

/**
 * Pole-local command surface — slots only; each pole composes unique patterns.
 */
export function PoleCommandShell({
  poleTitle,
  commandStrip,
  mapRegion,
  telemetryRegion,
  style,
  ...rest
}: PoleCommandShellProps) {
  return (
    <div
      data-vx-pole-shell
      style={{
        display: "grid",
        gridTemplateRows: "auto auto 1fr",
        gap: venextTokens.space.sm,
        minHeight: 480,
        padding: venextTokens.space.md,
        borderRadius: venextTokens.radius.lg,
        border: `1px solid ${venextTokens.color.neutral.line}`,
        background: venextTokens.color.neutral.white,
        fontFamily: venextTokens.font.sans,
        ...style,
      }}
      {...rest}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: venextTokens.color.secondary,
            }}
          >
            Industrial pole
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: venextTokens.color.neutral.graphite,
            }}
          >
            {poleTitle}
          </div>
        </div>
      </div>
      <div data-vx-pole-commands>{commandStrip}</div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: venextTokens.space.sm,
        }}
      >
        <div data-vx-pole-map>{mapRegion}</div>
        <div data-vx-pole-telemetry>{telemetryRegion}</div>
      </div>
    </div>
  );
}
