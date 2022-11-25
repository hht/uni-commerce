/*
  Warnings:

  - The `skus` column on the `Invoice` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `receiptSkus` column on the `Invoice` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "skus",
ADD COLUMN     "skus" JSONB,
DROP COLUMN "receiptSkus",
ADD COLUMN     "receiptSkus" JSONB;
