/*
  Warnings:

  - A unique constraint covering the columns `[pSendOrderNo]` on the table `Invoice` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Invoice_pSendOrderNo_key" ON "Invoice"("pSendOrderNo");
