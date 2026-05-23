/**
 * Instruction 15A — normalize territory / zone labels for correlation across
 * org geo, economic signals, and corridor strings.
 */

export type TerritoryNormalization = {
  normalizedCode: string;
  country: string;
  city: string;
  confidence: number;
};

const COUNTRY_ALIASES: Record<string, string> = {
  sn: "SN",
  senegal: "SN",
  sénégal: "SN",
  ci: "CI",
  "côte d'ivoire": "CI",
  "cote d'ivoire": "CI",
  "côte divoire": "CI",
  cotedivoire: "CI",
  ivoire: "CI",
  ml: "ML",
  mali: "ML",
  bf: "BF",
  "burkina faso": "BF",
  burkina: "BF",
  gh: "GH",
  ghana: "GH",
  ng: "NG",
  nigeria: "NG",
};

const CITY_ALIASES: Record<string, string> = {
  dakar: "DAKAR",
  thies: "THIES",
  thiès: "THIES",
  abidjan: "ABIDJAN",
  bouake: "BOUAKE",
  bamako: "BAMAKO",
  ouagadougou: "OUAGADOUGOU",
  accra: "ACCRA",
  lagos: "LAGOS",
};

function stripDiacritics(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "");
}

function tokenize(raw: string): string[] {
  const flat = stripDiacritics(raw)
    .replace(/[,|]+/g, "/")
    .replace(/[_\s]+/g, "/")
    .replace(/-+/g, "/")
    .split("/")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  return flat;
}

/**
 * Maps inputs like `SN-Dakar`, `SN/Dakar`, `sn_dakar`, `Sénégal / Dakar`, `Abidjan` (city-only).
 */
export function normalizeTerritoryLabel(raw: string): TerritoryNormalization {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { normalizedCode: "UNKNOWN", country: "", city: "", confidence: 0 };
  }

  const parts = tokenize(trimmed);
  if (parts.length === 0) {
    return { normalizedCode: "UNKNOWN", country: "", city: "", confidence: 0 };
  }

  let country = "";
  let city = "";
  let confidence = 0.55;

  for (const p of parts) {
    const cc = COUNTRY_ALIASES[p];
    if (cc) {
      country = cc;
      confidence = Math.max(confidence, 0.82);
      continue;
    }
    const cty = CITY_ALIASES[p] ?? p.toUpperCase();
    if (!city && cty.length >= 3) {
      city = cty.toUpperCase();
      confidence = Math.max(confidence, parts.length > 1 ? 0.78 : 0.42);
    }
  }

  if (!country && parts.length === 1) {
    const only = parts[0]!;
    const cty = CITY_ALIASES[only];
    if (cty) {
      city = cty;
      if (cty === "DAKAR" || cty === "THIES") country = "SN";
      if (cty === "ABIDJAN" || cty === "BOUAKE") country = "CI";
      if (cty === "BAMAKO") country = "ML";
      confidence = country ? 0.72 : 0.38;
    } else if (only.length === 2) {
      country = only.toUpperCase();
      confidence = 0.55;
    }
  }

  if (country && city) {
    return {
      normalizedCode: `${country}_${city}`,
      country,
      city,
      confidence: Math.min(1, confidence + 0.05),
    };
  }
  if (country && !city) {
    return { normalizedCode: `${country}_UNKNOWN`, country, city: "", confidence: confidence * 0.85 };
  }
  if (!country && city) {
    return { normalizedCode: `XX_${city}`, country: "", city, confidence };
  }

  const joined = parts.map((p) => p.toUpperCase()).join("_");
  return { normalizedCode: joined.slice(0, 48) || "UNKNOWN", country, city, confidence: 0.35 };
}

/**
 * Instruction 16A — derive a stable territory correlation code from org geo fields (finance, receivables, etc.).
 * Delegates to {@link normalizeTerritoryLabel} so finance and supply share one normalization path.
 */
export function territoryNormalizedCodeFromOrg(city: string, country: string): string {
  const c = (country || "SN").trim();
  const cityPart = (city || "").trim();
  const raw = cityPart ? `${c} / ${cityPart}` : c;
  return normalizeTerritoryLabel(raw).normalizedCode;
}
