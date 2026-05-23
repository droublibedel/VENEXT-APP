/**
 * Instruction 17A — lightweight summaries for cross-pole data intelligence (no duplicate engines).
 */
export type PoleIntelligenceSummary = {
  available: boolean;
  source: string;
  keySignals: string[];
  riskSignals: string[];
  opportunitySignals: string[];
  territorySignals: string[];
  confidence: number;
  /** Optional numeric hints for cross-pole correlation (no duplicate engines). */
  metrics?: Record<string, number>;
};
