import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../shared/prisma.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";

const SAFE_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  phone: true,
  role: true,
  createdAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: SAFE_USER_SELECT,
    });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async updateMe(userId: string, dto: UpdateProfileDto) {
    await this.ensureExists(userId);
    return this.prisma.user.update({
      where: { id: userId },
      data: { name: dto.name, phone: dto.phone },
      select: SAFE_USER_SELECT,
    });
  }

  private async ensureExists(userId: string): Promise<void> {
    const found = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!found) throw new NotFoundException("User not found");
  }
}
