import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { prisma } from '~/lib/prisma';
import { PrismaService } from '~/services/prisma.service';
import { MD5 } from 'crypto-js';
import { request } from '~/lib/request';
import * as _ from 'lodash';
import * as qiniu from 'qiniu';
import * as url from 'url';
import { uniq } from '~/lib/utils';
import * as fs from 'fs';
import * as path from 'path';
@Injectable()
export class UniCommerceService {
  constructor(private prismaService: PrismaService) {}

  /**
   * 获取token
   * @returns 返回的token值
   */
  async getAccessToken(): Promise<string> {
    const accecc_token = await prisma.config.findUnique({
      where: {
        key: 'access_token',
      },
    });
    if (accecc_token) {
      return accecc_token.value;
    }
    const response = await request<AccessTokenResponse>('/accessToken/v1', {
      ACCESS_TOKEN_REQ: {
        response_type: 'token',
        client_id: process.env.client_id,
        client_secret: process.env.client_secret,
        corp_id: MD5(process.env.corp_id).toString(),
      },
    });
    if (response.ACCESS_TOKEN_RSP.success) {
      const accessToken = response.ACCESS_TOKEN_RSP.result.access_token;
      await prisma.config.upsert({
        create: {
          key: 'access_token',
          value: accessToken,
        },
        update: {
          value: accessToken,
        },
        where: {
          key: 'access_token',
        },
      });
      return accessToken;
    } else {
      throw new Error(response.ACCESS_TOKEN_RSP.resultMessage);
    }
  }

  /**
   *
   * @returns 刷新token
   */
  async refreshAccessToken() {
    await prisma.config.delete({
      where: {
        key: 'access_token',
      },
    });
    return await this.getAccessToken();
  }

  /**
   * 调用业务接口
   * @param method 业务接口名称
   * @param data 数据
   * @returns 返回值
   */
  async invoke<S, T>(method: string, data: S): Promise<T> {
    const access_token = await this.getAccessToken();
    const response = await request<ProviderRespose<T>>('/providerApi/v1', {
      PROVIDER_API_REQ: {
        token: access_token,
        method,
        ...data,
      },
    });
    /**
     * 调用成功返回业务数据
     */
    if (response.PROVIDER_API_RSP.success) {
      return response.PROVIDER_API_RSP.result;
    }
    /**
     * 如果token失效，二秒后重新获取token并重新执行请求
     */
    if (response.PROVIDER_API_RSP.resultCode === '2002') {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await this.refreshAccessToken();
      return await this.invoke(method, data);
    }
    /**
     * 抛出业务错误
     */
    throw new Error(response.PROVIDER_API_RSP.resultMessage);
  }

  /**
   * 获取订单详情
   * @param orderNo 订单号
   */
  async getOrder(orderNo: string) {
    const response = await this.invoke<{ orderNo: string }, Order>(
      'queryOrderInfo',
      {
        orderNo,
      },
    );
    const orderDetails = response.orderDetails;
    const order = _.omit(response, ['orderDetails', 'orderType']) as Order;
    if (!order) {
      throw new Error('订单不存在');
    }
    await prisma.order.upsert({
      create: {
        ...order,
        orderDetails: {
          create: orderDetails.map((details) => {
            return {
              ..._.omit(details, 'linePackInfo'),
              linePackInfo: {
                create: details.linePackInfo || [],
              },
            };
          }),
        },
      },
      update: {
        ...order,
        orderDetails: {
          deleteMany: {},
          create: orderDetails.map((details) => {
            return {
              ..._.omit(details, 'linePackInfo'),
              linePackInfo: {
                create: details.linePackInfo || [],
              },
            };
          }),
        },
      },
      where: {
        orderNo: order.orderNo,
      },
    });
  }
  /**
   * 发货
   * @param orderNo 发货单号
   * @param sendOrderInfo
   */
  async shipOrder(request: any) {
    const order = await prisma.order.findUnique({
      where: { orderNo: request.orderNo },
      include: { orderDetails: true },
    });
    if (!order) {
      throw new Error('订单不存在');
    }
    const invoice: Omit<Invoice, 'delivered'> & { sendType: '1' } = {
      ...request,
      state: '1',
      sendState: '1',
      sendType: '1',
      logisticsType: '3',
      curPage: '1',
      totalPage: '1',
    };
    const { pSendOrderNo } = await this.invoke<
      { orderNo: string; sendOrderInfo: string },
      { pSendOrderNo: string }
    >('saveDeliveryInfoNew', {
      orderNo: request.orderNo,
      sendOrderInfo: JSON.stringify(invoice),
    });
    await prisma.invoice.create({
      data: {
        ..._.omit(invoice, 'orderNo'),
        pSendOrderNo,
        order: { connect: { orderNo: request.orderNo } },
      },
    });
    await this.getInvoiceDetail(pSendOrderNo);
  }

  /**
   * 查询发货单状态
   * @param p_sendOrderList 平台发货单号列表
   */
  async getInvoice(p_sendOrderList: string) {
    const items = await this.invoke<
      { p_sendOrderList: string },
      {
        orderNo: string;
        state: string;
        sendOrderNo: string;
        p_sendOrderNo: string;
        logisticsCom?: string;
        logisticsNo?: string;
        skus: string;
        receiptState: string;
        receiptSkus: string;
      }[]
    >('querySendOrderInfo', {
      p_sendOrderList,
    });
    for (const item of items) {
      const { p_sendOrderNo, orderNo, receiptState, sendOrderNo, ...invoice } =
        item;
      const presist = await prisma.invoice.upsert({
        create: {
          ...invoice,
          sendOrderNo,
          receiptStatus: receiptState,
          pSendOrderNo: item.p_sendOrderNo,
        },
        update: {
          ...invoice,
          receiptStatus: receiptState,
          pSendOrderNo: item.p_sendOrderNo,
        },
        where: { pSendOrderNo: item.p_sendOrderNo },
      });
      await this.getInvoiceDetail(presist.pSendOrderNo);
    }

    return items;
  }

  /**
   * 获取发货单概要
   * @param duration 间隔时间
   */
  async getInvoiceSummaries(duration: [string, string]) {
    const info = {
      beginTime: duration[0],
      endTime: duration[1],
      comCode: process.env.corp_id,
    };
    const items = await this.invoke<
      typeof info,
      {
        p_sendOrderNo: string;
        orderNo: string;
        state: string;
        sendState: string;
        isDelivered: string;
        receiptStatus: string;
        orderPrice: number;
        orderNakedPrice: number;
        orderTaxPrice: number;
        sendTime: string;
      }[]
    >('querySendOrderNoByTime', info);

    // TODO: 保存发货单信息

    return { data: items, total: items.length };
  }

  /**
   * 查询发货单详情
   * @param p_sendOrderNo 平台发货单号
   */
  async getInvoiceDetail(p_sendOrderNo: string) {
    const items = await this.invoke<
      { p_sendOrderNo: string },
      {
        receiptStatus: string;
        state: string;
        sendOrderNo: string;
        logisticsCom?: string;
        logisticsNo?: string;
        skus: string;
        receiptSkus: string;
        p_sendOrderNo: string;
        orderNo: string;
      }[]
    >('querySendOrderInfoByNo', {
      p_sendOrderNo,
    });
    for (const item of items) {
      const { p_sendOrderNo, orderNo, ...invoice } = item;
      await prisma.invoice.update({
        data: {
          ..._.omit(invoice, 'sendOrderNo'),
          order: {
            connect: { orderNo },
          },
        },
        where: {
          pSendOrderNo: p_sendOrderNo,
        },
      });
    }

    return items;
  }
  /**
   * 订单妥投
   * @param orderNo  订单号
   */
  async confirmInvoice(
    info: Pick<
      Delivered,
      | 'deliveredId'
      | 'deliveredName'
      | 'deliveredMobile'
      | 'deliveredTime'
      | 'remark'
      | 'signer'
      | 'signMobile'
      | 'attachment'
      | 'p_sendOrderNo'
    > & { orderNo: string; attachment: { url: string; key: string }[] },
  ) {
    await this.invoke<
      Omit<typeof info, 'attachment'> & { attachment: string },
      null
    >('submitDeliveredInfo', {
      ...info,
      attachment: info.attachment.map((it) => encodeURI(it.url)).join(','),
    });
    await this.getInvoiceDetail(info.p_sendOrderNo);
    info.attachment.forEach((it) => {
      this.removeLocalFile(it.key);
    });
    await prisma.delivered.create({
      data: {
        ..._.omit(info, ['orderNo']),
        order: {
          connect: {
            orderNo: info.orderNo,
          },
        },
        invoice: {
          connect: {
            pSendOrderNo: info.p_sendOrderNo,
          },
        },
      },
    });
  }
  /**
   * 推送物流信息
   * @param sendOrderNo 发货单号
   * @param info 物流信息列表
   */
  async appendLogistics(
    p_sendOrderNo: string,
    logisticsInfo: { msgTime: string; content: string }[],
  ) {
    await this.invoke<{ p_sendOrderNo: string; logisticsInfo: string }, null>(
      'submitLogisticsInfo',
      {
        p_sendOrderNo,
        logisticsInfo: JSON.stringify(logisticsInfo),
      },
    );
  }
  /**
   * 获取消息列表
   * @param type 消息类型
   * @param is_del 是否立即删除消息
   */
  async getMessages(type: OrderMessageType, is_del?: 0 | 1) {
    const response = await this.invoke<OrdersRequest, Message<OrderMessage>[]>(
      'getOrderPushMsg',
      {
        type,
        is_del: is_del || 0,
      },
    );
    if (response.length) {
      const dealed: string[] = [];
      switch (type) {
        case '1':
          for (const {
            msgId,
            msgInfo: { orderNo },
          } of response) {
            try {
              await this.getOrder(orderNo);
              dealed.push(msgId);
            } catch (e: any) {
              this.handleError('订单信息处理失败', e.message);
            }
          }
          break;
        default:
      }
      // COMMENTED: 删除已处理的消息
      // await this.removeMessages(dealed);
    }
    return response;
  }

  /**
   * 删除推送消息
   * @param msgIds 消息ID列表
   */
  async removeMessages(msgIds: string[]) {
    await this.invoke<{ msgIds: string }, Message<null>>('delOrderPushMsg', {
      msgIds: msgIds.join(','),
    });
  }
  /**
   * 记录错误信息
   * @param method 方法名
   * @param message 错误信息
   */
  async handleError(method: string, message: string) {
    await prisma.error.create({
      data: {
        method,
        message,
      },
    });
  }
  /**
   * 查询物流信息接口
   */
  async getLogistics() {
    const response = await this.invoke<null, any>('queryLogisticsComs', null);
    return { data: response, total: response.length };
  }
  /**
   * 上传文件
   */
  async uploadFile(file: Express.Multer.File) {
    const mac = new qiniu.auth.digest.Mac(
      process.env.qiniu_access_key,
      process.env.qiniu_secret_key,
    );
    const putPolicy = new qiniu.rs.PutPolicy({
      scope: process.env.qiniu_scope,
    });
    const uploadToken = putPolicy.uploadToken(mac);
    const formUploader = new qiniu.form_up.FormUploader(
      new qiniu.conf.Config({
        zone: qiniu.zone.Zone_z1,
      }),
    );

    return new Promise((resolve, reject) => {
      formUploader.put(
        uploadToken,
        `${Date.now()}-${file.originalname}`,
        file.buffer,
        new qiniu.form_up.PutExtra(),
        (error, respBody, respInfo) => {
          if (error) {
            reject(error);
          }

          if (respInfo.statusCode == 200) {
            const mac = new qiniu.auth.digest.Mac(
              process.env.qiniu_access_key,
              process.env.qiniu_secret_key,
            );
            const config = new qiniu.conf.Config();
            const bucketManager = new qiniu.rs.BucketManager(mac, config);
            const privateBucketDomain = process.env.qiniu_host;
            const deadline = Date.now() + 3600000;
            const privateDownloadUrl = bucketManager.privateDownloadUrl(
              privateBucketDomain,
              respBody.key,
              deadline,
            );
            resolve({
              url: new url.URL(privateDownloadUrl).href,
              key: respBody.key,
            });
          } else {
            reject({ message: respBody.error });
          }
        },
      );
    });
  }
  /**
   * 删除文件
   */
  async removeFile(key: string) {
    const mac = new qiniu.auth.digest.Mac(
      process.env.qiniu_access_key,
      process.env.qiniu_secret_key,
    );
    const config = new qiniu.conf.Config();
    const bucketManager = new qiniu.rs.BucketManager(mac, config);
    return new Promise((resolve, reject) => {
      bucketManager.delete(
        process.env.qiniu_scope,
        key,
        (error, respBody, respInfo) => {
          if (error) {
            reject(error);
          }
          if (respInfo.statusCode == 200) {
            resolve(respBody);
          } else {
            reject({ message: respBody.error });
          }
        },
      );
    });
  }

  /**
   * 上传文件到本地
   */
  async uploadLocalFile(file: Express.Multer.File) {
    const filename = `${uniq()}-${file.originalname}`;
    await fs.writeFileSync(
      path.resolve(__dirname, '../../attachments/', filename),
      file.buffer,
    );
    return {
      url: new url.URL(`${process.env.host_name}/attachments/${filename}`).href,
      key: filename,
    };
  }
  /**
   * 删除本地文件
   */
  async removeLocalFile(key: string) {
    await fs.unlinkSync(path.resolve(__dirname, '../../attachments/', key));
  }

  /**
   * 输出错误日志
   */
  async getErrors() {
    return prisma.error.findMany();
  }
}
