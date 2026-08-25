import { Test } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import { UserRole, type User } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { AuthService } from "./auth.service";
import { PrismaService } from "../../../shared/prisma.service";

describe("AuthService", () => {
  let service: AuthService;
  let prisma: { user: { findUnique: jest.Mock; create: jest.Mock } };
  let jwt: { sign: jest.Mock; verifyAsync: jest.Mock };

  const dbUser: User = {
    id: "uid1",
    email: "asha@example.com",
    passwordHash: "$2a$10$hashedhash",
    name: "Asha Weaver",
    phone: null,
    role: UserRole.CUSTOMER,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };
    jwt = {
      sign: jest
        .fn()
        .mockImplementation((payload) => `token(${payload.typ ?? "?"})`),
      verifyAsync: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  describe("register", () => {
    it("creates a CUSTOMER and returns a token pair", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(dbUser);

      const result = await service.register({
        email: "Asha@Example.com",
        password: "saree-secret-1",
        name: "Asha Weaver",
      });

      expect(result.user).toEqual({
        id: "uid1",
        email: "asha@example.com",
        name: "Asha Weaver",
        role: UserRole.CUSTOMER,
      });
      expect(result.accessToken).toContain("access");
      expect(result.refreshToken).toContain("refresh");
      expect(prisma.user.create).toHaveBeenCalledTimes(1);
      const created = prisma.user.create.mock.calls[0][0].data;
      expect(created.role).toBe(UserRole.CUSTOMER);
      expect(created.passwordHash).not.toBe("saree-secret-1");
      expect(created.passwordHash.startsWith("$2")).toBe(true);
    });

    it("rejects duplicate email", async () => {
      prisma.user.findUnique.mockResolvedValue(dbUser);

      await expect(
        service.register({
          email: dbUser.email,
          password: "whatever123",
          name: "Dup",
        })
      ).rejects.toThrow(/already exists/);
    });
  });

  describe("login", () => {
    it("returns tokens on valid credentials", async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...dbUser,
        passwordHash: bcrypt.hashSync("correct-horse", 4),
      });

      const result = await service.login({
        email: dbUser.email,
        password: "correct-horse",
      });
      expect(result.accessToken).toContain("access");
    });

    it("rejects wrong password", async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...dbUser,
        passwordHash: bcrypt.hashSync("correct-horse", 4),
      });

      await expect(
        service.login({ email: dbUser.email, password: "wrong" })
      ).rejects.toThrow("Invalid credentials");
    });

    it("rejects unknown email", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.login({ email: "ghost@example.com", password: "x".repeat(8) })
      ).rejects.toThrow("Invalid credentials");
    });
  });

  describe("refresh", () => {
    it("rotates the pair for a valid refresh token", async () => {
      jwt.verifyAsync.mockResolvedValue({
        sub: dbUser.id,
        email: dbUser.email,
        typ: "refresh",
      });
      prisma.user.findUnique.mockResolvedValue(dbUser);

      const result = await service.refresh("valid-refresh-token");
      expect(result.refreshToken).toContain("refresh");
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({ typ: "access", role: UserRole.CUSTOMER }),
        expect.anything()
      );
    });

    it("rejects an access-type token used as refresh", async () => {
      jwt.verifyAsync.mockResolvedValue({ sub: dbUser.id, typ: "access" });

      await expect(service.refresh("an-access-token")).rejects.toThrow(
        "Wrong token type"
      );
    });
  });
});
