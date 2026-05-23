import { Injectable } from "@nestjs/common";

export type PoleAiVoice = {
  poleSlug: string;
  /** System-style preamble for mock “insight” tone (not an LLM). */
  preamble: string;
  vocabulary: string[];
  exampleQuestions: string[];
};

const VOICES: Record<string, PoleAiVoice> = {
  "supply-logistics": {
    poleSlug: "supply-logistics",
    preamble:
      "You are a logistics field interpreter: movement, dwell, rupture, and corridor risk — never ERP tables.",
    vocabulary: ["dwell", "rupture", "corridor", "convoy", "ETA risk", "anomaly"],
    exampleQuestions: [
      "Which corridor shows latent rupture in the next 18h?",
      "Where is dwell accumulating relative to baseline?",
    ],
  },
  "marketing-activation": {
    poleSlug: "marketing-activation",
    preamble:
      "You are an activation interpreter: diffusion geometry, attention gravity, seasonal shifts.",
    vocabulary: ["diffusion", "attention", "propagation", "seasonal", "basket shift"],
    exampleQuestions: [
      "Where is sponsored propagation outperforming organic gravity?",
      "What weather-linked SKU clusters should we pulse next?",
    ],
  },
  "finance-collections": {
    poleSlug: "finance-collections",
    preamble:
      "You are a collections pressure analyst: velocity, unpaid mass, wallet cadence.",
    vocabulary: ["velocity", "pressure", "unpaid mass", "cadence", "risk tier"],
    exampleQuestions: [
      "Which zones show collection pressure divergence vs last week?",
    ],
  },
  "direction-strategy": {
    poleSlug: "direction-strategy",
    preamble:
      "You are a strategic theatre analyst: macro corridors, partner expansion, tension ridges.",
    vocabulary: ["ridge", "theatre", "macro corridor", "expansion", "tension"],
    exampleQuestions: ["Where is strategic tension rising fastest?"],
  },
  "commercial-network": {
    poleSlug: "commercial-network",
    preamble:
      "You are a network-field analyst: relationship density, inactive voids, growth vectors.",
    vocabulary: ["density", "void", "vector", "relationship health"],
    exampleQuestions: ["Which voids are actionable for field teams this week?"],
  },
  "orders-adv": {
    poleSlug: "orders-adv",
    preamble:
      "You are an order-flow analyst: blockages, negotiation heat, fulfillment chokepoints.",
    vocabulary: ["blockage", "negotiation heat", "chokepoint", "ADV"],
    exampleQuestions: ["Where is negotiation heat decoupled from fulfillment?"],
  },
  "data-intelligence": {
    poleSlug: "data-intelligence",
    preamble:
      "You are a correlation hunter: anomalies, external overlays, forecast cones.",
    vocabulary: ["correlation", "anomaly", "cone", "overlay"],
    exampleQuestions: ["What anomalies correlate with demand spikes in SN-DKR-01?"],
  },
  "industrial-safety": {
    poleSlug: "industrial-safety",
    preamble:
      "You are an industrial safety command interpreter: incidents, hydrant geometry, hazard envelopes.",
    vocabulary: ["incident", "hydrant geometry", "hazard envelope", "mustering"],
    exampleQuestions: ["Where should emergency layers be elevated to CRITICAL?"],
  },
};

@Injectable()
export class PoleAiContextService {
  getVoice(poleSlug: string): PoleAiVoice {
    return (
      VOICES[poleSlug] ?? {
        poleSlug,
        preamble: "Operational pole interpreter (default voice).",
        vocabulary: ["signal", "field", "operational"],
        exampleQuestions: ["What changed in the last 15 minutes?"],
      }
    );
  }
}
