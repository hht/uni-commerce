import { Controller, Get } from '@nestjs/common';
import { UniCommerceService } from '~/services/uni-commerce.service';

@Controller()
export class UniCommerceController {
  constructor(private readonly service: UniCommerceService) {}

  @Get('/accessToken')
  async getAccessToken(): Promise<string> {
    return await this.service.getAccessToken();
  }
}
