import {
  Bind,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import _ from 'lodash';
import { getEntities } from '~/lib/request';
import { UniCommerceService } from '~/services/uni-commerce.service';
@Controller()
export class UniCommerceController {
  constructor(private readonly service: UniCommerceService) {}

  @Post('/orders')
  @Bind(Body())
  getOrders(body: { skip: number; take: number }): Promise<any> {
    return getEntities('Order', {
      ...body,
      include: {
        orderDetails: {
          include: {
            linePackInfo: true,
          },
        },
        invoice: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }
  @Post('/order')
  @Bind(Body())
  getOrder(body: { orderNo: string }): Promise<any> {
    return this.service.getOrder(body.orderNo);
  }
  @Post('/ship-order')
  @Bind(Body())
  shipOrder(body): Promise<any> {
    return this.service.shipOrder(body);
  }
  @Post('/invoices')
  @Bind(Body())
  getInvoices(body: { skip: number; take: number }): Promise<any> {
    return getEntities('Invoice', {
      ...body,
      orderBy: {
        sendTime: 'desc',
      },
    });
  }
  @Post('/invoice')
  @Bind(Body())
  getInvoice(body: { p_sendOrderNo: string }): Promise<any> {
    return this.service.getInvoice(body.p_sendOrderNo);
  }
  @Post('/invoice-summaries')
  @Bind(Body())
  getInvoiceSummaries(body: { duration: [string, string] }): Promise<any> {
    return this.service.getInvoiceSummaries(body.duration);
  }

  @Post('/append-logistics')
  @Bind(Body())
  appendLogistics(body: {
    p_sendOrderNo: string;
    logisticsInfo: any;
  }): Promise<any> {
    return this.service.appendLogistics(body.p_sendOrderNo, body.logisticsInfo);
  }

  @Post('/confirm-invoice')
  @Bind(Body())
  confirmInvoice(body: any): Promise<any> {
    return this.service.confirmInvoice(body);
  }

  @Post('/interface')
  @Bind(Body())
  getMessages(body: { id: OrderMessageType }): Promise<any> {
    return this.service.getMessages(body.id);
  }

  @Post('/upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File) {
    return this.service.uploadFile(file);
  }

  @Post('/logistics')
  getLogistics(): Promise<any> {
    return this.service.getLogistics();
  }
}
