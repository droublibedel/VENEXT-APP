import type { DensityMode } from "../tokens/typography";

export type BandwidthMode = "normal" | "low";
export type DeviceTier = "low2gb" | "mid3gb" | "high4gb";

export interface PerformanceUxProfile {
  density: DensityMode;
  bandwidth: BandwidthMode;
  deviceTier: DeviceTier;
  reducedMotion: boolean;
  virtualization: boolean;
  progressiveImages: boolean;
}

export function resolvePerformanceProfile(input: {
  density: DensityMode;
  prefersReducedMotion: boolean;
  saveData?: boolean;
  deviceMemoryGb?: number;
}): PerformanceUxProfile {
  const tier: DeviceTier =
    input.deviceMemoryGb === undefined
      ? "mid3gb"
      : input.deviceMemoryGb <= 2.5
        ? "low2gb"
        : input.deviceMemoryGb <= 3.5
          ? "mid3gb"
          : "high4gb";

  const bandwidth: BandwidthMode =
    input.saveData === true ? "low" : "normal";

  return {
    density: input.density,
    bandwidth,
    deviceTier: tier,
    reducedMotion: input.prefersReducedMotion,
    virtualization: tier === "low2gb" || bandwidth === "low",
    progressiveImages: tier !== "high4gb" || bandwidth === "low",
  };
}
