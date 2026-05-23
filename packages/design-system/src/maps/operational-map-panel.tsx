import type { HTMLAttributes, ReactNode } from "react";
import { venextTokens } from "../tokens";

export interface OperationalMapPanelProps extends HTMLAttributes<HTMLDivElement> {
  /** Mapbox GL / canvas mount point */
  mapSlot: ReactNode;
  legend?: ReactNode;
  realtimeStrip?: ReactNode;
  commandChips?: ReactNode;
}

/**
 * Operational map — layered controls, legends, realtime economic signals.
 * Not a passive embed; chrome is part of the intelligence surface.
 */
export function OperationalMapPanel({
  mapSlot,
  legend,
  realtimeStrip,
  commandChips,
  style,
  ...rest
}: OperationalMapPanelProps) {
  return (
    <div
      data-vx-map-panel
      style={{
        position: "relative",
        borderRadius: venextTokens.radius.lg,
        overflow: "hidden",
        border: `1px solid ${venextTokens.color.neutral.line}`,
        minHeight: 360,
        background: venextTokens.color.neutral.graphite,
        fontFamily: venextTokens.font.sans,
        ...style,
      }}
      {...rest}
    >
      <div style={{ position: "absolute", inset: 0 }}>{mapSlot}</div>
      {commandChips ? (
        <div
          style={{
            position: "absolute",
            top: venextTokens.space.md,
            left: venextTokens.space.md,
            display: "flex",
            gap: venextTokens.space.xs,
            zIndex: venextTokens.elevation.layer2,
          }}
        >
          {commandChips}
        </div>
      ) : null}
      {legend ? (
        <div
          style={{
            position: "absolute",
            bottom: venextTokens.space.md,
            left: venextTokens.space.md,
            zIndex: venextTokens.elevation.layer2,
          }}
        >
          {legend}
        </div>
      ) : null}
      {realtimeStrip ? (
        <div
          style={{
            position: "absolute",
            top: venextTokens.space.md,
            right: venextTokens.space.md,
            zIndex: venextTokens.elevation.layer2,
            minWidth: 220,
          }}
        >
          {realtimeStrip}
        </div>
      ) : null}
    </div>
  );
}
