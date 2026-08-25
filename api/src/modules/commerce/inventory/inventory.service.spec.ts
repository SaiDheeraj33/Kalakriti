import { Test } from "@nestjs/testing";
import { ConflictException } from "@nestjs/common";
import { StockMovement } from "@prisma/client";
import { InventoryService } from "./inventory.service";
import { PrismaService } from "../../../shared/prisma.service";

describe("InventoryService", () => {
  let service: InventoryService;
  let prisma: {
    inventoryItem: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    stockLedgerEntry: { create: jest.Mock };
    $transaction: jest.Mock;
  };

  const item = (over: Partial<{ stock: number; reserved: number }> = {}) => ({
    id: "inv1",
    variantId: "var1",
    stock: 5,
    reserved: 0,
    lowStockThreshold: 2,
    updatedAt: new Date(),
    ...over,
  });

  beforeEach(async () => {
    prisma = {
      inventoryItem: { findUnique: jest.fn(), update: jest.fn() },
      stockLedgerEntry: { create: jest.fn() },
      $transaction: jest.fn().mockImplementation(async (ops) => ops),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [InventoryService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(InventoryService);
  });

  it("reserves within availability", async () => {
    prisma.inventoryItem.findUnique.mockResolvedValue(item({ stock: 5, reserved: 3 }));

    await service.reserve("var1", 2, "order_1");

    expect(prisma.inventoryItem.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { reserved: { increment: 2 } },
      })
    );
    expect(prisma.stockLedgerEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          reason: StockMovement.RESERVATION,
          reference: "order_1",
        }),
      })
    );
  });

  it("conflicts when requesting more than available", async () => {
    prisma.inventoryItem.findUnique.mockResolvedValue(item({ stock: 1, reserved: 1 }));

    await expect(service.reserve("var1", 1, "order_2")).rejects.toThrow(
      ConflictException
    );
  });

  it("commit decrements both stock and reserved with negative ledger delta", async () => {
    prisma.inventoryItem.findUnique.mockResolvedValue(item({ stock: 4, reserved: 2 }));

    await service.commit("var1", 2, "order_3");

    expect(prisma.inventoryItem.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { reserved: { decrement: 2 }, stock: { decrement: 2 } },
      })
    );
    expect(prisma.stockLedgerEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ delta: -2, reason: StockMovement.SALE }),
      })
    );
  });

  it("release never drives reserved below zero", async () => {
    prisma.inventoryItem.findUnique.mockResolvedValue(item({ reserved: 1 }));

    await service.release("var1", 5, "order_4");

    expect(prisma.inventoryItem.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { reserved: { decrement: 1 } } })
    );
  });
});
