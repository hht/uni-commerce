/*
  Warnings:

  - The `attachment` column on the `Delivered` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Delivered" ALTER COLUMN "deliveredTime" SET DATA TYPE TEXT,
DROP COLUMN "attachment",
ADD COLUMN     "attachment" JSONB;
