import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { venextTokens } from "../tokens";

export type LayerElevation = keyof typeof venextTokens.elevation;

export interface LayerSurfaceProps extends HTMLAttributes<HTMLDivElement> {
  elevation?: LayerElevation;
  children: ReactNode;
}

/**
 * Floating contextual layer — commerce surface, not flat admin sheet.
 */
export function LayerSurface({
  elevation = "layer1",
  style,
  children,
  ...rest
}: LayerSurfaceProps) {
  const shell: CSSProperties = {
    position: "relative",
    zIndex: venextTokens.elevation[elevation],
    borderRadius: venextTokens.radius.lg,
    background: venextTokens.color.neutral.panelWarm,
    border: `1px solid ${venextTokens.color.neutral.line}`,
    boxShadow: "0 10px 30px rgba(15,26,23,0.08)",
    fontFamily: venextTokens.font.sans,
    ...style,
  };
  return (
    <div data-vx-layer="float" style={shell} {...rest}>
      {children}
    </div>
  );
}
