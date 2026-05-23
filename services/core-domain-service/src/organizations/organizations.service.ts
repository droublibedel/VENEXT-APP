import { Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { allocateUniqueCommercialId } from "./commercial-id";

const orgSelect = {
  id: true,
  commercialId: true,
  ownerUserId: true,
  displayName: true,
  legalName: true,
  activityLabel: true,
  actorType: true,
  category: true,
  profileImageUrl: true,
  country: true,
  city: true,
  commune: true,
  address: true,
  verificationStatus: true,
  credibilityScore: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.organization.findMany({
      select: orgSelect,
      orderBy: { createdAt: "desc" },
      take: 500,
    });
  }

  async findOne(id: string) {
    const row = await this.prisma.organization.findUnique({
      where: { id },
      select: orgSelect,
    });
    if (!row) throw new NotFoundException(id);
    return row;
  }

  /**
   * Creates an organization and assigns a unique immutable 10-digit commercialId.
   */
  async createOrganization(
    data: Omit<Prisma.OrganizationCreateInput, "commercialId">,
  ) {
    const commercialId = await allocateUniqueCommercialId(
      this.prisma.organization,
    );
    return this.prisma.organization.create({
      data: {
        ...data,
        commercialId,
      },
      select: orgSelect,
    });
  }
}
