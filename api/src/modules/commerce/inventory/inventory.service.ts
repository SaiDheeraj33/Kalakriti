import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { StockMovement } from "@prisma/client";
import { PrismaService } from "../../../shared/prisma.service";

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async availability(variantIds: string[]): Promise<Record<string, number>> {
    const items = await this.prisma.inventoryItem.findMany({
      where: { variantId: { in: variantIds } },
      select: { variantId: true, stock: true, reserved: true },
    });
    const map: Record<string, number> = {};
    for (const id of variantIds) map[id] = 0;
    for (const item of items) {
      map[item.variantId] = Math.max(0, item.stock - item.reserved);
    }
    return map;
  }

  async reserve(variantId: string, qty: number, reference: string): Promise<void> {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { variantId },
    });
    if (!item) throw new NotFoundException(`Variant ${variantId} has no inventory`);

    const available = item.stock - item.reserved;
    if (available < qty) {
      throw new ConflictException(
        `Only ${Math.max(0, available)} unit(s) available for this piece`
      );
    }

    await this.prisma.$transaction([
      this.prisma.inventoryItem.update({
        where: { variantId },
        data: { reserved: { increment: qty } },
      }),
      this.prisma.stockLedgerEntry.create({
        data: { itemId: item.id, delta: 0, reason: StockMovement.RESERVATION, reference },
      }),
    ]);
  }

  async release(variantId: string, qty: number, reference: string): Promise<void> {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { variantId },
    });
    if (!item) return;

    await this.prisma.$transaction([
      this.prisma.inventoryItem.update({
        where: { variantId },
        data: { reserved: { decrement: Math.min(qty, item.reserved) } },
      }),
      this.prisma.stockLedgerEntry.create({
        data: { itemId: item.id, delta: 0, reason: StockMovement.RELEASE, reference },
      }),
    ]);
  }

  async commit(variantId: string, qty: number, reference: string): Promise<void> {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { variantId },
    });
    if (!item) throw new NotFoundException(`Variant ${variantId} has no inventory`);

    const soldQty = Math.min(qty, item.reserved);
    await this.prisma.$transaction([
      this.prisma.inventoryItem.update({
        where: { variantId },
        data: {
          reserved: { decrement: soldQty },
          stock: { decrement: soldQty },
        },
      }),
      this.prisma.stockLedgerEntry.create({
        data: { itemId: item.id, delta: -soldQty, reason: StockMovement.SALE, reference },
      }),
    ]);
  }
}
