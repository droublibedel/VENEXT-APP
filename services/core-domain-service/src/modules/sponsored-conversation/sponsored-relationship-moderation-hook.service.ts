import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { RelationshipStatus } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import { SponsoredRelationshipSyncService, type SponsoredRelationshipSyncResult } from "./sponsored-relationship-sync.service";

const TERMINAL = new Set<RelationshipStatus>([
  RelationshipStatus.ACCEPTED,
  RelationshipStatus.REJECTED,
  RelationshipStatus.BLOCKED,
  RelationshipStatus.SUSPENDED,
]);

/**
 * Instruction 20.2B — appelé **après** qu’un humain / back-office a déjà persisté le statut `Relationship`.
 * Ne modifie **jamais** la relation (pas d’auto-accept) : déclenche uniquement la synchro fenêtre / analytics / WS.
 */
@Injectable()
export class SponsoredRelationshipModerationHookService {
  private readonly log = new Logger(SponsoredRelationshipModerationHookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sync: SponsoredRelationshipSyncService,
  ) {}

  async handleRelationshipModerationDecision(relationshipId: string): Promise<
    SponsoredRelationshipSyncResult & {
      moderationDecisionSource: "POST_HUMAN_RELATIONSHIP_UPDATE";
      humanDecisionRequired: true;
      automaticRelationshipAcceptance: false;
    }
  > {
    const rid = relationshipId?.trim();
    if (!rid) throw new BadRequestException({ code: "relationship_id_required" });

    const rel = await this.prisma.relationship.findUnique({
      where: { id: rid },
      select: { id: true, status: true },
    });
    if (!rel) throw new NotFoundException(rid);
    if (!TERMINAL.has(rel.status)) {
      throw new BadRequestException({
        code: "relationship_not_in_terminal_state_for_sync",
        detail: "Instruction 20.2B — la synchro sponsorisée attend un statut déjà décidé (ACCEPTED / REJECTED / BLOCKED / SUSPENDED).",
      });
    }

    this.log.log(
      JSON.stringify({
        job: "sponsored_relationship_moderation_hook",
        phase: "started",
        relationshipId: rid,
        relationshipStatus: rel.status,
        moderationDecisionSource: "POST_HUMAN_RELATIONSHIP_UPDATE",
        humanDecisionRequired: true,
        automaticRelationshipAcceptance: false,
      }),
    );

    const out = await this.sync.syncFromRelationshipId(rid);
    this.log.log(
      JSON.stringify({
        job: "sponsored_relationship_moderation_hook",
        phase: "completed",
        relationshipId: rid,
        synced: out.synced,
        skipped: out.skipped,
      }),
    );

    return {
      ...out,
      moderationDecisionSource: "POST_HUMAN_RELATIONSHIP_UPDATE",
      humanDecisionRequired: true,
      automaticRelationshipAcceptance: false,
    };
  }
}
