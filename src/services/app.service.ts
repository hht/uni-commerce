import { Injectable } from '@nestjs/common';
import { prisma } from '~/lib/prisma';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World! NestJS';
  }
  async getLog() {
    return await prisma.error.findMany();
  }
}
