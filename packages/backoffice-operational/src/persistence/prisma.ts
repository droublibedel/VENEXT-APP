import { Prisma, PrismaClient } from "@prisma/client";

/** Cast objet métier → JSON Prisma (Instruction BACKOFFICE-01-A). */
export function toPrismaJson(value: Record<string, unknown> | undefined): Prisma.InputJsonValue {
  return (value ?? {}) as Prisma.InputJsonValue;
}

let client: PrismaClient | null = null;

export function getBackofficePrisma(): PrismaClient {
  if (!client) {
    client = new PrismaClient();
  }
  return client;
}

export async function disconnectBackofficePrisma(): Promise<void> {
  if (client) {
    await client.$disconnect();
    client = null;
  }
}
