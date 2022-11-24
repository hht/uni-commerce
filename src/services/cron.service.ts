import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { debug } from '~/lib/utils';
import { UniCommerceService } from './uni-commerce.service';

@Injectable()
export class CronService {
  constructor(private service: UniCommerceService) {}

  private readonly logger = new Logger(CronService.name);
  // @Cron(CronExpression.EVERY_12_HOURS)
  // handleCron() {
  //   this.getMessages('1');
  //   this.logger.debug('每5秒执行一次任务');
  // }
  /**
   * 获取消息列表
   * @param type 消息类型
   * @param is_del 是否立即删除消息
   */
  async getMessages(type: OrderMessageType, is_del?: 0 | 1) {
    const response = await this.service.invoke<
      OrdersRequest,
      Message<OrderMessage>[]
    >('getOrderPushMsg', {
      type,
      is_del: is_del || 0,
    });
    if (response.length) {
      const dealed: string[] = [];
      switch (type) {
        case '1':
          for (const {
            msgId,
            msgInfo: { orderNo },
          } of response) {
            try {
              await this.service.getOrder(orderNo);
              dealed.push(msgId);
            } catch (e: any) {
              debug('订单信息处理失败', e.message);
            }
          }
          break;
        default:
      }
      // await removeMessages(dealed);
    }
  }
  async removeMessages(msgIds: string[]) {
    await this.service.invoke<{ msgIds: string }, Message<null>>(
      'delOrderPushMsg',
      {
        msgIds: msgIds.join(','),
      },
    );
  }
}
