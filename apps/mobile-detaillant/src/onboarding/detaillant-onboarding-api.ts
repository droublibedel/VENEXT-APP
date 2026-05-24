export type CompleteDetaillantRegistrationInput = {
  phone: string;
  registrationToken?: string;
  displayName: string;
  activities: string[];
  city: string;
  devBypassOtp?: boolean;
};

export type CompleteDetaillantRegistrationResponse =
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

export async function completeDetaillantRegistration(
  input: CompleteDetaillantRegistrationInput,
): Promise<CompleteDetaillantRegistrationResponse> {
  try {
    const res = await fetch("/api/detaillant/onboarding/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(input),
    });
    return (await res.json()) as CompleteDetaillantRegistrationResponse;
  } catch {
    return {
      ok: false,
      code: "network_error",
      userMessage: "Connexion impossible. Vérifiez votre réseau et réessayez.",
    };
  }
}
