import { Injectable } from '@nestjs/common';
import {
  Prisma,
  Order,
  OrderDetails,
  Invoice,
  Delivered,
} from '@prisma/client';
import { prisma } from '~/lib/prisma';
import { PrismaService } from '~/services/prisma.service';
import { MD5 } from 'crypto-js';
import { request } from '~/lib/request';

@Injectable()
export class UniCommerceService {
  constructor(private prisma: PrismaService) {}

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

  async getOrders() {}
}
