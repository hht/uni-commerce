/*
  Warnings:

  - You are about to drop the column `orderDetailsId` on the `Package` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "OrderDetails" DROP CONSTRAINT "OrderDetails_orderNo_fkey";

-- DropForeignKey
ALTER TABLE "Package" DROP CONSTRAINT "Package_orderDetailsId_fkey";

-- AlterTable
ALTER TABLE "Package" DROP COLUMN "orderDetailsId",
ALTER COLUMN "eDetailId" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "OrderDetails" ADD CONSTRAINT "OrderDetails_orderNo_fkey" FOREIGN KEY ("orderNo") REFERENCES "Order"("orderNo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_eDetailId_fkey" FOREIGN KEY ("eDetailId") REFERENCES "OrderDetails"("detailId") ON DELETE CASCADE ON UPDATE CASCADE;
