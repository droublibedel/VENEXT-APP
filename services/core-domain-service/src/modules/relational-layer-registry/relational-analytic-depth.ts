/**
 * Instruction 20.44 — analytic depth classification for UI & governance.
 */

export type RelationalAnalyticDepth =
  | "operational"
  | "strategic"
  | "executive"
  | "macro"
  | "observatory";

export type RelationalLayerDepthEntry = {
  instruction: string;
  layerSlug: string;
  depth: RelationalAnalyticDepth;
  level5Order: number;
};

export const RELATIONAL_LEVEL_5_DEPTH_CLASSIFICATION: readonly RelationalLayerDepthEntry[] = [
  { instruction: "20.28", layerSlug: "relational-economic-sovereignty", depth: "macro", level5Order: 1 },
  { instruction: "20.29", layerSlug: "relational-economic-recovery", depth: "macro", level5Order: 2 },
  { instruction: "20.30", layerSlug: "relational-economic-governance", depth: "macro", level5Order: 3 },
  { instruction: "20.31", layerSlug: "relational-economic-arbitration", depth: "macro", level5Order: 4 },
  { instruction: "20.32", layerSlug: "relational-economic-stabilization", depth: "macro", level5Order: 5 },
  { instruction: "20.33", layerSlug: "relational-economic-monitoring", depth: "executive", level5Order: 6 },
  { instruction: "20.34", layerSlug: "relational-executive-orchestration", depth: "executive", level5Order: 7 },
  { instruction: "20.35", layerSlug: "relational-institutional-reporting", depth: "executive", level5Order: 8 },
  { instruction: "20.36", layerSlug: "relational-strategic-intelligence", depth: "strategic", level5Order: 9 },
  { instruction: "20.37", layerSlug: "relational-strategic-command", depth: "strategic", level5Order: 10 },
  { instruction: "20.38", layerSlug: "relational-executive-operations", depth: "executive", level5Order: 11 },
  { instruction: "20.39", layerSlug: "relational-executive-control-room", depth: "executive", level5Order: 12 },
  { instruction: "20.40", layerSlug: "relational-executive-strategic-synthesis", depth: "executive", level5Order: 13 },
  { instruction: "20.41", layerSlug: "relational-global-executive-supervision", depth: "observatory", level5Order: 14 },
  { instruction: "20.42", layerSlug: "relational-strategic-observatory", depth: "observatory", level5Order: 15 },
  { instruction: "20.43", layerSlug: "relational-macro-observatory-governance", depth: "observatory", level5Order: 16 },
] as const;

export function getLayersByDepth(depth: RelationalAnalyticDepth): readonly RelationalLayerDepthEntry[] {
  return RELATIONAL_LEVEL_5_DEPTH_CLASSIFICATION.filter((e) => e.depth === depth);
}
