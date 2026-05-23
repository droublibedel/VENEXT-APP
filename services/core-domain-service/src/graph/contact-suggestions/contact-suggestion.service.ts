import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import {
  ContactSuggestionReason,
  ContactSuggestionSource,
  ContactSuggestionStatus,
  OrgMemberStatus,
  OrganizationCategory,
  RelationshipSource,
  RelationshipStatus,
} from "@prisma/client";
import type { ContactImportDto } from "@venext/shared-contracts";
import { PrismaService } from "../../prisma/prisma.service";
import { canPairCategories } from "../compatibility-matrix";
import { GraphSignalsService } from "../graph-signals.service";

/** Normalize for matching against stored `User.phoneNumber` (digits + optional leading +). */
export function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("+")) return `+${digits}`;
  return digits;
}

function digitsOnlyPhone(raw: string): string {
  return raw.replace(/\D/g, "");
}

function dominantReason(flags: {
  net: boolean;
  interact: boolean;
  city: boolean;
  compat: boolean;
}): ContactSuggestionReason {
  if (flags.net) return ContactSuggestionReason.network_code;
  if (flags.interact) return ContactSuggestionReason.repeated_transaction_signal;
  if (flags.city) return ContactSuggestionReason.same_commercial_zone;
  return ContactSuggestionReason.mutual_phone_contact;
}

@Injectable()
export class ContactSuggestionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly signals: GraphSignalsService,
  ) {}

  async importContacts(dto: ContactImportDto) {
    const membership = await this.prisma.organizationMember.findFirst({
      where: {
        userId: dto.userId,
        organizationId: dto.organizationId,
        status: OrgMemberStatus.ACTIVE,
      },
    });
    if (!membership) {
      throw new ForbiddenException("user_not_member_of_organization");
    }

    const importerOrg = await this.prisma.organization.findUnique({
      where: { id: dto.organizationId },
    });
    if (!importerOrg) throw new BadRequestException("unknown_organization");

    const normalizedInputs = dto.contacts.map(
      (c: { phoneNumber: string; localName?: string }) => ({
      raw: c.phoneNumber,
      normalized: normalizePhone(c.phoneNumber),
      digits: digitsOnlyPhone(c.phoneNumber),
      localName: c.localName,
    }),
    );

    const registeredUsers = await this.prisma.user.findMany();
    const userByDigits = new Map(
      registeredUsers.map((u) => [digitsOnlyPhone(u.phoneNumber), u]),
    );

    const suggestionsOut: Awaited<
      ReturnType<ContactSuggestionService["buildSuggestionRow"]>
    >[] = [];
    const pairedOrgIds = new Set<string>();

    for (const contact of normalizedInputs) {
      const keyDigits =
        contact.digits ||
        digitsOnlyPhone(contact.normalized.replace(/^\+/, ""));
      const matched = userByDigits.get(keyDigits);
      if (!matched || matched.id === dto.userId) continue;

      const memberships = await this.prisma.organizationMember.findMany({
        where: {
          userId: matched.id,
          status: OrgMemberStatus.ACTIVE,
        },
        include: { organization: true },
      });

      for (const m of memberships) {
        const suggestedOrgId = m.organization.id;
        if (suggestedOrgId === dto.organizationId) continue;

        const accepted = await this.prisma.relationship.findFirst({
          where: {
            status: RelationshipStatus.ACCEPTED,
            OR: [
              {
                upstreamOrganizationId: dto.organizationId,
                downstreamOrganizationId: suggestedOrgId,
              },
              {
                upstreamOrganizationId: suggestedOrgId,
                downstreamOrganizationId: dto.organizationId,
              },
            ],
          },
        });
        if (accepted) continue;

        const dedupeKey = `${dto.organizationId}:${suggestedOrgId}`;
        if (pairedOrgIds.has(dedupeKey)) continue;
        pairedOrgIds.add(dedupeKey);

        const row = await this.buildSuggestionRow({
          dto,
          importerOrg,
          suggestedOrg: m.organization,
        });
        suggestionsOut.push(row);
      }
    }

    await this.signals.contactSuggestionsGenerated(dto.userId, suggestionsOut.length);

    return suggestionsOut.sort((a, b) => b.score - a.score);
  }

  private async buildSuggestionRow(params: {
    dto: ContactImportDto;
    importerOrg: {
      id: string;
      city: string;
      category: OrganizationCategory;
    };
    suggestedOrg: {
      id: string;
      displayName: string;
      city: string;
      category: OrganizationCategory;
    };
  }) {
    const { dto, importerOrg, suggestedOrg } = params;
    let score = 50;

    const sameCity =
      importerOrg.city.toLowerCase() === suggestedOrg.city.toLowerCase();
    if (sameCity) score += 10;

    const compat = canPairCategories(
      importerOrg.category,
      suggestedOrg.category,
    );
    if (compat) score += 15;

    const netRel = await this.prisma.relationship.findFirst({
      where: {
        source: RelationshipSource.NETWORK_CODE,
        OR: [
          {
            requesterOrganizationId: dto.organizationId,
            receiverOrganizationId: suggestedOrg.id,
          },
          {
            requesterOrganizationId: suggestedOrg.id,
            receiverOrganizationId: dto.organizationId,
          },
        ],
        status: { not: RelationshipStatus.BLOCKED },
      },
    });
    const net = !!netRel;
    if (net) score += 20;

    const prevOrder = await this.prisma.order.findFirst({
      where: {
        OR: [
          {
            buyerOrganizationId: dto.organizationId,
            sellerOrganizationId: suggestedOrg.id,
          },
          {
            buyerOrganizationId: suggestedOrg.id,
            sellerOrganizationId: dto.organizationId,
          },
        ],
      },
    });
    const prevNeg = await this.prisma.negotiation.findFirst({
      where: {
        OR: [
          {
            buyerOrganizationId: dto.organizationId,
            sellerOrganizationId: suggestedOrg.id,
          },
          {
            buyerOrganizationId: suggestedOrg.id,
            sellerOrganizationId: dto.organizationId,
          },
        ],
      },
    });
    const interact = !!(prevOrder ?? prevNeg);
    if (interact) score += 20;

    const reason = dominantReason({
      net,
      interact,
      city: sameCity,
      compat,
    });

    const existing = await this.prisma.contactSuggestion.findFirst({
      where: {
        userId: dto.userId,
        suggestedOrganizationId: suggestedOrg.id,
        status: ContactSuggestionStatus.OPEN,
      },
    });

    const saved = existing
      ? await this.prisma.contactSuggestion.update({
          where: { id: existing.id },
          data: { score, reason },
          include: { suggestedOrganization: true },
        })
      : await this.prisma.contactSuggestion.create({
          data: {
            userId: dto.userId,
            suggestedOrganizationId: suggestedOrg.id,
            score,
            reason,
            source: ContactSuggestionSource.CONTACT_SYNC,
            status: ContactSuggestionStatus.OPEN,
          },
          include: { suggestedOrganization: true },
        });

    return {
      id: saved.id,
      suggestedOrganizationId: suggestedOrg.id,
      score: saved.score,
      reason: saved.reason,
      source: saved.source,
      organizationPreview: {
        displayName: suggestedOrg.displayName,
        category: suggestedOrg.category,
        city: suggestedOrg.city,
      },
    };
  }
}
