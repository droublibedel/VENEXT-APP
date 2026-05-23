import { Injectable } from "@nestjs/common";
import { EconomicSignalSource, EconomicSignalType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class EconomicSignalsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(filters?: {
    organizationId?: string;
    productId?: string;
    signalType?: EconomicSignalType;
    source?: EconomicSignalSource;
  }) {
    return this.prisma.economicSignal.findMany({
      where: {
        organizationId: filters?.organizationId,
        productId: filters?.productId,
        signalType: filters?.signalType,
        source: filters?.source,
      },
      orderBy: { createdAt: "desc" },
      take: 300,
    });
  }

  capture(payload: {
    signalType: EconomicSignalType;
    source: EconomicSignalSource;
    intensityScore: number;
    productId?: string;
    organizationId?: string;
    zoneCode?: string;
    metadata?: object;
  }) {
    return this.prisma.economicSignal.create({
      data: {
        signalType: payload.signalType,
        source: payload.source,
        intensityScore: payload.intensityScore,
        productId: payload.productId,
        organizationId: payload.organizationId,
        zoneCode: payload.zoneCode,
        metadata: payload.metadata ?? {},
      },
    });
  }
}
