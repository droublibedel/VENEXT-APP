/** VENEXT Grossiste B — mobile-first theme (Instruction 20.55). */
export const grossisteBTheme = {
  colors: {
    bg: "#0b1412",
    bgElevated: "#12201c",
    card: "#162822",
    cardBorder: "rgba(0, 168, 132, 0.12)",
    text: "#f0f4f2",
    textMuted: "#8fa39a",
    accent: "#075E54",
    accentBright: "#00A884",
    accentSoft: "rgba(0, 168, 132, 0.15)",
    warning: "#e8b84a",
    danger: "#e07a6a",
    success: "#00A884",
  },
  radius: {
    sm: "10px",
    md: "14px",
    lg: "18px",
    pill: "999px",
  },
  spacing: {
    xs: "6px",
    sm: "10px",
    md: "16px",
    lg: "20px",
    xl: "28px",
  },
  touch: {
    minHeight: "48px",
    tabHeight: "56px",
  },
  shadow: {
    card: "0 8px 24px rgba(0, 0, 0, 0.35)",
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
