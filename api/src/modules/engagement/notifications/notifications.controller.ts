import {
  Controller,
  Get,
  Param,
  Patch,
} from "@nestjs/common";
import { CurrentUser } from "../../../shared/decorators/current-user.decorator";
import { NotificationsService } from "./notifications.service";

@Controller("notifications/me")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(@CurrentUser("sub") userId: string) {
    return this.notificationsService.listMine(userId);
  }

  @Patch(":id/read")
  markRead(@CurrentUser("sub") userId: string, @Param("id") id: string) {
    return this.notificationsService.markRead(userId, id);
  }
}
