import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";

import { PrismaService } from "../../prisma/prisma.service";
import {
  buildSponsoredExposureAggregationKey,
  type SponsoredExposureEventType,
  utcDateBucketIso,
} from "./sponsored-exposure-analytics.helper";

type Db = Prisma.TransactionClient | PrismaService;

@Injectable()
export class SponsoredExposureAnalyticsService {
  private db(client?: Db): Db {
    return client ?? this.prisma;
  }

  constructor(private readonly prisma: PrismaService) {}

  async bumpImpression(
    client: Db | undefined,
    input: {
      sponsorOrganizationId: string;
      campaignId: string;
      region: string | null;
      city: string | null;
      district: string | null;
      targetActorType: string;
      at?: Date;
    },
  ): Promise<void> {
    const at = input.at ?? new Date();
    const dateUtc = utcDateBucketIso(at);
    const eventType: SponsoredExposureEventType = "IMPRESSION";
    const aggregationKey = buildSponsoredExposureAggregationKey({
      campaignId: input.campaignId,
      sponsorOrganizationId: input.sponsorOrganizationId,
      region: input.region,
      city: input.city,
      district: input.district,
      targetActorType: input.targetActorType,
      eventType,
      dateUtc,
    });
    const db = this.db(client);
    await db.sponsoredExposureAnalytics.upsert({
      where: { aggregationKey },
      create: {
        id: randomUUID(),
        aggregationKey,
        sponsorOrganizationId: input.sponsorOrganizationId,
        campaignId: input.campaignId,
        region: input.region,
        city: input.city,
        district: input.district,
        targetActorType: input.targetActorType,
        eventType,
        impressions: 1,
      },
      update: { impressions: { increment: 1 } },
    });
  }

  async bumpOpenBundle(
    client: Db | undefined,
    input: {
      sponsorOrganizationId: string;
      campaignId: string;
      region: string | null;
      city: string | null;
      district: string | null;
      targetActorType: string;
      at?: Date;
    },
  ): Promise<void> {
    const at = input.at ?? new Date();
    const dateUtc = utcDateBucketIso(at);
    const eventType: SponsoredExposureEventType = "OPEN";
    const aggregationKey = buildSponsoredExposureAggregationKey({
      campaignId: input.campaignId,
      sponsorOrganizationId: input.sponsorOrganizationId,
      region: input.region,
      city: input.city,
      district: input.district,
      targetActorType: input.targetActorType,
      eventType,
      dateUtc,
    });
    const db = this.db(client);
    await db.sponsoredExposureAnalytics.upsert({
      where: { aggregationKey },
      create: {
        id: randomUUID(),
        aggregationKey,
        sponsorOrganizationId: input.sponsorOrganizationId,
        campaignId: input.campaignId,
        region: input.region,
        city: input.city,
        district: input.district,
        targetActorType: input.targetActorType,
        eventType,
        opens: 1,
        conversationsStarted: 1,
        negotiationsTriggered: 1,
      },
      update: {
        opens: { increment: 1 },
        conversationsStarted: { increment: 1 },
        negotiationsTriggered: { increment: 1 },
      },
    });
  }

  async bumpRelationshipRequest(
    client: Db | undefined,
    input: {
      sponsorOrganizationId: string;
      campaignId: string;
      region: string | null;
      city: string | null;
      district: string | null;
      targetActorType: string;
      at?: Date;
    },
  ): Promise<void> {
    const at = input.at ?? new Date();
    const dateUtc = utcDateBucketIso(at);
    const eventType: SponsoredExposureEventType = "RELATIONSHIP_REQUEST";
    const aggregationKey = buildSponsoredExposureAggregationKey({
      campaignId: input.campaignId,
      sponsorOrganizationId: input.sponsorOrganizationId,
      region: input.region,
      city: input.city,
      district: input.district,
      targetActorType: input.targetActorType,
      eventType,
      dateUtc,
    });
    const db = this.db(client);
    await db.sponsoredExposureAnalytics.upsert({
      where: { aggregationKey },
      create: {
        id: randomUUID(),
        aggregationKey,
        sponsorOrganizationId: input.sponsorOrganizationId,
        campaignId: input.campaignId,
        region: input.region,
        city: input.city,
        district: input.district,
        targetActorType: input.targetActorType,
        eventType,
        relationshipRequests: 1,
      },
      update: { relationshipRequests: { increment: 1 } },
    });
  }

  /** Instruction 20.2B — agrégat post-modération (distinct du bucket générique RELATIONSHIP_ACCEPTED si utilisé ailleurs). */
  async bumpRelationshipAcceptedSynced(
    client: Db | undefined,
    input: {
      sponsorOrganizationId: string;
      campaignId: string;
      region: string | null;
      city: string | null;
      district: string | null;
      targetActorType: string;
      at?: Date;
    },
  ): Promise<void> {
    const at = input.at ?? new Date();
    const dateUtc = utcDateBucketIso(at);
    const eventType: SponsoredExposureEventType = "RELATIONSHIP_ACCEPTED_SYNCED";
    const aggregationKey = buildSponsoredExposureAggregationKey({
      campaignId: input.campaignId,
      sponsorOrganizationId: input.sponsorOrganizationId,
      region: input.region,
      city: input.city,
      district: input.district,
      targetActorType: input.targetActorType,
      eventType,
      dateUtc,
    });
    const db = this.db(client);
    await db.sponsoredExposureAnalytics.upsert({
      where: { aggregationKey },
      create: {
        id: randomUUID(),
        aggregationKey,
        sponsorOrganizationId: input.sponsorOrganizationId,
        campaignId: input.campaignId,
        region: input.region,
        city: input.city,
        district: input.district,
        targetActorType: input.targetActorType,
        eventType,
        relationshipAccepted: 1,
      },
      update: { relationshipAccepted: { increment: 1 } },
    });
  }

  /** Instruction 20.2B — compteur léger sur bucket dédié (champ impressions = signal de sync rejetée). */
  async bumpRelationshipRejectedSynced(
    client: Db | undefined,
    input: {
      sponsorOrganizationId: string;
      campaignId: string;
      region: string | null;
      city: string | null;
      district: string | null;
      targetActorType: string;
      at?: Date;
    },
  ): Promise<void> {
    const at = input.at ?? new Date();
    const dateUtc = utcDateBucketIso(at);
    const eventType: SponsoredExposureEventType = "RELATIONSHIP_REJECTED_SYNCED";
    const aggregationKey = buildSponsoredExposureAggregationKey({
      campaignId: input.campaignId,
      sponsorOrganizationId: input.sponsorOrganizationId,
      region: input.region,
      city: input.city,
      district: input.district,
      targetActorType: input.targetActorType,
      eventType,
      dateUtc,
    });
    const db = this.db(client);
    await db.sponsoredExposureAnalytics.upsert({
      where: { aggregationKey },
      create: {
        id: randomUUID(),
        aggregationKey,
        sponsorOrganizationId: input.sponsorOrganizationId,
        campaignId: input.campaignId,
        region: input.region,
        city: input.city,
        district: input.district,
        targetActorType: input.targetActorType,
        eventType,
        impressions: 1,
      },
      update: { impressions: { increment: 1 } },
    });
  }

  async bumpWindowExpired(
    client: Db | undefined,
    input: {
      sponsorOrganizationId: string;
      campaignId: string;
      region: string | null;
      city: string | null;
      district: string | null;
      targetActorType: string;
      at?: Date;
    },
  ): Promise<void> {
    const at = input.at ?? new Date();
    const dateUtc = utcDateBucketIso(at);
    const eventType: SponsoredExposureEventType = "WINDOW_EXPIRED";
    const aggregationKey = buildSponsoredExposureAggregationKey({
      campaignId: input.campaignId,
      sponsorOrganizationId: input.sponsorOrganizationId,
      region: input.region,
      city: input.city,
      district: input.district,
      targetActorType: input.targetActorType,
      eventType,
      dateUtc,
    });
    const db = this.db(client);
    await db.sponsoredExposureAnalytics.upsert({
      where: { aggregationKey },
      create: {
        id: randomUUID(),
        aggregationKey,
        sponsorOrganizationId: input.sponsorOrganizationId,
        campaignId: input.campaignId,
        region: input.region,
        city: input.city,
        district: input.district,
        targetActorType: input.targetActorType,
        eventType,
        impressions: 1,
      },
      update: { impressions: { increment: 1 } },
    });
  }
}
