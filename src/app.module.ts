import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from '~/controllers/app.controller';
import { AppService } from '~/services/app.service';
import { UniCommerceController } from '~/controllers/uni-commerce.controller';
import { UniCommerceService } from '~/services/uni-commerce.service';
import { PrismaService } from '~/services/prisma.service';
import { CronService } from '~/services/cron.service';
@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [AppController, UniCommerceController],
  providers: [AppService, CronService, PrismaService, UniCommerceService],
})
export class AppModule {}
