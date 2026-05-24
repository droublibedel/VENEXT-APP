/** VENEXT Détaillant — mobile-first theme (Instruction 20.56). */
export const detaillantTheme = {
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
  },
  radius: { sm: "8px", md: "12px", lg: "16px", pill: "999px" },
  spacing: { xs: "6px", sm: "10px", md: "18px", lg: "24px", xl: "32px" },
  touch: { minHeight: "52px", tabHeight: "58px" },
  font: {
    family: '"Segoe UI", system-ui, -apple-system, sans-serif',
    sizeSm: "13px",
    sizeBase: "15px",
    sizeLg: "18px",
    sizeTitle: "22px",
  },
} as const;
