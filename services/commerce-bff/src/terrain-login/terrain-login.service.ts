import { normalizeCiPhone } from "../terrain-otp/phone-normalize.js";
import { verifyRegistrationToken } from "../terrain-otp/terrain-registration-store.js";
import { fetchCore } from "../core-client.js";

export type TerrainLoginInput = {
  phone: string;
  registrationToken?: string;
  actorRole: "DETAILLANT" | "GROSSISTE_B";
  devBypassOtp?: boolean;
};

export type TerrainLoginResult =
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

export async function loginTerrainSession(input: TerrainLoginInput): Promise<TerrainLoginResult> {
  const normalizedPhone = normalizeCiPhone(input.phone);
  if (!normalizedPhone) {
    return {
      ok: false,
      code: "invalid_phone",
      userMessage: "Numéro invalide. Utilisez un mobile ivoirien (+225).",
    };
  }

  const tokenOk =
    Boolean(input.registrationToken)
    && verifyRegistrationToken(normalizedPhone, String(input.registrationToken));
  const devBypass =
    process.env.NODE_ENV !== "production" && input.devBypassOtp === true && !input.registrationToken;

  if (!tokenOk && !devBypass) {
    return {
      ok: false,
      code: "otp_not_verified",
      userMessage: "Vérifiez votre numéro avec le code SMS avant de vous connecter.",
    };
  }

  const restorePath =
    input.actorRole === "GROSSISTE_B"
      ? "/commerce-foundation/grossiste-b/restore-session"
      : "/commerce-foundation/detaillant/restore-session";

  const upstream = await fetchCore<{ payload: { organizationId: string; profile: Record<string, unknown> } }>(
    restorePath,
    {
      method: "POST",
      body: JSON.stringify({ phone: input.phone }),
    },
  );

  if (!upstream.ok || !upstream.data?.payload?.organizationId) {
    return {
      ok: false,
      code: "account_not_found",
      userMessage: "Aucun compte trouvé pour ce numéro. Créez votre profil d'abord.",
    };
  }

  return {
    ok: true,
    organizationId: upstream.data.payload.organizationId,
    profile: upstream.data.payload.profile,
  };
}
