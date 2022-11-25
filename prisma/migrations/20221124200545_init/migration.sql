/*
  Warnings:

  - You are about to drop the column `logisticeComNo` on the `Invoice` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "logisticeComNo",
ADD COLUMN     "logisticsComNo" TEXT;
