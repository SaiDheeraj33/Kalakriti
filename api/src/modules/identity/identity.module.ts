import { Module } from "@nestjs/common";
import { AddressesModule } from "./addresses/addresses.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [AuthModule, UsersModule, AddressesModule],
})
export class IdentityModule {}
