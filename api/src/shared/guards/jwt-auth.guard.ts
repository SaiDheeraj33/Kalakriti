import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import type { AccessPayload } from "../types";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const token = this.extractBearerToken(request);
    if (!token) throw new UnauthorizedException("Missing bearer token");

    try {
      const payload = await this.jwtService.verifyAsync<AccessPayload>(token);
      if (payload.typ !== "access") throw new Error("wrong token type");
      request.user = payload;
    } catch {
      throw new UnauthorizedException("Invalid or expired token");
    }
    return true;
  }

  private extractBearerToken(request: {
    headers: Record<string, string | string[] | undefined>;
  }): string | null {
    const header = request.headers?.authorization;
    if (typeof header !== "string") return null;
    const [scheme, token] = header.split(" ");
    return scheme?.toLowerCase() === "bearer" ? (token ?? null) : null;
  }
}
