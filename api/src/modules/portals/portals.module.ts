import { Module } from "@nestjs/common";
import { AdminController } from "../admin/admin.controller";
import { AdminService } from "../admin/admin.service";
import { ArtisansController } from "../artisans/artisans.controller";

@Module({
  controllers: [AdminController, ArtisansController],
  providers: [AdminService],
})
export class PortalsModule {}
