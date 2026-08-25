import { UserRole } from "@prisma/client";

export interface AccessPayload {
  sub: string;
  email: string;
  role: UserRole;
  typ: "access";
}

export interface RefreshPayload {
  sub: string;
  email: string;
  typ: "refresh";
}

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

export interface AuthResult extends TokenPair {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
}
