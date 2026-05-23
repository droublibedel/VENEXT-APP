import { randomInt } from "node:crypto";

type OrgCommercialIdLookup = {
  findUnique: (args: {
    where: { commercialId: string };
    select?: { id: boolean };
  }) => Promise<{ id: string } | null>;
};

/** Ten-digit numeric string (may include leading zeros). */
export function generateTenDigitCommercialId(): string {
  const n = randomInt(0, 10_000_000_000);
  return String(n).padStart(10, "0");
}

export function isValidCommercialIdFormat(value: string): boolean {
  return /^\d{10}$/.test(normalizeCommercialId(value));
}

export function normalizeCommercialId(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Allocate a globally unique commercialId (retry on collision).
 */
export async function allocateUniqueCommercialId(
  organizations: OrgCommercialIdLookup,
): Promise<string> {
  for (let attempt = 0; attempt < 40; attempt++) {
    const candidate = generateTenDigitCommercialId();
    const exists = await organizations.findUnique({
      where: { commercialId: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;
  }
  throw new Error("commercial_id_allocation_exhausted");
}
