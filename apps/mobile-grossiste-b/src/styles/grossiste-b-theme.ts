/** VENEXT Grossiste B — mobile-first theme (Instruction 20.55). */
export const grossisteBTheme = {
  colors: {
    bg: "#f6f7f5",
    bgElevated: "#ffffff",
    card: "#ffffff",
    cardRaised: "#fbfcfb",
    cardBorder: "rgba(23, 32, 28, 0.1)",
    text: "#17201c",
    textMuted: "#7b8982",
    textSecondary: "#526059",
    accent: "#00785f",
    accentBright: "#008f73",
    accentSoft: "rgba(0, 143, 115, 0.08)",
    warning: "#a87112",
    danger: "#b94f42",
    success: "#008f73",
  },
  radius: {
    sm: "8px",
    md: "12px",
    lg: "16px",
    pill: "999px",
  },
  spacing: {
    xs: "6px",
    sm: "10px",
    md: "18px",
    lg: "24px",
    xl: "32px",
  },
  touch: {
    minHeight: "48px",
    tabHeight: "56px",
  },
  shadow: {
    card: "0 10px 28px rgba(23, 32, 28, 0.08)",
    soft: "0 4px 12px rgba(0, 0, 0, 0.25)",
  },
  font: {
    family: '"Segoe UI", system-ui, -apple-system, sans-serif',
    sizeSm: "12px",
    sizeBase: "14px",
    sizeLg: "17px",
    sizeTitle: "20px",
  },
} as const;

export type GrossisteBTheme = typeof grossisteBTheme;
