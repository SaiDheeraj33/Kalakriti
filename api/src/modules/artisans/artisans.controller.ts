import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { IsArray, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { UserRole } from "@prisma/client";
import { CurrentUser } from "../../shared/decorators/current-user.decorator";
import { Public } from "../../shared/decorators/public.decorator";
import { Roles } from "../../shared/decorators/roles.decorator";
import { PrismaService } from "../../shared/prisma.service";

export class ApplyArtisanDto {
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  displayName!: string;

  @IsArray()
  @IsString({ each: true })
  crafts!: string[];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  state?: string;
}

@Controller("artisans")
export class ArtisansController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  listVerified() {
    return this.prisma.artisanProfile.findMany({
      where: { verified: true },
      orderBy: { createdAt: "asc" },
      select: {
        slug: true,
        displayName: true,
        bio: true,
        crafts: true,
        city: true,
        state: true,
        yearsOfExperience: true,
        _count: { select: { products: { where: { status: "ACTIVE" } } } },
      },
    });
  }

  @Post("apply")
  async apply(@CurrentUser("sub") userId: string, @Body() dto: ApplyArtisanDto) {
    const existing = await this.prisma.artisanProfile.findUnique({ where: { userId } });
    if (existing) throw new ForbiddenException("Already applied");

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ForbiddenException("User not found");

    const base = dto.displayName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const slug = `${base || "artisan"}-${userId.slice(-4)}`;

    return this.prisma.artisanProfile.create({
      data: { ...dto, userId, slug, verified: false },
    });
  }

  @Get("me")
  async me(@CurrentUser("sub") userId: string) {
    const profile = await this.prisma.artisanProfile.findUnique({
      where: { userId },
      include: {
        products: {
          select: { id: true, slug: true, title: true, status: true, basePriceMinor: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!profile) throw new ForbiddenException("No artisan profile - apply first");
    return profile;
  }

  @Patch("me")
  async updateMine(@CurrentUser("sub") userId: string, @Body() dto: ApplyArtisanDto) {
    const profile = await this.prisma.artisanProfile.findUnique({ where: { userId } });
    if (!profile) throw new ForbiddenException("No artisan profile");
    const data: Record<string, unknown> = {};
    if (dto.displayName !== undefined) data.displayName = dto.displayName;
    if (dto.bio !== undefined) data.bio = dto.bio;
    if (dto.crafts !== undefined) data.crafts = dto.crafts;
    if (dto.city !== undefined) data.city = dto.city;
    if (dto.state !== undefined) data.state = dto.state;
    return this.prisma.artisanProfile.update({ where: { userId }, data });
  }

  @Roles(UserRole.ADMIN)
  @Patch(":id/verify")
  async verify(@Param("id") id: string) {
    const profile = await this.prisma.artisanProfile.findUnique({ where: { id } });
    if (!profile) throw new NotFoundException("Artisan profile not found");
    if (profile.verified) throw new BadRequestException("Already verified");

    await this.prisma.$transaction([
      this.prisma.artisanProfile.update({
        where: { id },
        data: { verified: true },
      }),
      this.prisma.user.update({
        where: { id: profile.userId },
        data: { role: UserRole.ARTISAN },
      }),
    ]);
    return { id, verified: true };
  }
}
