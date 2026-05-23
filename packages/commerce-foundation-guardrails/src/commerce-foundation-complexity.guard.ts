/** Internal dev-only UX complexity guard — NOT user-visible analytics (Instruction 20.74-A). */

export type CommerceComplexityInput = {
  panelCount: number;
  quickActionCount: number;
  timelineStepCount: number;
  formFieldCount: number;
  modalCount?: number;
  navigationDepth?: number;
};

export type CommerceComplexityScore = {
  score: number;
  level: "low" | "medium" | "high";
  flags: string[];
};

const WEIGHTS = {
  panel: 8,
  action: 3,
  timeline: 2,
  field: 4,
  modal: 15,
  depth: 10,
} as const;

export function buildCommerceComplexityScore(input: CommerceComplexityInput): CommerceComplexityScore {
  const flags: string[] = [];
  let score = 0;

  score += input.panelCount * WEIGHTS.panel;
  score += input.quickActionCount * WEIGHTS.action;
  score += input.timelineStepCount * WEIGHTS.timeline;
  score += input.formFieldCount * WEIGHTS.field;
  score += (input.modalCount ?? 0) * WEIGHTS.modal;
  score += ((input.navigationDepth ?? 1) - 1) * WEIGHTS.depth;

  if (input.panelCount > 4) flags.push("too-many-panels");
  if (input.quickActionCount > 8) flags.push("too-many-actions");
  if (input.timelineStepCount > 12) flags.push("timeline-heavy");
  if ((input.modalCount ?? 0) > 0) flags.push("modals-present");
  if ((input.navigationDepth ?? 1) > 2) flags.push("deep-navigation");

  let level: CommerceComplexityScore["level"] = "low";
  if (score >= 80) level = "high";
  else if (score >= 40) level = "medium";

  return { score, level, flags };
}
