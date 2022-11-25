/*
  Warnings:

  - You are about to drop the column `receiptState` on the `Invoice` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "receiptState",
ADD COLUMN     "receiptStatus" TEXT;
