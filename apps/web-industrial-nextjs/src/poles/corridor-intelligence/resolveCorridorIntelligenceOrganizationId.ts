"use client";

export function resolveCorridorIntelligenceOrganizationId(): { organizationId: string } {
  const organizationId =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_CORRIDOR_INTELLIGENCE_ORGANIZATION_ID?.trim()) ||
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_COMMERCIAL_TRUST_ORGANIZATION_ID?.trim()) ||
    "";
  return { organizationId };
}
