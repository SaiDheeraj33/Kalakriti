-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "cartToken" TEXT;

-- CreateIndex
CREATE INDEX "Order_cartToken_idx" ON "Order"("cartToken");
