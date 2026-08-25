import { Module } from "@nestjs/common";
import { NotificationsController } from "./notifications/notifications.controller";
import { NotificationsService } from "./notifications/notifications.service";
import { ReviewsController } from "./reviews/reviews.controller";
import { ReviewsService } from "./reviews/reviews.service";
import { WishlistController } from "./wishlist/wishlist.controller";
import { WishlistService } from "./wishlist/wishlist.service";

@Module({
  controllers: [ReviewsController, WishlistController, NotificationsController],
  providers: [ReviewsService, WishlistService, NotificationsService],
})
export class EngagementModule {}
