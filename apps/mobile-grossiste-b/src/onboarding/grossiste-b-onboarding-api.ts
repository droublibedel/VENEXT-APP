export type CompleteGrossisteBRegistrationInput = {
  phone: string;
  registrationToken?: string;
  displayName: string;
  activities: string[];
  city: string;
  devBypassOtp?: boolean;
};

export type CompleteGrossisteBRegistrationResponse =
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

export async function completeGrossisteBRegistration(
  input: CompleteGrossisteBRegistrationInput,
): Promise<CompleteGrossisteBRegistrationResponse> {
  try {
    const res = await fetch("/api/grossiste-b/onboarding/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(input),
    });
    return (await res.json()) as CompleteGrossisteBRegistrationResponse;
  } catch {
    return {
      ok: false,
      code: "network_error",
      userMessage: "Connexion impossible. Vérifiez votre réseau et réessayez.",
    };
  }
}
