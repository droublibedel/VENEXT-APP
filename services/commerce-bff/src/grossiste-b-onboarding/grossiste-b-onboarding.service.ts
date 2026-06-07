import { bffPostCommercialLocation } from "../commercial-location/commercial-location-store.js";
import { fetchCore } from "../core-client.js";
import { normalizeCiPhone } from "../terrain-otp/phone-normalize.js";
import { consumeRegistrationToken } from "../terrain-otp/terrain-registration-store.js";

export type CompleteGrossisteBOnboardingInput = {
  phone: string;
  registrationToken?: string;
  displayName: string;
  activities: string[];
  city: string;
  devBypassOtp?: boolean;
};

export type CompleteGrossisteBOnboardingResult =
  | {
      ok: true;
      organizationId: string;
      profile: Record<string, unknown>;
    }
  | {
      ok: false;
      code: string;
      userMessage: string;
    };

export async function completeGrossisteBOnboarding(
  input: CompleteGrossisteBOnboardingInput,
): Promise<CompleteGrossisteBOnboardingResult> {
  const normalizedPhone = normalizeCiPhone(input.phone);
  if (!normalizedPhone) {
    return {
      ok: false,
      code: "invalid_phone",
      userMessage: "Numéro invalide. Utilisez un mobile ivoirien (+225).",
    };
  }

  const tokenOk =
    Boolean(input.registrationToken) &&
    consumeRegistrationToken(normalizedPhone, String(input.registrationToken));
  const devBypass =
    process.env.NODE_ENV !== "production" && input.devBypassOtp === true && !input.registrationToken;

  if (!tokenOk && !devBypass) {
    return {
      ok: false,
      code: "otp_not_verified",
      userMessage: "Vérifiez votre numéro avec le code SMS avant de terminer l'inscription.",
    };
  }

  const upstream = await fetchCore<{
    payload: { organizationId: string; profile: Record<string, unknown> };
  }>("/commerce-foundation/grossiste-b/register", {
    method: "POST",
    body: JSON.stringify({
      phone: input.phone,
      displayName: input.displayName,
      activities: input.activities,
      city: input.city,
    }),
  });

  if (!upstream.ok || !upstream.data?.payload?.organizationId) {
    return {
      ok: false,
      code: "registration_failed",
      userMessage: "Impossible d'enregistrer votre profil pour le moment. Réessayez.",
    };
  }

  const { organizationId, profile } = upstream.data.payload;

  try {
    await bffPostCommercialLocation({
      actorId: organizationId,
      city: input.city,
      phone: input.phone,
    });
  } catch {
    // La localisation peut être complétée plus tard dans l'app.
  }

  return { ok: true, organizationId, profile };
}
