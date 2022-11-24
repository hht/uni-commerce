import { Bind, Body, Controller, Get, Param, Post } from '@nestjs/common';
import _ from 'lodash';
import { prisma } from '~/lib/prisma';
import { getEntities } from '~/lib/request';
import { UniCommerceService } from '~/services/uni-commerce.service';

@Controller()
export class UniCommerceController {
  constructor(private readonly service: UniCommerceService) {}

  @Get('/accessToken')
  async getAccessToken(): Promise<string> {
    return await this.service.getAccessToken();
  }
  @Post('/orders')
  @Bind(Body())
  getOrders(body: { skip: number; take: number }): Promise<any> {
    // throw new Error('Method not implemented.');
    return getEntities('Order', body);
  }
  @Post('/interface')
  @Bind(Body())
  getMessages(body: { id: OrderMessageType }): Promise<any> {
    return this.service.getMessages(body.id);
  }
}
