/*
  Warnings:

  - Added the required column `orderDetailsId` to the `Package` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Package" DROP CONSTRAINT "Package_eDetailId_fkey";

-- AlterTable
ALTER TABLE "Package" ADD COLUMN     "orderDetailsId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_orderDetailsId_fkey" FOREIGN KEY ("orderDetailsId") REFERENCES "OrderDetails"("detailId") ON DELETE CASCADE ON UPDATE CASCADE;
