import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { RelationshipService } from "../relationship/relationship.service";
import { GraphSignalsService } from "../graph-signals.service";
import { PrismaService } from "../../prisma/prisma.service";

function generateCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 12; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)]!;
  }
  return `VX-${out}`;
}

@Injectable()
export class NetworkCodeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly relationships: RelationshipService,
    private readonly signals: GraphSignalsService,
  ) {}

  async create(params: {
    organizationId: string;
    usageLimit?: number;
    expiresAt?: string;
  }) {
    let code = generateCode();
    for (let attempt = 0; attempt < 5; attempt++) {
      const exists = await this.prisma.networkCode.findUnique({
        where: { code },
      });
      if (!exists) break;
      code = generateCode();
    }

    return this.prisma.networkCode.create({
      data: {
        organizationId: params.organizationId,
        code,
        usageLimit: params.usageLimit ?? null,
        expiresAt: params.expiresAt ? new Date(params.expiresAt) : null,
        active: true,
      },
    });
  }

  async preview(code: string) {
    const row = await this.prisma.networkCode.findUnique({
      where: { code },
      include: { organization: true },
    });
    if (!row) throw new NotFoundException("code_not_found");
    const usageRemaining =
      row.usageLimit != null ? Math.max(0, row.usageLimit - row.usageCount) : null;

    return {
      code: row.code,
      ownerOrganizationId: row.organizationId,
      ownerProfile: {
        displayName: row.organization.displayName,
        activityLabel: row.organization.activityLabel,
        category: row.organization.category,
        city: row.organization.city,
        verificationStatus: row.organization.verificationStatus,
      },
      active: row.active,
      expiresAt: row.expiresAt,
      usageRemaining,
    };
  }

  async join(code: string, joiningOrganizationId: string) {
    const row = await this.prisma.networkCode.findUnique({
      where: { code },
    });
    if (!row) throw new NotFoundException("code_not_found");
    if (!row.active) throw new BadRequestException("code_inactive");
    if (row.expiresAt && row.expiresAt < new Date()) {
      throw new BadRequestException("code_expired");
    }
    if (
      row.usageLimit != null &&
      row.usageCount >= row.usageLimit
    ) {
      throw new BadRequestException("usage_limit_reached");
    }

    await this.prisma.networkCode.update({
      where: { id: row.id },
      data: { usageCount: { increment: 1 } },
    });

    await this.signals.networkCodeUsed(
      code,
      row.organizationId,
      joiningOrganizationId,
    );

    return this.relationships.invite({
      requesterOrganizationId: joiningOrganizationId,
      receiverOrganizationId: row.organizationId,
      source: "NETWORK_CODE",
    });
  }
}
