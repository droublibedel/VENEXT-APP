import { Injectable } from "@nestjs/common";

export type MockConversationInsight = {
  provider: "mock-conversation-insight";
  summary: string[];
  risks: string[];
  suggestions: string[];
};

/**
 * Mock AI — no LLM (Instruction 7 §12).
 */
@Injectable()
export class MockConversationInsightService {
  insightForThread(threadId: string, negotiationStatus?: string): MockConversationInsight {
    return {
      provider: "mock-conversation-insight",
      summary: [
        `Thread ${threadId.slice(0, 8)}… — synthèse négociation (mock).`,
        `Statut négociation observé: ${negotiationStatus ?? "inconnu"}.`,
      ],
      risks: [
        "Tension paiement possible si délai logistique > 48h (mock).",
        "Vérifier alignement stock vs quantité acceptée avant conversion panier.",
      ],
      suggestions: [
        "Proposer créneau livraison matinal pour désengorger corridor SN-THIES.",
        "Relancer preuve paiement mobile money si panier converti (mock).",
      ],
    };
  }
}
