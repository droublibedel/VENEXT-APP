/** Niveaux de proximité commerciale terrain (GROSSISTE-B-04). */
export type ProximityLevel = 1 | 2 | 3 | 4;

const ACTIVITY_CLUSTERS: Record<string, string[]> = {
  chaussures: ["chaussures", "sacs", "vêtements", "accessoires", "mode"],
  vetements: ["vêtements", "chaussures", "sacs", "accessoires", "mode"],
  sacs: ["sacs", "chaussures", "vêtements", "accessoires"],
  cosmétiques: ["cosmétiques", "beauté", "parfums", "soins"],
  telephones: ["téléphones", "accessoires tech", "électronique"],
  alimentation: ["alimentation", "boissons", "épicerie"],
  commerce: ["commerce", "distribution", "grossiste", "détaillant"],
};

const BLOCKED_PAIRS: Array<[string, string]> = [
  ["chaussures", "matelas"],
  ["chaussures", "matériaux industriels"],
  ["vêtements", "pièces moteur"],
  ["cosmétiques", "pièces moteur"],
  ["vêtements", "pièces moteur"],
  ["chaussures", "matelas"],
];

function normalizeActivity(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function clusterFor(activity: string): string[] {
  const n = normalizeActivity(activity);
  for (const [key, members] of Object.entries(ACTIVITY_CLUSTERS)) {
    if (n.includes(key) || members.some((m) => n.includes(normalizeActivity(m)))) {
      return members;
    }
  }
  return ["commerce"];
}

export function proximityLevel(viewerActivity: string, candidateActivity: string): ProximityLevel | null {
  const v = normalizeActivity(viewerActivity);
  const c = normalizeActivity(candidateActivity);
  if (!v || !c) return null;

  for (const [a, b] of BLOCKED_PAIRS) {
    const na = normalizeActivity(a);
    const nb = normalizeActivity(b);
    if ((v.includes(na) && c.includes(nb)) || (v.includes(nb) && c.includes(na))) return null;
  }

  if (v === c || v.includes(c) || c.includes(v)) return 1;

  const vCluster = clusterFor(viewerActivity);
  const cCluster = clusterFor(candidateActivity);
  if (vCluster.some((x) => cCluster.includes(x))) {
    const overlap = vCluster.filter((x) => cCluster.includes(x));
    if (overlap.length >= 2) return 2;
    return 3;
  }

  if (vCluster[0] === "commerce" || cCluster[0] === "commerce") return 4;
  return null;
}

export function isCommerciallyCompatible(viewerActivity: string, candidateActivity: string): boolean {
  return proximityLevel(viewerActivity, candidateActivity) !== null;
}

export const CommercialInterestProximityEngine = {
  proximityLevel,
  isCommerciallyCompatible,
  clusterFor,
};
