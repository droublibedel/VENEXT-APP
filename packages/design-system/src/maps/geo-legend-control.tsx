import type { HTMLAttributes } from "react";
import { venextTokens } from "../tokens";

export interface LegendItem {
  id: string;
  label: string;
  color: string;
}

export interface GeoLegendControlProps extends HTMLAttributes<HTMLDivElement> {
  items: LegendItem[];
}

export function GeoLegendControl({
  items,
  style,
  ...rest
}: GeoLegendControlProps) {
  return (
    <div
      data-vx-geo-legend
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        padding: venextTokens.space.sm,
        borderRadius: venextTokens.radius.md,
        background: "rgba(250,251,250,0.96)",
        border: `1px solid ${venextTokens.color.neutral.line}`,
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
        Operational legend
      </div>
      {items.map((item) => (
        <div
          key={item.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
            color: venextTokens.color.neutral.graphite,
          }}
        >
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: 4,
              background: item.color,
              border: `1px solid ${venextTokens.color.neutral.line}`,
            }}
          />
          {item.label}
        </div>
      ))}
    </div>
  );
}
