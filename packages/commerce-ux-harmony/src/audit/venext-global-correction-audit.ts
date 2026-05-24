export const VenextColorTokens = {
  background: {
    primary: "#FFFFFF",
    secondary: "#F6F7F5",
    elevated: "#FFFFFF",
  },
  text: {
    primary: "#17201C",
    secondary: "#526059",
    muted: "#66746D",
  },
  accent: {
    primary: "#00A884",
    soft: "rgba(0, 168, 132, 0.08)",
    border: "rgba(0, 168, 132, 0.24)",
  },
  border: {
    default: "rgba(23, 32, 28, 0.1)",
    strong: "rgba(23, 32, 28, 0.16)",
  },
  legacy: {
    darkGreenSurface: "#075E54",
  },
} as const;

export const legacyDarkGreenSurface = VenextColorTokens.legacy.darkGreenSurface;

export type VenextSourceMap = Record<string, string>;

export type VenextForbiddenColorIssue = {
  source: string;
  line: number;
  snippet: string;
  rule:
    | "legacy_dark_green_surface"
    | "legacy_dark_green_rgba"
    | "terminal_surface"
    | "tailwind_dark_green_surface";
};

const FORBIDDEN_COLOR_RULES: { rule: VenextForbiddenColorIssue["rule"]; pattern: RegExp }[] = [
  { rule: "legacy_dark_green_surface", pattern: /#075e54/i },
  { rule: "legacy_dark_green_rgba", pattern: /rgba\(\s*7\s*,\s*94\s*,\s*84/i },
  { rule: "terminal_surface", pattern: /#(?:0b1412|0e1a17|0f1412|121816|1f2c29)\b/i },
  { rule: "tailwind_dark_green_surface", pattern: /\bbg-(?:green|emerald|teal)-(?:800|900|950)\b/i },
];

const AUDIT_ALLOW_LINE =
  /legacyDarkGreenSurface|legacy-dark-green-surface|darkGreenSurface|VENEXT-GLOBAL-CORRECTION|auditVenextForbiddenDarkGreenUsage/i;

export function auditVenextForbiddenDarkGreenUsage(
  sources: VenextSourceMap,
): { ok: boolean; issues: VenextForbiddenColorIssue[] } {
  const issues: VenextForbiddenColorIssue[] = [];

  for (const [source, content] of Object.entries(sources)) {
    if (/node_modules|\.spec\.|\.test\./.test(source)) continue;
    content.split("\n").forEach((line, index) => {
      if (AUDIT_ALLOW_LINE.test(line) || line.trim().startsWith("//")) return;
      for (const rule of FORBIDDEN_COLOR_RULES) {
        if (rule.pattern.test(line)) {
          issues.push({
            source,
            line: index + 1,
            snippet: line.trim().slice(0, 140),
            rule: rule.rule,
          });
        }
      }
    });
  }

  return { ok: issues.length === 0, issues };
}

export type VenextTextContrastCheck = {
  source: string;
  foreground: string;
  background: string;
  largeText?: boolean;
};

export type VenextTextContrastIssue = VenextTextContrastCheck & {
  contrast: number;
  minimum: number;
};

function parseHexColor(hex: string): [number, number, number] | null {
  const normalized = hex.trim().replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return null;
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}

function luminance(hex: string): number | null {
  const rgb = parseHexColor(hex);
  if (!rgb) return null;
  const [r, g, b] = rgb.map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

export function auditVenextTextContrast(
  checks: VenextTextContrastCheck[],
): { ok: boolean; issues: VenextTextContrastIssue[] } {
  const issues: VenextTextContrastIssue[] = [];

  for (const check of checks) {
    const fg = luminance(check.foreground);
    const bg = luminance(check.background);
    if (fg === null || bg === null) continue;
    const lighter = Math.max(fg, bg);
    const darker = Math.min(fg, bg);
    const contrast = (lighter + 0.05) / (darker + 0.05);
    const minimum = check.largeText ? 3 : 4.5;
    if (contrast < minimum) {
      issues.push({ ...check, contrast: Number(contrast.toFixed(2)), minimum });
    }
  }

  return { ok: issues.length === 0, issues };
}

export type VenextDemoDataSnapshot = {
  dashboard?: {
    salesTodayFcfa?: number;
    activePartnerIds?: string[];
  };
  partners?: { id: string; active?: boolean }[];
  products?: { id: string; visible?: boolean }[];
  orders?: { id: string; amountFcfa: number; productIds?: string[]; partnerId?: string }[];
  invitations?: { id: string; partnerId?: string }[];
};

export type VenextDemoDataIntegrityIssue = {
  rule:
    | "sales_mismatch"
    | "missing_active_partner"
    | "missing_order_partner"
    | "missing_order_product"
    | "missing_invitation_partner";
  message: string;
};

export function auditVenextDemoDataIntegrity(
  snapshot: VenextDemoDataSnapshot,
): { ok: boolean; issues: VenextDemoDataIntegrityIssue[] } {
  const issues: VenextDemoDataIntegrityIssue[] = [];
  const partnerIds = new Set((snapshot.partners ?? []).map((partner) => partner.id));
  const productIds = new Set((snapshot.products ?? []).map((product) => product.id));
  const orderSales = (snapshot.orders ?? []).reduce((total, order) => total + order.amountFcfa, 0);

  if (
    typeof snapshot.dashboard?.salesTodayFcfa === "number" &&
    snapshot.dashboard.salesTodayFcfa !== orderSales
  ) {
    issues.push({
      rule: "sales_mismatch",
      message: "Les ventes dashboard doivent être calculées depuis les commandes de démonstration.",
    });
  }

  for (const partnerId of snapshot.dashboard?.activePartnerIds ?? []) {
    if (!partnerIds.has(partnerId)) {
      issues.push({ rule: "missing_active_partner", message: `Partenaire actif introuvable: ${partnerId}.` });
    }
  }

  for (const order of snapshot.orders ?? []) {
    if (order.partnerId && !partnerIds.has(order.partnerId)) {
      issues.push({ rule: "missing_order_partner", message: `Commande ${order.id} liée à un partenaire absent.` });
    }
    for (const productId of order.productIds ?? []) {
      if (!productIds.has(productId)) {
        issues.push({ rule: "missing_order_product", message: `Commande ${order.id} liée à un produit absent.` });
      }
    }
  }

  for (const invitation of snapshot.invitations ?? []) {
    if (invitation.partnerId && !partnerIds.has(invitation.partnerId)) {
      issues.push({
        rule: "missing_invitation_partner",
        message: `Invitation ${invitation.id} liée à un partenaire absent.`,
      });
    }
  }

  return { ok: issues.length === 0, issues };
}
