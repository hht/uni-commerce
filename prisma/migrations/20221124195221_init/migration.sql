/*
  Warnings:

  - You are about to drop the column `logistivsNo` on the `Invoice` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "logistivsNo",
ADD COLUMN     "logisticsNo" TEXT,
ALTER COLUMN "sendState" DROP NOT NULL,
ALTER COLUMN "sendType" DROP NOT NULL,
ALTER COLUMN "logisticsType" DROP NOT NULL,
ALTER COLUMN "curPage" DROP NOT NULL,
ALTER COLUMN "totalPage" DROP NOT NULL,
ALTER COLUMN "packingList" DROP NOT NULL;
