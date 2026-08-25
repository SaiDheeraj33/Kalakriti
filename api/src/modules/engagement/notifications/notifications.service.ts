import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../shared/prisma.service";

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  listMine(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
  }

  async markRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!notification) throw new NotFoundException("Notification not found");

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { status: "SENT", sentAt: new Date() },
    });
  }
}
