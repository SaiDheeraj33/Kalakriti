import { Test } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { AddressesService } from "./addresses.service";
import { PrismaService } from "../../../shared/prisma.service";

describe("AddressesService", () => {
  let service: AddressesService;
  let prisma: {
    address: {
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
      delete: jest.Mock;
      findFirst: jest.Mock;
      count: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      address: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        delete: jest.fn().mockResolvedValue({}),
        findFirst: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AddressesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(AddressesService);
  });

  it("scopes list() to the owning user", async () => {
    await service.list("user_a");
    expect(prisma.address.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user_a" } })
    );
  });

  it("first address becomes default automatically", async () => {
    prisma.address.count.mockResolvedValue(0);
    prisma.address.create.mockResolvedValue({ id: "addr1", isDefault: true });

    const created = await service.create("user_a", {
      line1: "12 Weaver Lane",
      city: "Kanchipuram",
      state: "Tamil Nadu",
      pincode: "631502",
    });
    expect(created.isDefault).toBe(true);
  });

  it("refuses to touch another user's address", async () => {
    prisma.address.findFirst.mockResolvedValue(null);

    await expect(
      service.update("user_b", "addr_of_user_a", { city: "Varanasi" })
    ).rejects.toThrow(NotFoundException);
    await expect(
      service.remove("user_b", "addr_of_user_a")
    ).rejects.toThrow(NotFoundException);
    expect(prisma.address.delete).not.toHaveBeenCalled();
  });
});
