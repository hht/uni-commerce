-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_orderNo_fkey";

-- AlterTable
ALTER TABLE "Invoice" ALTER COLUMN "orderNo" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_orderNo_fkey" FOREIGN KEY ("orderNo") REFERENCES "Order"("orderNo") ON DELETE SET NULL ON UPDATE CASCADE;
