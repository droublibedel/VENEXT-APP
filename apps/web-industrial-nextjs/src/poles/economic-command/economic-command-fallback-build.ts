import type {
  EconomicArbitration,
  EconomicCommandBundle,
  EconomicCommandDiagnostics,
  EconomicCommandNarrative,
  EconomicCommandOverview,
  EconomicDecisionRisk,
  EconomicExecutiveSignal,
  EconomicPressureZone,
  EconomicSilentTension,
  EconomicSystemStress,
} from "@venext/shared-contracts";

const FALLBACK_DISCLAIMER =
  "Mode dégradé (18.5A) — agrégation depuis tranches HTTP après échec du bundle. Chaque tranche invoquée côté serveur reste un FULL_COMPOSE ; préférer BUNDLE_FIRST.";

const ZERO_STRESS: EconomicSystemStress = {
  globalStress: 0,
  logisticsStress: 0,
  financialStress: 0,
  relationshipStress: 0,
  coordinationStress: 0,
  silentStress: 0,
  scenarioStress: 0,
  stressMode: "PROXY_HEURISTIC",
  explanation: "Stress non disponible depuis les tranches — placeholder proxy.",
  sourceSignals: ["client:sequential_fallback_missing_stress"],
};

const FALLBACK_NARRATIVE: EconomicCommandNarrative = {
  narrativeMode: "HEURISTIC_EXECUTIVE_SUMMARY",
  lines: [
    "Mode dégradé — données reconstruites depuis les vues partielles.",
    "Ne pas confondre avec un compose bundle complet côté serveur.",
    "Valider les tranches manquantes avant toute lecture exécutive.",
  ],
  dominantPressure: "unknown",
  executiveWarning: "Bundle principal indisponible — hydrate partielle uniquement.",
  recommendedFocus: "Rétablir le chargement bundle summary ou vérifier rôle producteur / drapeaux.",
  limitations: "Les tranches slice déclenchent chacune un FULL_COMPOSE sur le serveur — coût identique au bundle pour chaque requête.",
};

const FALLBACK_DIAGNOSTICS: EconomicCommandDiagnostics = {
  heuristicOnly: true,
  advisoryOnly: true,
  symbolicProjection: true,
  nonOperationalExecution: true,
  proxySignals: true,
  sourceMode: "SEQUENTIAL_SLICE_FALLBACK",
  projectionMode: "summary",
  payloadWeightClass: "compact",
  composeCacheHit: false,
  cacheStrategy: "SHORT_TTL_COMMAND_CACHE",
  composeCount: 0,
  composePlan: {
    propagationCompose: 0,
    coordinationCompose: 0,
    scenariosCompose: 0,
    memoryCompose: 0,
    dataIntelligenceCompose: 0,
    commandCompose: 0,
  },
  composeCountMeaning: "logical_pipeline_steps_not_cpu_cost",
  costDisclosure:
    "Reconstruction client après échec bundle — les tranches HTTP invoquent chacune un FULL_COMPOSE serveur ; préférer BUNDLE_FIRST.",
  reusedBundles: [],
  sourceBundlesEmbedded: false,
};

function placeholderOverview(organizationId: string): EconomicCommandOverview {
  const ts = new Date().toISOString();
  return {
    version: "1",
    generatedAt: ts,
    organizationId,
    policy: "ACTIVE",
    headline: "Commande économique — mode dégradé (tranches partielles).",
    executivePosture: "UNKNOWN",
    dominantStress: "none",
    tensionCount: 0,
    pressureZoneCount: 0,
    riskCount: 0,
    arbitrationCount: 0,
    signalDigest: "Agrégat client — non issu d’un compose bundle unique.",
  };
}

export type EconomicCommandSliceBag = {
  overview: EconomicCommandOverview | null;
  pressureZones: EconomicPressureZone[] | null;
  decisionRisks: EconomicDecisionRisk[] | null;
  arbitrations: EconomicArbitration[] | null;
  silentTensions: EconomicSilentTension[] | null;
  narrative: EconomicCommandNarrative | null;
  systemStress: EconomicSystemStress | null;
};

export function buildEconomicCommandBundleFromSlices(
  organizationId: string,
  bag: EconomicCommandSliceBag,
): { bundle: EconomicCommandBundle; missingSlices: string[] } {
  const missingSlices: string[] = [];
  if (!bag.overview) missingSlices.push("overview");
  if (!bag.pressureZones) missingSlices.push("pressure-zones");
  if (!bag.decisionRisks) missingSlices.push("risks");
  if (!bag.arbitrations) missingSlices.push("arbitrations");
  if (!bag.silentTensions) missingSlices.push("tensions");
  if (!bag.narrative) missingSlices.push("narrative");
  if (!bag.systemStress) missingSlices.push("stress");

  const overview = bag.overview ?? placeholderOverview(organizationId);
  const pressureZones = bag.pressureZones ?? [];
  const decisionRisks = bag.decisionRisks ?? [];
  const arbitrations = bag.arbitrations ?? [];
  const silentTensions = bag.silentTensions ?? [];
  const narrative = bag.narrative ?? FALLBACK_NARRATIVE;
  const systemStress = bag.systemStress ?? ZERO_STRESS;

  const bundle: EconomicCommandBundle = {
    version: "1",
    generatedAt: overview.generatedAt,
    organizationId,
    policy: "ACTIVE",
    disclaimer: FALLBACK_DISCLAIMER,
    overview,
    pressureZones,
    decisionRisks,
    arbitrations,
    systemStress,
    silentTensions,
    narrative,
    executiveSignals: [] as EconomicExecutiveSignal[],
    diagnostics: FALLBACK_DIAGNOSTICS,
    sourceMode: "SEQUENTIAL_SLICE_FALLBACK",
    degraded: true,
    missingSlices: Array.from(new Set(missingSlices)),
  };

  return { bundle, missingSlices: bundle.missingSlices ?? [] };
}

/** True when a slice HTTP load failed during sequential client fallback (18.5A). */
export function isEconomicCommandSliceMissing(bundle: EconomicCommandBundle | null, sliceKey: string): boolean {
  return Boolean(bundle?.degraded && bundle.missingSlices?.includes(sliceKey));
}
