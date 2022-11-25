import {
  Bind,
  Body,
  Controller,
  InternalServerErrorException,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import _ from 'lodash';
import { prisma } from '~/lib/prisma';
import { getEntities } from '~/lib/request';
import { UniCommerceService } from '~/services/uni-commerce.service';
import * as qiniu from 'qiniu';
import * as url from 'url';
import dayjs from 'dayjs';
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
    const mac = new qiniu.auth.digest.Mac(
      process.env.qiniu_access_key,
      process.env.qiniu_secret_key,
    );
    const putPolicy = new qiniu.rs.PutPolicy({
      scope: process.env.qiniu_scope,
    });
    const uploadToken = putPolicy.uploadToken(mac);
    console.log(uploadToken);
    const formUploader = new qiniu.form_up.FormUploader(
      new qiniu.conf.Config({
        zone: qiniu.zone.Zone_z2,
      }),
    );

    return new Promise((resolve, reject) => {
      formUploader.put(
        uploadToken,
        `${Date.now()}-${file.originalname}`,
        file.buffer,
        new qiniu.form_up.PutExtra(),
        function (error, respBody, respInfo) {
          if (error) {
            throw new InternalServerErrorException(error.message);
          }

          if (respInfo.statusCode == 200) {
            const mac = new qiniu.auth.digest.Mac(
              process.env.qiniu_access_key,
              process.env.qiniu_secret_key,
            );
            const config = new qiniu.conf.Config();
            var bucketManager = new qiniu.rs.BucketManager(mac, config);
            var privateBucketDomain = process.env.qiniu_host;
            var deadline = Date.now() + 3600000;
            var privateDownloadUrl = bucketManager.privateDownloadUrl(
              privateBucketDomain,
              respBody.key,
              deadline,
            );
            resolve({
              url: new url.URL(privateDownloadUrl).href,
            });
          } else {
            throw new InternalServerErrorException(respInfo);
          }
        },
      );
    });
  }
}
