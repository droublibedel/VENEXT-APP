/** VENEXT-UX-IDENTITY-01 — mobile field identity rules. */

export const VenextColorHierarchy = {
  background: {
    app: "#f6f7f5",
    elevated: "#ffffff",
    surface: "#ffffff",
    surfaceRaised: "#fbfcfb",
  },
  text: {
    primary: "#17201c",
    secondary: "#526059",
    muted: "#7b8982",
  },
  accent: {
    venext: "#00A884",
    venextStrong: "#008F73",
    venextSoft: "rgba(0, 168, 132, 0.08)",
    warning: "#a87112",
    danger: "#b94f42",
  },
  border: {
    subtle: "rgba(23, 32, 28, 0.1)",
    active: "rgba(0, 168, 132, 0.28)",
  },
} as const;

export const VenextSurfaceTokens = {
  radius: {
    card: "12px",
    control: "10px",
    pill: "999px",
  },
  shadow: {
    card: "0 10px 28px rgba(23, 32, 28, 0.08)",
    nav: "0 -8px 24px rgba(23, 32, 28, 0.08)",
  },
  spacing: {
    screenX: "18px",
    sectionY: "18px",
    card: "16px",
  },
} as const;

export const VenextEconomicAccentRules = {
  maxAccentSurfaceRatio: 0.1,
  kpiValueColor: VenextColorHierarchy.accent.venext,
  cardFillMustStayNeutral: true,
  accentUsage: [
    "primary actions",
    "active navigation",
    "validated states",
    "economic KPI values",
    "small AI or activity indicators",
  ],
} as const;

export const VenextNavigationIconSystem = {
  library: "lucide-react",
  strokeWidth: 1.85,
  size: 21,
  activeSize: 22,
  style: "minimal geometric line icons",
} as const;

export type VenextColorOveruseInput = {
  greenSurfaceCount: number;
  totalSurfaceCount: number;
  accentElementCount: number;
  visibleElementCount: number;
  highGlowCount?: number;
};

export type VenextColorOveruseIssue = {
  code:
    | "green_surface_ratio_high"
    | "accent_density_high"
    | "glow_density_high"
    | "invalid_surface_count";
  severity: "warning" | "error";
  message: string;
};

export function auditVenextColorOveruse(input: VenextColorOveruseInput): VenextColorOveruseIssue[] {
  const issues: VenextColorOveruseIssue[] = [];
  if (input.totalSurfaceCount <= 0 || input.visibleElementCount <= 0) {
    return [
      {
        code: "invalid_surface_count",
        severity: "error",
        message: "Provide positive surface and visible element counts for the VENEXT color audit.",
      },
    ];
  }

  const greenSurfaceRatio = input.greenSurfaceCount / input.totalSurfaceCount;
  const accentDensity = input.accentElementCount / input.visibleElementCount;
  if (greenSurfaceRatio > VenextEconomicAccentRules.maxAccentSurfaceRatio) {
    issues.push({
      code: "green_surface_ratio_high",
      severity: "error",
      message: "Green must remain a strategic accent; white and light neutral surfaces should carry the interface.",
    });
  }
  if (accentDensity > 0.18) {
    issues.push({
      code: "accent_density_high",
      severity: "warning",
      message: "Too many simultaneous accent elements reduce hierarchy and increase visual fatigue.",
    });
  }
  if ((input.highGlowCount ?? 0) > 0) {
    issues.push({
      code: "glow_density_high",
      severity: "warning",
      message: "VENEXT AI and economic signals should feel calm; avoid aggressive glow effects.",
    });
  }
  return issues;
}

export function venextMobileIdentityCssVariables(): Record<string, string> {
  return {
    "--venext-bg": VenextColorHierarchy.background.app,
    "--venext-bg-elevated": VenextColorHierarchy.background.elevated,
    "--venext-surface": VenextColorHierarchy.background.surface,
    "--venext-surface-raised": VenextColorHierarchy.background.surfaceRaised,
    "--venext-text": VenextColorHierarchy.text.primary,
    "--venext-text-secondary": VenextColorHierarchy.text.secondary,
    "--venext-text-muted": VenextColorHierarchy.text.muted,
    "--venext-accent": VenextColorHierarchy.accent.venext,
    "--venext-accent-strong": VenextColorHierarchy.accent.venextStrong,
    "--venext-accent-soft": VenextColorHierarchy.accent.venextSoft,
    "--venext-warning": VenextColorHierarchy.accent.warning,
    "--venext-danger": VenextColorHierarchy.accent.danger,
    "--venext-border": VenextColorHierarchy.border.subtle,
    "--venext-border-active": VenextColorHierarchy.border.active,
    "--venext-card-radius": VenextSurfaceTokens.radius.card,
    "--venext-control-radius": VenextSurfaceTokens.radius.control,
    "--venext-card-shadow": VenextSurfaceTokens.shadow.card,
    "--venext-nav-shadow": VenextSurfaceTokens.shadow.nav,
  };
}
