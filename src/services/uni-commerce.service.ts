import { Injectable } from '@nestjs/common';
import { prisma } from '~/lib/prisma';
import { PrismaService } from '~/services/prisma.service';
import { MD5 } from 'crypto-js';
import { request } from '~/lib/request';
import * as _ from 'lodash';
import { debug, uniq } from '~/lib/utils';
@Injectable()
export class UniCommerceService {
  constructor(private prismaService: PrismaService) {}

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
    debug('商品信息', {
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
    });
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
   *
   * @param orderNo 发货
   * @param sendOrderInfo
   */
  async shipOrder(orderNo: string, packingList?: any) {
    const order = await prisma.order.findUnique({
      where: { orderNo },
      include: { orderDetails: true },
    });
    if (!order) {
      throw new Error('订单不存在');
    }
    const invoice: Omit<Invoice, 'delivered'> & { sendType: 1 } = {
      sendOrderNo: `INVOICE-${uniq()}`,
      state: '1',
      sendState: 1,
      sendType: 1,
      logisticsType: 3,
      curPage: '1',
      totalPage: '1',
      packingList: [
        {
          pPackingNo: `PACKING-${uniq()}`,
          packingType: 1,
          content:
            packingList ||
            order.orderDetails.map((item) => ({
              sku: item.sku,
              p_sku: item.p_sku,
              num: item.num,
            })),
        },
      ],
    };
    const { pSendOrderNo } = await this.invoke<
      { orderNo: string; sendOrderInfo: string },
      { pSendOrderNo: string }
    >('saveDeliveryInfoNew', {
      orderNo,
      sendOrderInfo: JSON.stringify(invoice),
    });
    await prisma.invoice.create({
      data: { ...invoice, pSendOrderNo, order: { connect: { orderNo } } },
    });
  }
  /**
   * 查询发货单状态
   * @param p_sendOrderList 平台发货单号列表
   */
  async getInvoice(p_sendOrderList: string[]) {
    const items = await this.invoke<
      { p_sendOrderList: string },
      {
        receiptState: string;
        state: string;
        sendOrderNo: string;
        logisticsCom?: string;
        logisticsNo?: string;
        skus: string;
        receiptSkus: string;
      }[]
    >('querySendOrderInfo', {
      p_sendOrderList: p_sendOrderList.join(','),
    });
    for (const { sendOrderNo, ...rest } of items) {
      await prisma.invoice.update({
        data: rest,
        where: { sendOrderNo },
      });
    }
  }
  /**
   * 获取发货单详情
   * @param duration 间隔时间
   */
  async getInvoiceSummary(duration: [string, string]) {
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
  }
  /**
   * 订单妥投
   * @param orderNo  订单号
   */
  async confirmOrder(
    sendOrderNo: string,
    info: Pick<
      Delivered,
      | 'deliveredName'
      | 'deliveredMobile'
      | 'deliveredTime'
      | 'remark'
      | 'signer'
      | 'signMobile'
      | 'attachment'
    >,
  ) {
    const invoice = await prisma.invoice.findUnique({
      where: { sendOrderNo },
      include: { order: true },
    });
    if (!invoice) {
      throw new Error('发货单不存在');
    }
    const delivered = {
      deliveredId: `DELIVERY-${uniq()}`,
      orderNo: invoice.order.orderNo,
      p_sendOrderNo: invoice.pSendOrderNo,
      ...info,
    };
    await this.invoke<typeof delivered, null>('submitDeliveredInfo', delivered);
    await prisma.delivered.create({
      data: {
        ..._.omit(delivered, ['orderNo']),
        order: {
          connect: {
            orderNo: invoice.order.orderNo,
          },
        },
        invoice: {
          connect: {
            sendOrderNo: invoice.sendOrderNo,
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
    sendOrderNo: string,
    info: { msgTime: string; content: string }[],
  ) {
    const invoice = await prisma.invoice.findUnique({
      where: {
        sendOrderNo,
      },
    });
    if (!invoice) {
      throw new Error('发货单不存在');
    }
    await this.invoke<{ p_sendOrderNo: string; info: string }, null>(
      'submitLogisticsInfo',
      {
        p_sendOrderNo: invoice.pSendOrderNo,
        info: JSON.stringify(info),
      },
    );
    for (const item of info) {
      await prisma.logistics.create({
        data: {
          ...item,
          invoice: {
            connect: {
              sendOrderNo,
            },
          },
        },
      });
    }
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
      // await removeMessages(dealed);
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
    debug('发生错误', message);
    await prisma.error.create({
      data: {
        method,
        message,
      },
    });
  }
}
