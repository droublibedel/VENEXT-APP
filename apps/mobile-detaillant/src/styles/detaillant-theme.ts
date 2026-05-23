/** VENEXT Détaillant — mobile-first theme (Instruction 20.56). */
export const detaillantTheme = {
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
  },
  radius: { sm: "10px", md: "14px", lg: "18px", pill: "999px" },
  spacing: { xs: "6px", sm: "10px", md: "16px", lg: "20px", xl: "28px" },
  touch: { minHeight: "52px", tabHeight: "58px" },
  font: {
    family: '"Segoe UI", system-ui, -apple-system, sans-serif',
    sizeSm: "13px",
    sizeBase: "15px",
    sizeLg: "18px",
    sizeTitle: "22px",
  },
} as const;
