import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../shared/prisma.service";
import { CreateAddressDto } from "./dto/create-address.dto";
import { UpdateAddressDto } from "./dto/update-address.dto";

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
  }

  async create(userId: string, dto: CreateAddressDto) {
    if (dto.isDefault) await this.clearDefault(userId);

    const count = await this.prisma.address.count({ where: { userId } });
    return this.prisma.address.create({
      data: { ...dto, userId, isDefault: dto.isDefault ?? count === 0 },
    });
  }

  async update(userId: string, addressId: string, dto: UpdateAddressDto) {
    await this.ensureOwned(userId, addressId);
    if (dto.isDefault) await this.clearDefault(userId);
    return this.prisma.address.update({
      where: { id: addressId },
      data: dto,
    });
  }

  async remove(userId: string, addressId: string): Promise<void> {
    await this.ensureOwned(userId, addressId);
    await this.prisma.address.delete({ where: { id: addressId } });
  }

  private async clearDefault(userId: string): Promise<void> {
    await this.prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  private async ensureOwned(userId: string, addressId: string): Promise<void> {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });
    if (!address) throw new NotFoundException("Address not found");
  }
}
