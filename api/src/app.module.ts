import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { APP_GUARD } from "@nestjs/core";
import { PrismaModule } from "./shared/prisma.module";
import { JwtAuthGuard } from "./shared/guards/jwt-auth.guard";
import { RolesGuard } from "./shared/guards/roles.guard";
import { HealthModule } from "./modules/health/health.module";
import { IdentityModule } from "./modules/identity/identity.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: [".env", "../../.env"],
    }),
    PrismaModule,
    JwtModule.register({
      global: true,
      secret:
        process.env.JWT_ACCESS_SECRET ?? "dev-insecure-access-secret-change-me",
      signOptions: {
        expiresIn: process.env.JWT_ACCESS_TTL ?? "900s",
      },
    }),
    HealthModule,
    IdentityModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
