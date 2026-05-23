import type { VenextRoleFacet } from "@venext/shared-types";

export type AiAssistantPersona =
  | "COMMERCIAL"
  | "LOGISTICS"
  | "FINANCE"
  | "INDUSTRIAL_SAFETY";

export interface AiCompletionRequest {
  prompt: string;
  persona: AiAssistantPersona;
  facets: readonly VenextRoleFacet[];
  /** Geo context for future geo-intelligence tools */
  geo?: { lat: number; lng: number; label?: string };
  proactive?: boolean;
}

export interface EnrichedAiCompletionRequest extends AiCompletionRequest {
  contextDigest: string;
}
