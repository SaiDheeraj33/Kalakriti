import { Body, Controller, Get, Param, Patch, Query } from "@nestjs/common";
import { IsEnum } from "class-validator";
import { OrderStatus, UserRole } from "@prisma/client";
import { Roles } from "../../shared/decorators/roles.decorator";
import { AdminService } from "./admin.service";

class TransitionDto {
  @IsEnum(OrderStatus)
  status!: OrderStatus;
}

@Controller("admin")
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("stats")
  stats() {
    return this.adminService.stats();
  }

  @Get("orders")
  orders(@Query("status") status?: OrderStatus, @Query("page") page?: string) {
    return this.adminService.listOrders(status, Number(page ?? 1) || 1);
  }

  @Patch("orders/:number/status")
  transition(@Param("number") number: string, @Body() dto: TransitionDto) {
    return this.adminService.transitionOrder(number, dto.status);
  }
}
