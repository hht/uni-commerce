-- CreateTable
CREATE TABLE "Order" (
    "orderNo" TEXT NOT NULL,
    "orderState" TEXT NOT NULL DEFAULT '1',
    "hangupReason" TEXT NOT NULL DEFAULT '',
    "comName" TEXT NOT NULL,
    "comCode" TEXT NOT NULL,
    "comSubName" TEXT NOT NULL,
    "orgName" TEXT NOT NULL,
    "contractNo" TEXT NOT NULL,
    "ouName" TEXT,
    "createName" TEXT NOT NULL,
    "createNameMobile" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "county" TEXT NOT NULL,
    "town" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "fullAddress" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "remark" TEXT,
    "paymentType" TEXT NOT NULL,
    "invoiceState" TEXT NOT NULL,
    "invoiceType" TEXT NOT NULL,
    "selectedInvoiceTitle" TEXT NOT NULL,
    "companyName" TEXT,
    "invoiceContent" TEXT,
    "orderPrice" DECIMAL(65,30) NOT NULL,
    "orderNakedPrice" DECIMAL(65,30) NOT NULL,
    "orderTaxPrice" DECIMAL(65,30) NOT NULL,
    "realPrice" DECIMAL(65,30),
    "nakedRealPrice" DECIMAL(65,30),
    "drawBackPrice" DECIMAL(65,30),
    "nakedDrawBackPrice" DECIMAL(65,30),
    "bankNo" TEXT,
    "taxNo" TEXT,
    "companyAddress" TEXT,
    "companyTel" TEXT,
    "bankName" TEXT,
    "baneNo" TEXT,
    "bill_toer" TEXT,
    "bill_to_contact" TEXT,
    "bill_to_address" TEXT,
    "bill_to_email" TEXT,
    "bill_taxcode" TEXT,
    "bill_address" TEXT,
    "bill_tel" TEXT,
    "bill_bank" TEXT,
    "bill_bankno" TEXT,
    "receiveStatus" TEXT,
    "projectName" TEXT,
    "projectValue" TEXT,
    "extendField1" TEXT,
    "extendValue1" TEXT,
    "extendField2" TEXT,
    "extendValue2" TEXT,
    "extendField3" TEXT,
    "extendValue3" TEXT,
    "extendField4" TEXT,
    "extendValue4" TEXT,
    "extendField5" TEXT,
    "extendValue5" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("orderNo")
);

-- CreateTable
CREATE TABLE "OrderDetails" (
    "detailId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "p_sku" TEXT NOT NULL,
    "goods_code" TEXT,
    "snLength" TEXT NOT NULL,
    "goods_name" TEXT NOT NULL,
    "itemNumber" TEXT,
    "spec" JSONB,
    "num" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "nakedPrice" DECIMAL(65,30) NOT NULL,
    "taxPrice" DECIMAL(65,30) NOT NULL,
    "taxRate" DECIMAL(65,30) NOT NULL,
    "isPack" TEXT NOT NULL,
    "needCheckSn" TEXT,
    "unit" TEXT,
    "box_type" TEXT NOT NULL,
    "orderNo" TEXT NOT NULL,

    CONSTRAINT "OrderDetails_pkey" PRIMARY KEY ("detailId")
);

-- CreateTable
CREATE TABLE "Package" (
    "id" SERIAL NOT NULL,
    "eDetailId" TEXT NOT NULL,
    "eGoodName" TEXT NOT NULL,
    "eGoodsAlias" TEXT,
    "eSku" TEXT NOT NULL,
    "ePsku" TEXT,
    "eItemNumber" TEXT,
    "eNakedPrice" DECIMAL(65,30),
    "eUnitPrice" DECIMAL(65,30),
    "eTaxPrice" DECIMAL(65,30),
    "eTaxRate" DECIMAL(65,30),
    "eNum" TEXT,
    "eUnitOfMeasure" TEXT,
    "orderDetailsId" TEXT NOT NULL,

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "sendOrderNo" TEXT NOT NULL,
    "state" TEXT,
    "address" TEXT,
    "mobile" TEXT,
    "acceptName" TEXT,
    "sendTime" TEXT,
    "isDelivered" TEXT,
    "receiptStatus" TEXT,
    "sendState" TEXT,
    "sendType" TEXT,
    "logisticsType" TEXT,
    "logisticsCom" TEXT,
    "logisticsComNo" TEXT,
    "logisticsCompany" TEXT,
    "logisticsNo" TEXT,
    "logisticsUrl" TEXT,
    "orderTaxPrice" DECIMAL(65,30),
    "orderPrice" DECIMAL(65,30),
    "sendingContacts" TEXT,
    "curPage" TEXT,
    "orderNakedPrice" DECIMAL(65,30),
    "balanceStatus" TEXT,
    "totalPage" TEXT,
    "packingList" JSONB,
    "skus" JSONB,
    "boxs" JSONB,
    "receiptSkus" JSONB,
    "pSendOrderNo" TEXT NOT NULL,
    "orderNo" TEXT,
    "attachments" JSONB,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("sendOrderNo")
);

-- CreateTable
CREATE TABLE "Delivered" (
    "deliveredId" TEXT NOT NULL,
    "orderNo" TEXT NOT NULL,
    "sendOrderNo" TEXT NOT NULL,
    "p_sendOrderNo" TEXT,
    "deliveredName" TEXT NOT NULL,
    "deliveredMobile" TEXT NOT NULL,
    "deliveredTime" TEXT NOT NULL,
    "remark" TEXT,
    "signer" TEXT NOT NULL,
    "signMobile" TEXT NOT NULL,
    "attachment" JSONB,

    CONSTRAINT "Delivered_pkey" PRIMARY KEY ("deliveredId")
);

-- CreateTable
CREATE TABLE "Logistics" (
    "id" SERIAL NOT NULL,
    "sendOrderNo" TEXT NOT NULL,
    "msgTime" TEXT NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "Logistics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Config" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "Config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Error" (
    "id" SERIAL NOT NULL,
    "method" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Error_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_pSendOrderNo_key" ON "Invoice"("pSendOrderNo");

-- CreateIndex
CREATE UNIQUE INDEX "Delivered_sendOrderNo_key" ON "Delivered"("sendOrderNo");

-- CreateIndex
CREATE UNIQUE INDEX "Config_key_key" ON "Config"("key");

-- AddForeignKey
ALTER TABLE "OrderDetails" ADD CONSTRAINT "OrderDetails_orderNo_fkey" FOREIGN KEY ("orderNo") REFERENCES "Order"("orderNo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_orderDetailsId_fkey" FOREIGN KEY ("orderDetailsId") REFERENCES "OrderDetails"("detailId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_orderNo_fkey" FOREIGN KEY ("orderNo") REFERENCES "Order"("orderNo") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivered" ADD CONSTRAINT "Delivered_orderNo_fkey" FOREIGN KEY ("orderNo") REFERENCES "Order"("orderNo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivered" ADD CONSTRAINT "Delivered_sendOrderNo_fkey" FOREIGN KEY ("sendOrderNo") REFERENCES "Invoice"("sendOrderNo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Logistics" ADD CONSTRAINT "Logistics_sendOrderNo_fkey" FOREIGN KEY ("sendOrderNo") REFERENCES "Invoice"("sendOrderNo") ON DELETE RESTRICT ON UPDATE CASCADE;
