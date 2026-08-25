import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserRole, User } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../../../shared/prisma.service";
import type { AccessPayload, AuthResult, RefreshPayload } from "../../../shared/types";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new UnauthorizedException("An account with this email already exists");
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        name: dto.name,
        phone: dto.phone,
        role: UserRole.CUSTOMER,
      },
    });

    return this.buildAuthResult(user);
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException("Invalid credentials");

    return this.buildAuthResult(user);
  }

  async refresh(refreshToken: string): Promise<AuthResult> {
    let payload: RefreshPayload;
    try {
      payload = await this.jwtService.verifyAsync<RefreshPayload>(refreshToken, {
        secret: this.refreshSecret(),
      });
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
    if (payload.typ !== "refresh") {
      throw new UnauthorizedException("Wrong token type");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) throw new UnauthorizedException("User no longer exists");

    return this.buildAuthResult(user);
  }

  private buildAuthResult(user: User): AuthResult {
    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      accessToken: this.signAccess(user),
      refreshToken: this.signRefresh(user),
    };
  }

  private signAccess(user: User): string {
    const payload: Omit<AccessPayload, never> = {
      sub: user.id,
      email: user.email,
      role: user.role,
      typ: "access",
    };
    return this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_ACCESS_TTL ?? "900s",
    });
  }

  private signRefresh(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
      typ: "refresh" as const,
    };
    return this.jwtService.sign(payload, {
      secret: this.refreshSecret(),
      expiresIn: process.env.JWT_REFRESH_TTL ?? "30d",
    });
  }

  private refreshSecret(): string {
    return (
      process.env.JWT_REFRESH_SECRET ?? "dev-insecure-refresh-secret-change-me"
    );
  }
}
