import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

/**
 * Phone contact graph — mutual normalized handles lift suggestion scores (Instruction 9 §5).
 */
@Injectable()
export class ContactGraphAnalyzerService {
  constructor(private readonly prisma: PrismaService) {}

  normalizePhone(raw: string): string {
    const digits = raw.replace(/\D/g, "");
    if (digits.length < 8) return raw.trim();
    return `+${digits}`;
  }

  async syncContacts(userId: string, phones: string[]) {
    const rows = phones.map((p) => ({
      userId,
      normalizedPhone: this.normalizePhone(p),
    }));
    for (const r of rows) {
      await this.prisma.userContactSnapshot.upsert({
        where: {
          userId_normalizedPhone: { userId: r.userId, normalizedPhone: r.normalizedPhone },
        },
        create: r,
        update: {},
      });
    }
    return { userId, ingested: rows.length };
  }

  /**
   * Phones the given user has synced that are also held by ≥`minPeers` distinct users.
   * Instruction 9A — no global cross-user leak: only clusters touching `userId`'s snapshot set.
   */
  async mutualContactClustersForUser(userId: string, minPeers = 2) {
    const mine = await this.prisma.userContactSnapshot.findMany({
      where: { userId },
      select: { normalizedPhone: true },
    });
    const clusters: {
      normalizedPhone: string;
      userCount: number;
      users: { id: string; fullName: string | null; phoneNumber: string | null }[];
    }[] = [];
    for (const snap of mine) {
      const same = await this.prisma.userContactSnapshot.findMany({
        where: { normalizedPhone: snap.normalizedPhone },
        include: { user: { select: { id: true, fullName: true, phoneNumber: true } } },
      });
      if (same.length >= minPeers) {
        clusters.push({
          normalizedPhone: snap.normalizedPhone,
          userCount: same.length,
          users: same.map((s) => s.user),
        });
      }
    }
    return clusters;
  }

  /** Phones shared by ≥2 distinct VENEXT users (admin / diagnostics only — prefer mutualContactClustersForUser). */
  async mutualContactHandles(minUsers = 2) {
    const grouped = await this.prisma.userContactSnapshot.groupBy({
      by: ["normalizedPhone"],
      _count: { userId: true },
      having: { userId: { _count: { gte: minUsers } } },
    });
    const enriched = [];
    for (const g of grouped) {
      const snaps = await this.prisma.userContactSnapshot.findMany({
        where: { normalizedPhone: g.normalizedPhone },
        include: { user: { select: { id: true, fullName: true, phoneNumber: true } } },
      });
      enriched.push({
        normalizedPhone: g.normalizedPhone,
        userCount: g._count.userId,
        users: snaps.map((s) => s.user),
      });
    }
    return enriched;
  }
}
