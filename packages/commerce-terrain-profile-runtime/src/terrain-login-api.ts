export type TerrainLoginActorRole = "DETAILLANT" | "GROSSISTE_B";

export type TerrainLoginResponse =
  | { ok: true; organizationId: string; profile: Record<string, unknown> }
  | { ok: false; code: string; userMessage: string };

export async function loginTerrainAccount(input: {
  phone: string;
  registrationToken?: string;
  actorRole: TerrainLoginActorRole;
  devBypassOtp?: boolean;
}): Promise<TerrainLoginResponse> {
  const res = await fetch("/api/auth/terrain/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  return (await res.json()) as TerrainLoginResponse;
}

export async function requestTerrainOtp(phone: string) {
  const res = await fetch("/api/auth/terrain/request-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ phone }),
  });
  return res.json() as Promise<
    | { ok: true; destinationHint: string }
    | { ok: false; userMessage: string }
  >;
}

export async function verifyTerrainOtp(phone: string, code: string) {
  const res = await fetch("/api/auth/terrain/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ phone, code }),
  });
  return res.json() as Promise<
    | { ok: true; registrationToken?: string }
    | { ok: false; userMessage: string }
  >;
}
