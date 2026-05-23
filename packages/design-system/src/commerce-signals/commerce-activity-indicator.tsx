import type { HTMLAttributes } from "react";
import { venextTokens } from "../tokens";

export interface CommerceActivityIndicatorProps
  extends HTMLAttributes<HTMLSpanElement> {
  label?: string;
  live?: boolean;
}

/** Realtime pulse — operational, not decorative. */
export function CommerceActivityIndicator({
  label = "Live signal",
  live = true,
  style,
  ...rest
}: CommerceActivityIndicatorProps) {
  return (
    <span
      data-vx-activity
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontFamily: venextTokens.font.sans,
        fontSize: 11,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: venextTokens.color.neutral.graphiteMuted,
        ...style,
      }}
      {...rest}
    >
      <span
        data-vx-pulse={live ? "live" : "idle"}
        style={{
          width: 10,
          height: 10,
          borderRadius: 999,
          background: live
            ? venextTokens.color.secondary
            : venextTokens.color.signal.demandFlat,
          boxShadow: live ? "0 0 0 6px rgba(0,168,132,0.12)" : "none",
        }}
      />
      {label}
    </span>
  );
}
