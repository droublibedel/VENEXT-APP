export type CommercialTemperature = "COLD" | "STABLE" | "ACTIVE" | "HOT" | "CRITICAL";

export type EconomicStateRow = {
  activeDiscussionCount: number;
  negotiationCount: number;
  recentOrderCount: number;
  demandVelocity: number;
  stockTensionLevel: number;
  visibilityScore: number;
  sponsoredScore: number;
  trustScore: number;
  freshnessScore: number;
  movementIntensity: number;
  activeRetailerInterest: number;
  commercialTemperature: CommercialTemperature;
} | null;

export type LivingCatalogCard = {
  visibilityId: string;
  visibilityType: string;
  product: {
    id: string;
    name: string;
    description: string;
    category: string;
    imageUrls: string[];
    unitLabel: string;
    basePrice: unknown;
    currency: string;
    stockStatus: string;
    stockQuantity: unknown;
    paymentModes: string[];
    qualityBadges: string[];
    sponsorEligible: boolean;
    active: boolean;
  };
  supplier: {
    id: string;
    displayName: string;
    verificationStatus: string;
    commercialId: string;
  };
  economicState: EconomicStateRow;
  traceability: {
    traceabilityEnabled: boolean;
    recallEligible: boolean;
    lotNumber?: string | null;
  } | null;
  discussion: {
    narrativeLines: string[];
    activeNegotiations: number;
    productAnchoredThreads: number;
    recentOrderLineItems: number;
  };
  marketEnergy: {
    pulses: { label: string; intensity: number; horizon: string }[];
    demandHeat: number;
    tensionIndicator: number;
  };
  relevance: {
    relevanceScore: number;
    recommendedVisibility: string;
    sponsoredEligibility: boolean;
  } | null;
};

export type LivingCatalogResponse = {
  relationshipId: string;
  relationshipStatus: string;
  /** Presentation: `active` when DB status is ACCEPTED (Instruction 9A). */
  relationshipStatusUi?: string;
  cards: LivingCatalogCard[];
};
