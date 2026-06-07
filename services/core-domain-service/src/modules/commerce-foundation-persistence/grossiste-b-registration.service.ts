import { BadRequestException, Injectable } from "@nestjs/common";

import { CommerceFoundationService } from "./commerce-foundation.service";

function normalizeCiPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  if (digits.startsWith("225")) {
    const local = digits.slice(3);
    if (local.length === 10 && local.startsWith("0")) return `225${local}`;
    if (local.length >= 8 && local.length <= 10) return `225${local}`;
    return null;
  }

  if (digits.startsWith("0") && digits.length === 10) {
    return `225${digits}`;
  }

  if (digits.startsWith("0") && digits.length >= 9 && digits.length <= 10) {
    return `225${digits.slice(1)}`;
  }

  if (digits.length >= 8 && digits.length <= 10) {
    return `225${digits}`;
  }

  return null;
}

export function buildGrossisteBOrganizationId(normalizedPhone: string): string {
  const suffix = normalizedPhone.replace(/\D/g, "").slice(-10);
  return `org-grossiste-b-${suffix}`;
}

export function buildGrossisteBProfileId(normalizedPhone: string): string {
  const suffix = normalizedPhone.replace(/\D/g, "").slice(-10);
  return `profile-grossiste-b-${suffix}`;
}

export type RegisterGrossisteBInput = {
  phone: string;
  displayName: string;
  activities: string[];
  city: string;
};

@Injectable()
export class GrossisteBRegistrationService {
  constructor(private readonly foundation: CommerceFoundationService) {}

  async register(input: RegisterGrossisteBInput) {
    const normalizedPhone = normalizeCiPhone(input.phone);
    if (!normalizedPhone) {
      throw new BadRequestException("Numéro de téléphone invalide.");
    }

    const displayName = input.displayName.trim();
    const city = input.city.trim();
    if (displayName.length < 2) {
      throw new BadRequestException("Nom d'affichage requis.");
    }
    if (city.length < 2) {
      throw new BadRequestException("Ville requise.");
    }

    const organizationId = buildGrossisteBOrganizationId(normalizedPhone);
    const profileId = buildGrossisteBProfileId(normalizedPhone);
    const now = new Date().toISOString();
    const existing = await this.foundation.getByKey<Record<string, unknown>>("ActorProfile", profileId);

    const localPhone =
      normalizedPhone.startsWith("2250") && normalizedPhone.length === 12
        ? normalizedPhone.slice(3)
        : normalizedPhone.replace(/^225/, "0");

    const profile = {
      id: profileId,
      actorRole: "GROSSISTE_B",
      displayName,
      phone: localPhone,
      city,
      activities: input.activities ?? [],
      businessName: displayName,
      onboardingCompleted: true,
      locale: "fr-CI",
      organizationId,
      createdAt: (existing?.createdAt as string | undefined) ?? now,
      updatedAt: now,
    };

    await this.foundation.upsert("ActorProfile", profileId, profile, {
      organizationId,
      actorRole: "GROSSISTE_B",
    });

    const wallet = await this.foundation.getByKey<Record<string, unknown>>("WalletDemoState", organizationId);
    if (!wallet) {
      await this.foundation.upsert(
        "WalletDemoState",
        organizationId,
        {
          organizationId,
          balanceFcfa: 0,
          availableLabel: "0 FCFA",
          walletActivated: false,
          walletDemoMode: true,
          securityMode: "LIGHT_COMMERCE_MODE",
          transactions: [],
          kycDemoCompleted: false,
          pinConfigured: false,
        },
        { organizationId },
      );
    }

    const contextKey = `ctx-${organizationId}`;
    const existingContext = await this.foundation.getByKey<Record<string, unknown>>(
      "CommercialContextState",
      contextKey,
    );
    if (!existingContext) {
      await this.foundation.upsert(
        "CommercialContextState",
        contextKey,
        {
          id: contextKey,
          actorId: organizationId,
          activeRelationshipId: null,
          history: [{ module: "onboarding", at: now }],
          lastWorkspace: "activity",
          updatedAt: now,
        },
        { organizationId },
      );
    }

    return { organizationId, profile };
  }

  async restoreSessionByPhone(phone: string) {
    const normalizedPhone = normalizeCiPhone(phone);
    if (!normalizedPhone) {
      throw new BadRequestException("Numéro de téléphone invalide.");
    }
    const profileId = buildGrossisteBProfileId(normalizedPhone);
    const existing = await this.foundation.getByKey<Record<string, unknown>>("ActorProfile", profileId);
    if (!existing?.onboardingCompleted) {
      throw new BadRequestException("Aucun compte grossiste trouvé pour ce numéro.");
    }
    return {
      organizationId: String(existing.organizationId ?? buildGrossisteBOrganizationId(normalizedPhone)),
      profile: existing,
    };
  }
}
