import { Injectable } from "@nestjs/common";

import { RelationalSectorPolicyService } from "./relational-sector-policy.service";

@Injectable()
export class RelationalSectorExpansionService {
  constructor(private readonly policy: RelationalSectorPolicyService) {}

  expansionPotentialFromSignals(input: {
    expansionCapacity: number;
    diversificationGap: number;
    oligopolyRisk: number;
    peerCount: number;
  }): number {
    return this.policy.clampInt(
      input.expansionCapacity * 0.62 -
        input.diversificationGap * 0.28 -
        input.oligopolyRisk * 0.18 +
        (input.peerCount < 5 ? 8 : 0),
    );
  }

  buildOpportunities(input: { sectorSlug: string; expansionPotentialScore: number; concentration: number }[]) {
    return input
      .map((r) => ({
        sectorSlug: r.sectorSlug,
        score: this.policy.clampInt(r.expansionPotentialScore - r.concentration * 0.25 + 10),
        narrative: `Lecture analytique: marge d’expansion corridor pour ${r.sectorSlug} (potentiel ${r.expansionPotentialScore}, concentration ${r.concentration}).`.slice(
          0,
          600,
        ),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
  }
}
