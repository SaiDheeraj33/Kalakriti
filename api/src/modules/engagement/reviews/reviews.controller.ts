import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ReviewStatus, UserRole } from "@prisma/client";
import { Public } from "../../../shared/decorators/public.decorator";
import { CurrentUser } from "../../../shared/decorators/current-user.decorator";
import { Roles } from "../../../shared/decorators/roles.decorator";
import { CreateReviewDto } from "./dto/create-review.dto";
import { ReviewsService } from "./reviews.service";

@Controller("reviews")
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Public()
  @Get()
  list(@Query("productId") productId: string) {
    return this.reviewsService.listByProduct(productId);
  }

  @Post()
  create(@CurrentUser("sub") userId: string, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(userId, dto);
  }

  @Roles(UserRole.ADMIN)
  @Patch(":id/moderate")
  moderate(@Param("id") id: string) {
    return this.reviewsService.moderate(id, ReviewStatus.APPROVED);
  }

  @Roles(UserRole.ADMIN)
  @Patch(":id/reject")
  reject(@Param("id") id: string) {
    return this.reviewsService.moderate(id, ReviewStatus.REJECTED);
  }
}
