import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { AccessPayload } from "../../../shared/types";

@Injectable()
export class OptionalAuthGuard {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: { switchToHttp(): { getRequest(): unknown } }): Promise<boolean> {
    const request = context.switchToHttp().getRequest() as {
      headers: Record<string, string | string[] | undefined>;
      user?: AccessPayload;
    };
    const header = request.headers?.authorization;
    const token =
      typeof header === "string" && header.toLowerCase().startsWith("bearer ")
        ? header.slice(7).trim()
        : null;
    if (!token) return true;

    try {
      const payload = await this.jwtService.verifyAsync<AccessPayload>(token);
      if (payload.typ !== "access") return true;
      request.user = payload;
    } catch {
      throw new UnauthorizedException("Invalid or expired token");
    }
    return true;
  }
}
