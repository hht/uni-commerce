-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "acceptName" TEXT,
ADD COLUMN     "address" TEXT,
ADD COLUMN     "attachments" JSONB,
ADD COLUMN     "balanceStatus" TEXT,
ADD COLUMN     "isDelivered" TEXT,
ADD COLUMN     "mobile" TEXT,
ADD COLUMN     "orderNakedPrice" DECIMAL(65,30),
ADD COLUMN     "orderPrice" DECIMAL(65,30),
ADD COLUMN     "orderTaxPrice" DECIMAL(65,30),
ADD COLUMN     "sendTime" TIMESTAMP(3),
ALTER COLUMN "sendState" SET DATA TYPE TEXT,
ALTER COLUMN "sendType" SET DATA TYPE TEXT,
ALTER COLUMN "logisticsType" SET DATA TYPE TEXT;
