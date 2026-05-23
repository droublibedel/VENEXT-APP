import { Injectable } from "@nestjs/common";
import {
  EconomicSignalSource,
  EconomicSignalType,
  Prisma,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class GraphSignalsService {
  constructor(private readonly prisma: PrismaService) {}

  async emit(params: {
    signalType: EconomicSignalType;
    source: EconomicSignalSource;
    intensityScore: number;
    organizationId?: string;
    productId?: string;
    zoneCode?: string;
    metadata?: Prisma.InputJsonValue;
  }) {
    return this.prisma.economicSignal.create({
      data: {
        signalType: params.signalType,
        source: params.source,
        intensityScore: params.intensityScore,
        organizationId: params.organizationId,
        productId: params.productId,
        zoneCode: params.zoneCode,
        metadata: params.metadata ?? {},
      },
    });
  }

  invitationSent(relationshipId: string, orgId: string) {
    return this.emit({
      signalType: EconomicSignalType.RELATIONSHIP_GROWTH,
      source: EconomicSignalSource.EXTERNAL_CONTEXT,
      intensityScore: 0.35,
      organizationId: orgId,
      metadata: { phase: "invitation_sent", relationshipId },
    });
  }

  invitationAccepted(relationshipId: string, orgId: string) {
    return this.emit({
      signalType: EconomicSignalType.TRUST_SIGNAL,
      source: EconomicSignalSource.EXTERNAL_CONTEXT,
      intensityScore: 0.72,
      organizationId: orgId,
      metadata: { phase: "relationship_accepted", relationshipId },
    });
  }

  networkCodeUsed(code: string, ownerOrgId: string, joiningOrgId: string) {
    return this.emit({
      signalType: EconomicSignalType.NETWORK_EXPANSION,
      source: EconomicSignalSource.EXTERNAL_CONTEXT,
      intensityScore: 0.55,
      organizationId: ownerOrgId,
      metadata: {
        code,
        joiningOrganizationId: joiningOrgId,
      },
    });
  }

  contactSuggestionsGenerated(userId: string, count: number) {
    return this.emit({
      signalType: EconomicSignalType.RELATIONSHIP_GROWTH,
      source: EconomicSignalSource.EXTERNAL_CONTEXT,
      intensityScore: Math.min(1, 0.2 + count * 0.05),
      metadata: { phase: "contact_suggestions", userId, count },
    });
  }

  catalogPreviewViewed(viewerOrgId: string, peerOrgId: string) {
    return this.emit({
      signalType: EconomicSignalType.PRODUCT_VIEW,
      source: EconomicSignalSource.CATALOG,
      intensityScore: 0.25,
      organizationId: viewerOrgId,
      metadata: {
        phase: "relationship_profile_preview",
        peerOrganizationId: peerOrgId,
      },
    });
  }
}
