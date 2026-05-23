import { Injectable } from "@nestjs/common";
import { ContactSuggestionStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { ContactGraphAnalyzerService } from "./contact-graph-analyzer.service";

/**
 * Suggestions from phone overlap + graph + geography heuristics (Instruction 9 §13).
 */
@Injectable()
export class RelationshipSuggestionEngineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contacts: ContactGraphAnalyzerService,
  ) {}

  async suggestionsForUser(userId: string) {
    const mutual = await this.contacts.mutualContactClustersForUser(userId, 2);
    const db = await this.prisma.contactSuggestion.findMany({
      where: { userId, status: ContactSuggestionStatus.OPEN },
      orderBy: { score: "desc" },
      take: 40,
      include: {
        suggestedOrganization: {
          select: {
            id: true,
            displayName: true,
            commercialId: true,
            category: true,
            city: true,
            country: true,
            credibilityScore: true,
            commercialBadges: true,
          },
        },
      },
    });

    return {
      userId,
      mutualContactClusters: mutual,
      graphSuggestions: db.map((s) => ({
        id: s.id,
        score: s.score,
        reason: s.reason,
        source: s.source,
        organization: s.suggestedOrganization,
      })),
    };
  }

  async scorePair(userA: string, userB: string): Promise<{ score: number; signals: string[] }> {
    const phonesA = await this.prisma.userContactSnapshot.findMany({ where: { userId: userA } });
    const phonesB = await this.prisma.userContactSnapshot.findMany({ where: { userId: userB } });
    const setB = new Set(phonesB.map((p) => p.normalizedPhone));
    let overlap = 0;
    for (const p of phonesA) {
      if (setB.has(p.normalizedPhone)) overlap++;
    }
    const signals: string[] = [];
    if (overlap > 0) signals.push("mutual_phone_overlap");
    return { score: 40 + overlap * 20, signals };
  }
}
