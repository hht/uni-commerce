import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UniCommerceService } from './uni-commerce.service';

@Injectable()
export class CronService {
  constructor(private service: UniCommerceService) {}

  private readonly logger = new Logger(CronService.name);

  @Cron(CronExpression.EVERY_5_MINUTES)
  handleCron() {
    // COMMENTED: 每五分钟获取一次订单信息
    // this.service.getMessages('1');
  }
}
