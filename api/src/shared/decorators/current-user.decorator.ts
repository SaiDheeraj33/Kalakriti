import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { AccessPayload } from "../types";

export const CurrentUser = createParamDecorator(
  (data: keyof AccessPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return data ? request.user?.[data] : request.user;
  }
);
