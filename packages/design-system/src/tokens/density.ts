import type { DensityMode } from "./typography";

export interface DensityProfile {
  mode: DensityMode;
  /** Tighter vertical stacking on dense industrial */
  verticalTightness: number;
  /** Lazy-render threshold: approximate px before offscreen nodes virtualize */
  virtualizationThresholdPx: number;
}

export const densityProfiles: Record<DensityMode, DensityProfile> = {
  mobileLow: {
    mode: "mobileLow",
    verticalTightness: 1.05,
    virtualizationThresholdPx: 560,
  },
  mobileStandard: {
    mode: "mobileStandard",
    verticalTightness: 1,
    virtualizationThresholdPx: 640,
  },
  industrialDense: {
    mode: "industrialDense",
    verticalTightness: 0.92,
    virtualizationThresholdPx: 900,
  },
};
