/** Spatial rhythm — thumb-first mobile, layered overlays on all platforms. */
export const space = {
  xxs: 4,
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
} as const;

export const elevation = {
  /** Commerce base layer */
  base: 0,
  /** Floating contextual layers */
  layer1: 10,
  layer2: 20,
  /** Wallet / QR / NFC overlay */
  transactional: 40,
  /** System toasts / critical signals */
  system: 60,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  pill: 999,
} as const;
