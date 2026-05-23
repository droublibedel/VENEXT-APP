import { Injectable } from "@nestjs/common";
import {
  Prisma,
  RelationshipSource,
  RelationshipStatus,
} from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

const relInclude = {
  requester: true,
  receiver: true,
  upstreamOrg: true,
  downstreamOrg: true,
} as const;

@Injectable()
export class RelationshipRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.relationship.findUnique({
      where: { id },
      include: relInclude,
    });
  }

  findPendingBetweenOrgPair(a: string, b: string) {
    return this.prisma.relationship.findFirst({
      where: {
        status: RelationshipStatus.PENDING,
        OR: [
          {
            requesterOrganizationId: a,
            receiverOrganizationId: b,
          },
          {
            requesterOrganizationId: b,
            receiverOrganizationId: a,
          },
        ],
      },
    });
  }

  createInvite(data: Prisma.RelationshipCreateInput) {
    return this.prisma.relationship.create({ data });
  }

  update(id: string, data: Prisma.RelationshipUpdateInput) {
    return this.prisma.relationship.update({
      where: { id },
      data,
      include: relInclude,
    });
  }

  listReceivedPending(organizationId: string) {
    return this.prisma.relationship.findMany({
      where: {
        receiverOrganizationId: organizationId,
        status: RelationshipStatus.PENDING,
      },
      include: relInclude,
      orderBy: { createdAt: "desc" },
    });
  }

  listSentPending(organizationId: string) {
    return this.prisma.relationship.findMany({
      where: {
        requesterOrganizationId: organizationId,
        status: RelationshipStatus.PENDING,
      },
      include: relInclude,
      orderBy: { createdAt: "desc" },
    });
  }

  listActive(organizationId: string) {
    return this.prisma.relationship.findMany({
      where: {
        status: RelationshipStatus.ACCEPTED,
        OR: [
          { upstreamOrganizationId: organizationId },
          { downstreamOrganizationId: organizationId },
        ],
      },
      include: relInclude,
      orderBy: { acceptedAt: "desc" },
    });
  }

  acceptedBetween(orgA: string, orgB: string) {
    return this.prisma.relationship.findFirst({
      where: {
        status: RelationshipStatus.ACCEPTED,
        OR: [
          {
            upstreamOrganizationId: orgA,
            downstreamOrganizationId: orgB,
          },
          {
            upstreamOrganizationId: orgB,
            downstreamOrganizationId: orgA,
          },
        ],
      },
    });
  }
}
