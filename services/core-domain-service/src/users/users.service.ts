import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

const userSelect = {
  id: true,
  phoneNumber: true,
  phoneVerified: true,
  email: true,
  fullName: true,
  avatarUrl: true,
  preferredLanguage: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      select: userSelect,
      orderBy: { createdAt: "desc" },
      take: 500,
    });
  }

  async findOne(id: string) {
    const row = await this.prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });
    if (!row) throw new NotFoundException(id);
    return row;
  }
}
