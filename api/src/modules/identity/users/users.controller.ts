import { Body, Controller, Get, Patch } from "@nestjs/common";
import { CurrentUser } from "../../../shared/decorators/current-user.decorator";
import { UsersService } from "./users.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  me(@CurrentUser("sub") userId: string) {
    return this.usersService.getMe(userId);
  }

  @Patch("me")
  updateMe(
    @CurrentUser("sub") userId: string,
    @Body() dto: UpdateProfileDto
  ) {
    return this.usersService.updateMe(userId, dto);
  }
}
