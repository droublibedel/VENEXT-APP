/** Inter-first stack — load Inter in app root; falls back to dense system UI. */
export const fontStacks = {
  sans: '"Inter", ui-sans-serif, system-ui, "Segoe UI", Roboto, "Noto Sans", sans-serif',
  mono: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
} as const;

export type DensityMode = "mobileLow" | "mobileStandard" | "industrialDense";

export const typographyScale: Record<
  DensityMode,
  {
    display: { size: number; line: number; weight: number };
    title: { size: number; line: number; weight: number };
    body: { size: number; line: number; weight: number };
    caption: { size: number; line: number; weight: number };
    micro: { size: number; line: number; weight: number };
  }
> = {
  mobileLow: {
    display: { size: 22, line: 28, weight: 620 },
    title: { size: 18, line: 24, weight: 600 },
    body: { size: 16, line: 22, weight: 450 },
    caption: { size: 13, line: 18, weight: 500 },
    micro: { size: 11, line: 14, weight: 550 },
  },
  mobileStandard: {
    display: { size: 20, line: 26, weight: 620 },
    title: { size: 17, line: 22, weight: 600 },
    body: { size: 15, line: 21, weight: 450 },
    caption: { size: 12, line: 17, weight: 500 },
    micro: { size: 10, line: 13, weight: 550 },
  },
  industrialDense: {
    display: { size: 18, line: 22, weight: 620 },
    title: { size: 15, line: 19, weight: 600 },
    body: { size: 13, line: 17, weight: 450 },
    caption: { size: 11, line: 15, weight: 500 },
    micro: { size: 10, line: 12, weight: 550 },
  },
};
