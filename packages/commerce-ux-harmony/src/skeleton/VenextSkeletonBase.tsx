import type { CSSProperties, ReactNode } from "react";

import type { VenextRadiusToken } from "../design-system/venext-design-tokens";

export type VenextSkeletonBaseProps = {
  width?: number | string;
  height?: number | string;
  radius?: VenextRadiusToken | "full";
  circle?: boolean;
  className?: string;
  style?: CSSProperties;
  testId?: string;
  children?: ReactNode;
};

function radiusClass(radius: VenextRadiusToken | "full", circle: boolean): string {
  if (circle) return "venext-skeleton--circle";
  if (radius === "full") return "venext-skeleton--radius-full";
  return `venext-skeleton--radius-${radius}`;
}

/** Bloc skeleton de base — animation douce, GPU-safe (Instruction 20.87). */
export function VenextSkeletonBase({
  width,
  height,
  radius = "md",
  circle = false,
  className = "",
  style,
  testId = "venext-skeleton-base",
  children,
}: VenextSkeletonBaseProps) {
  const merged: CSSProperties = {
    width,
    height,
    ...style,
  };
  return (
    <div
      className={`venext-skeleton ${radiusClass(radius, circle)} ${className}`.trim()}
      style={merged}
      aria-hidden="true"
      data-testid={testId}
    >
      {children}
    </div>
  );
}
